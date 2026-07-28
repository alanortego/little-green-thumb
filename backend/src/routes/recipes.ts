import { Router } from 'express';
import type Database from 'better-sqlite3';
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

function loadRecipeWithSteps(db: Database.Database, recipeId: number): RecipeWithSteps | undefined {
  const recipe = db.prepare<[number], RecipeRow>('SELECT * FROM recipes WHERE id = ?').get(recipeId);
  if (!recipe) {
    return undefined; 
  }
  const steps = db
    .prepare<[number], RecipeStepRow>(
      'SELECT * FROM recipe_steps WHERE recipe_id = ? ORDER BY step_order',
    )
    .all(recipeId);
  const plantIds = db
    .prepare<[number], { plant_id: number }>('SELECT plant_id FROM recipe_plants WHERE recipe_id = ?')
    .all(recipeId)
    .map((row) => row.plant_id);
  return { ...recipe, steps, plantIds };
}

/** Replace a recipe's steps and linked plants inside a transaction (used by create + update). */
function replaceStepsAndPlants(
  db: Database.Database,
  recipeId: number,
  steps: StepInput[],
  plantIds: number[],
): void {
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM recipe_steps WHERE recipe_id = ?').run(recipeId);
    const insertStep = db.prepare(
      `INSERT INTO recipe_steps (recipe_id, step_order, image_path, step_text)
       VALUES (?, ?, ?, ?)`,
    );
    for (const step of steps) {
      insertStep.run(
        recipeId,
        step.stepOrder,
        step.imagePath ?? null,
        step.stepText ?? null,
      );
    }

    db.prepare('DELETE FROM recipe_plants WHERE recipe_id = ?').run(recipeId);
    const insertPlant = db.prepare('INSERT INTO recipe_plants (recipe_id, plant_id) VALUES (?, ?)');
    for (const plantId of plantIds) {
      insertPlant.run(recipeId, plantId);
    }
  });
  tx();
}

/** Fields FR-016 requires before a Recipe can be published: at least one step and
 * one linked plant, plus a picture on every step. */
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

export function createRecipesRouter(db: Database.Database): Router {
  const router = Router();

  // GET /plants/:id/recipes — the "See Recipes" pathway (FR-003).
  router.get('/plants/:id/recipes', requireAuth, (req, res) => {
    const plantId = String(req.params.id);
    const includeDrafts = req.session.role === 'admin' && req.query.includeDrafts === '1';
    const recipes = db
      .prepare<[string], RecipeRow>(
        `SELECT r.* FROM recipes r
         JOIN recipe_plants rp ON rp.recipe_id = r.id
         WHERE rp.plant_id = ? ${includeDrafts ? '' : 'AND r.is_published = 1'}
         ORDER BY r.name`,
      )
      .all(plantId);
    res.json(recipes);
  });

  // GET /recipes/:id — recipe detail with ordered steps.
  router.get('/recipes/:id', requireAuth, (req, res) => {
    const recipe = loadRecipeWithSteps(db, Number(req.params.id));
    if (!recipe) {
      res.status(404).json({ error: 'recipe_not_found' });
      return;
    }
    res.json(recipe);
  });

  // POST /recipes — create a draft Recipe with its steps and linked plants (FR-015). Admin-only.
  router.post('/recipes', requireRole('admin'), (req, res) => {
    const { name, plantIds, steps } = req.body as {
      name?: string;
      plantIds?: number[];
      steps?: StepInput[];
    };
    if (!name) {
      res.status(400).json({ error: 'name_required' });
      return;
    }

    const info = db
      .prepare('INSERT INTO recipes (name, created_by) VALUES (?, ?)')
      .run(name, req.session.userId as number);
    const recipeId = info.lastInsertRowid as number;
    replaceStepsAndPlants(db, recipeId, steps ?? [], plantIds ?? []);

    res.status(201).json(loadRecipeWithSteps(db, recipeId));
  });

  // PUT /recipes/:id — replace name/steps/linked plants (FR-015). Admin-only.
  router.put('/recipes/:id', requireRole('admin'), (req, res) => {
    const recipeId = Number(req.params.id);
    const existing = db.prepare<[number], RecipeRow>('SELECT * FROM recipes WHERE id = ?').get(recipeId);
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

    db.prepare(
      `UPDATE recipes SET
         name = COALESCE(?, name),
         image_path = COALESCE(?, image_path),
         updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       WHERE id = ?`,
    ).run(name ?? null, imagePath ?? null, recipeId);

    if (steps !== undefined || plantIds !== undefined) {
      const current = loadRecipeWithSteps(db, recipeId)!;
      const nextSteps =
        steps
        ?? current.steps.map((s) => ({
          stepOrder: s.step_order,
          imagePath: s.image_path,
          stepText: s.step_text,
        }));
      const nextPlantIds =
        plantIds
        ?? db
          .prepare<[number], { plant_id: number }>('SELECT plant_id FROM recipe_plants WHERE recipe_id = ?')
          .all(recipeId)
          .map((r) => r.plant_id);
      replaceStepsAndPlants(db, recipeId, nextSteps, nextPlantIds);
    }

    res.json(loadRecipeWithSteps(db, recipeId));
  });

  // POST /recipes/:id/publish — field-gated publish (FR-016). Admin-only.
  router.post('/recipes/:id/publish', requireRole('admin'), (req, res) => {
    const recipe = loadRecipeWithSteps(db, Number(req.params.id));
    if (!recipe) {
      res.status(404).json({ error: 'recipe_not_found' });
      return;
    }

    const missingFields = missingRecipeFields(recipe);
    if (missingFields.length > 0) {
      res.status(422).json({ error: 'missing_required_fields', missingFields });
      return;
    }

    db.prepare('UPDATE recipes SET is_published = 1 WHERE id = ?').run(recipe.id);
    res.json(loadRecipeWithSteps(db, recipe.id));
  });

  return router;
}
