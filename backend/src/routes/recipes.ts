import { Router } from 'express';
import type { Pool, PoolClient } from 'pg';
import type { Db } from '../db/connection.js';
import { requireAuth, requireRole } from '../middleware/roleGuard.js';
import type { RecipeRow, RecipeStepRow } from '../models/types.js';

interface RecipeWithSteps extends RecipeRow {
  steps: RecipeStepRow[];
  plantIds: number[];
}

interface StepInput {
  stepOrder: number;
  imagePath?: string | null;
  stepText?: string | null;
}

async function loadRecipeWithSteps(db: Db, recipeId: number): Promise<RecipeWithSteps | undefined> {
  const recipe = (await db.query<RecipeRow>('SELECT * FROM recipes WHERE id = $1', [recipeId])).rows[0];
  if (!recipe) {
    return undefined;
  }
  const steps = (
    await db.query<RecipeStepRow>(
      'SELECT * FROM recipe_steps WHERE recipe_id = $1 ORDER BY step_order',
      [recipeId],
    )
  ).rows;
  const plantIds = (
    await db.query<{ plant_id: number }>(
      'SELECT plant_id FROM recipe_plants WHERE recipe_id = $1',
      [recipeId],
    )
  ).rows.map((row) => row.plant_id);
  return { ...recipe, steps, plantIds };
}

async function replaceStepsAndPlants(
  db: Pool,
  recipeId: number,
  steps: StepInput[],
  plantIds: number[],
): Promise<void> {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await replaceStepsAndPlantsInTransaction(client, recipeId, steps, plantIds);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function replaceStepsAndPlantsInTransaction(
  db: PoolClient,
  recipeId: number,
  steps: StepInput[],
  plantIds: number[],
): Promise<void> {
  await db.query('DELETE FROM recipe_steps WHERE recipe_id = $1', [recipeId]);
  for (const step of steps) {
    await db.query(
      `INSERT INTO recipe_steps (recipe_id, step_order, image_path, step_text)
       VALUES ($1, $2, $3, $4)`,
      [recipeId, step.stepOrder, step.imagePath ?? null, step.stepText ?? null],
    );
  }

  await db.query('DELETE FROM recipe_plants WHERE recipe_id = $1', [recipeId]);
  for (const plantId of plantIds) {
    await db.query('INSERT INTO recipe_plants (recipe_id, plant_id) VALUES ($1, $2)', [recipeId, plantId]);
  }
}

function missingRecipeFields(recipe: RecipeWithSteps): string[] {
  const missing: string[] = [];
  if (recipe.steps.length === 0) {
    missing.push('steps');
  }
  recipe.steps.forEach((step, index) => {
    if (!step.image_path) {
      missing.push(`step_${index + 1}_image_path`);
    }
  });
  return missing;
}

export function createRecipesRouter(db: Pool): Router {
  const router = Router();

  router.get('/plants/:id/recipes', requireAuth, async (req, res) => {
    const includeDrafts = req.session.role === 'admin' && req.query.includeDrafts === '1';
    const recipes = (
      await db.query<RecipeRow>(
        `SELECT r.* FROM recipes r
         JOIN recipe_plants rp ON rp.recipe_id = r.id
         WHERE rp.plant_id = $1 ${includeDrafts ? '' : 'AND r.is_published = TRUE'}
         ORDER BY r.name`,
        [req.params.id],
      )
    ).rows;
    res.json(recipes);
  });

  router.get('/recipes/:id', requireAuth, async (req, res) => {
    const recipe = await loadRecipeWithSteps(db, Number(req.params.id));
    if (!recipe) {
      res.status(404).json({ error: 'recipe_not_found' });
      return;
    }
    res.json(recipe);
  });

  router.post('/recipes', requireRole('admin'), async (req, res) => {
    const { name, plantIds, steps } = req.body as {
      name?: string;
      plantIds?: number[];
      steps?: StepInput[];
    };
    if (!name) {
      res.status(400).json({ error: 'name_required' });
      return;
    }

    const client = await db.connect();
    let recipeId: number;
    try {
      await client.query('BEGIN');
      recipeId = (
        await client.query<{ id: number }>(
          'INSERT INTO recipes (name, created_by) VALUES ($1, $2) RETURNING id',
          [name, req.session.userId],
        )
      ).rows[0].id;
      await replaceStepsAndPlantsInTransaction(client, recipeId, steps ?? [], plantIds ?? []);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    res.status(201).json(await loadRecipeWithSteps(db, recipeId!));
  });

  router.put('/recipes/:id', requireRole('admin'), async (req, res) => {
    const recipeId = Number(req.params.id);
    const existing = (await db.query<RecipeRow>('SELECT * FROM recipes WHERE id = $1', [recipeId])).rows[0];
    if (!existing) {
      res.status(404).json({ error: 'recipe_not_found' });
      return;
    }

    const { name, imagePath, plantIds, steps } = req.body as {
      name?: string;
      imagePath?: string | null;
      plantIds?: number[];
      steps?: StepInput[];
    };

    await db.query(
      `UPDATE recipes SET
         name = COALESCE($1, name),
         image_path = COALESCE($2, image_path),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [name ?? null, imagePath ?? null, recipeId],
    );

    if (steps !== undefined || plantIds !== undefined) {
      const current = (await loadRecipeWithSteps(db, recipeId))!;
      const nextSteps =
        steps
        ?? current.steps.map((step) => ({
          stepOrder: step.step_order,
          imagePath: step.image_path,
          stepText: step.step_text,
        }));
      const nextPlantIds = plantIds ?? current.plantIds;
      await replaceStepsAndPlants(db, recipeId, nextSteps, nextPlantIds);
    }

    res.json(await loadRecipeWithSteps(db, recipeId));
  });

  router.post('/recipes/:id/publish', requireRole('admin'), async (req, res) => {
    const recipe = await loadRecipeWithSteps(db, Number(req.params.id));
    if (!recipe) {
      res.status(404).json({ error: 'recipe_not_found' });
      return;
    }

    const missingFields = missingRecipeFields(recipe);
    if (missingFields.length > 0) {
      res.status(422).json({ error: 'missing_required_fields', missingFields });
      return;
    }

    await db.query(
      'UPDATE recipes SET is_published = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [recipe.id],
    );
    res.json(await loadRecipeWithSteps(db, recipe.id));
  });

  return router;
}
