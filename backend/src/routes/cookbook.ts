import { Router } from 'express';
import type { Request } from 'express';
import type { Pool } from 'pg';
import { requireAuth } from '../middleware/roleGuard.js';
import { logActivity } from '../services/activityLog.js';
import { canAccessStudent } from '../services/studentAccess.js';
import type { CookbookEntryRow } from '../models/types.js';

const SORTS: Record<string, string> = {
  newest: 'ce.created_at DESC',
  alphabetical: 'r.name ASC',
  rating: 'ce.rating DESC, ce.created_at DESC',
};

function actorTypeFor(req: Request): 'student' | 'teacher' | 'parent' | 'admin' {
  return req.session.role === 'child' ? 'student' : (req.session.role ?? 'student');
}

export function createCookbookRouter(db: Pool): Router {
  const router = Router();

  router.post('/students/:id/cookbook', requireAuth, async (req, res) => {
    const studentId = Number(req.params.id);
    if (!(await canAccessStudent(req, db, studentId))) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const { recipeId } = req.body as { recipeId?: number };
    if (!recipeId) {
      res.status(400).json({ error: 'recipe_id_required' });
      return;
    }

    const existing = (
      await db.query<CookbookEntryRow>(
        'SELECT * FROM cookbook_entries WHERE student_id = $1 AND recipe_id = $2',
        [studentId, recipeId],
      )
    ).rows[0];
    if (existing) {
      res.status(200).json(existing);
      return;
    }

    const addedBy = req.session.role === 'child' ? 'student' : (req.session.role as 'teacher' | 'parent');
    const created = (
      await db.query<CookbookEntryRow>(
        `INSERT INTO cookbook_entries (student_id, recipe_id, added_by)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [studentId, recipeId, addedBy],
      )
    ).rows[0];

    await logActivity(db, {
      actorType: actorTypeFor(req),
      actorId: req.session.role === 'child' ? studentId : (req.session.userId ?? studentId),
      action: 'recipe_added_to_cookbook',
      contentType: 'recipe',
      contentId: recipeId,
    });

    res.status(201).json(created);
  });

  router.get('/students/:id/cookbook', requireAuth, async (req, res) => {
    const studentId = Number(req.params.id);
    if (!(await canAccessStudent(req, db, studentId))) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const { filterPlantId, filterMade, sort } = req.query as {
      filterPlantId?: string;
      filterMade?: string;
      sort?: string;
    };

    const conditions = ['ce.student_id = $1'];
    const params: (string | number | boolean)[] = [studentId];

    if (filterPlantId) {
      conditions.push(
        `EXISTS (
          SELECT 1 FROM recipe_plants rp
          WHERE rp.recipe_id = ce.recipe_id AND rp.plant_id = $${params.length + 1}
        )`,
      );
      params.push(Number(filterPlantId));
    }
    if (filterMade === 'true' || filterMade === 'false') {
      conditions.push(`ce.is_made = $${params.length + 1}`);
      params.push(filterMade === 'true');
    }

    const orderBy = SORTS[sort ?? ''] ?? SORTS.newest;
    const entries = (
      await db.query(
        `SELECT ce.*, r.name AS recipe_name, r.image_path AS recipe_image_path
         FROM cookbook_entries ce
         JOIN recipes r ON r.id = ce.recipe_id
         WHERE ${conditions.join(' AND ')}
         ORDER BY ${orderBy}`,
        params,
      )
    ).rows;

    res.json(entries);
  });

  router.post('/cookbook/:entryId/made', requireAuth, async (req, res) => {
    const entry = (
      await db.query<CookbookEntryRow>('SELECT * FROM cookbook_entries WHERE id = $1', [req.params.entryId])
    ).rows[0];
    if (!entry) {
      res.status(404).json({ error: 'entry_not_found' });
      return;
    }
    if (!(await canAccessStudent(req, db, entry.student_id))) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const updated = (
      await db.query<CookbookEntryRow>(
        `UPDATE cookbook_entries
         SET is_made = TRUE, made_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [entry.id],
      )
    ).rows[0];

    await logActivity(db, {
      actorType: actorTypeFor(req),
      actorId: req.session.role === 'child' ? entry.student_id : (req.session.userId ?? entry.student_id),
      action: 'recipe_made',
      contentType: 'recipe',
      contentId: entry.recipe_id,
    });

    res.json(updated);
  });

  router.post('/cookbook/:entryId/rating', requireAuth, async (req, res) => {
    const entry = (
      await db.query<CookbookEntryRow>('SELECT * FROM cookbook_entries WHERE id = $1', [req.params.entryId])
    ).rows[0];
    if (!entry) {
      res.status(404).json({ error: 'entry_not_found' });
      return;
    }
    if (!(await canAccessStudent(req, db, entry.student_id))) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const { rating } = req.body as { rating?: number };
    if (!rating || rating < 1 || rating > 3) {
      res.status(400).json({ error: 'rating_must_be_1_to_3' });
      return;
    }
    if (!entry.is_made) {
      res.status(400).json({ error: 'not_yet_made' });
      return;
    }

    const updated = (
      await db.query<CookbookEntryRow>(
        `UPDATE cookbook_entries
         SET rating = $1, rated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [rating, entry.id],
      )
    ).rows[0];

    await logActivity(db, {
      actorType: actorTypeFor(req),
      actorId: req.session.role === 'child' ? entry.student_id : (req.session.userId ?? entry.student_id),
      action: 'recipe_rated',
      contentType: 'recipe',
      contentId: entry.recipe_id,
    });

    res.json(updated);
  });

  router.delete('/cookbook/:entryId', requireAuth, async (req, res) => {
    const entry = (
      await db.query<CookbookEntryRow>('SELECT * FROM cookbook_entries WHERE id = $1', [req.params.entryId])
    ).rows[0];
    if (!entry) {
      res.status(404).json({ error: 'entry_not_found' });
      return;
    }
    if (!(await canAccessStudent(req, db, entry.student_id))) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    await db.query('DELETE FROM cookbook_entries WHERE id = $1', [entry.id]);

    await logActivity(db, {
      actorType: actorTypeFor(req),
      actorId: req.session.role === 'child' ? entry.student_id : (req.session.userId ?? entry.student_id),
      action: 'recipe_removed_from_cookbook',
      contentType: 'recipe',
      contentId: entry.recipe_id,
    });

    res.status(204).end();
  });

  return router;
}
