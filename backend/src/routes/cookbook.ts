import { Router } from 'express';
import type Database from 'better-sqlite3';
import type { Request } from 'express';
import { requireAuth } from '../middleware/roleGuard.js';
import { logActivity } from '../services/activityLog.js';
import { canAccessStudent } from '../services/studentAccess.js';
import type { CookbookEntryRow } from '../models/types.js';

const SORTS: Record<string, string> = {
  newest: 'ce.created_at DESC',
  alphabetical: 'r.name ASC',
  rating: 'ce.rating DESC, ce.created_at DESC',
};

/** Activity_log.actor_type uses 'student', while sessions use 'child' — map between the two. */
function actorTypeFor(req: Request): 'student' | 'teacher' | 'parent' | 'admin' {
  return req.session.role === 'child' ? 'student' : (req.session.role ?? 'student');
}

export function createCookbookRouter(db: Database.Database): Router {
  const router = Router();

  // POST /students/:id/cookbook — idempotent add (FR-006, FR-010, FR-012).
  router.post('/students/:id/cookbook', requireAuth, (req, res) => {
    const studentId = Number(req.params.id);
    if (!canAccessStudent(req, db, studentId)) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const { recipeId } = req.body as { recipeId?: number };
    if (!recipeId) {
      res.status(400).json({ error: 'recipe_id_required' });
      return;
    }

    const existing = db
      .prepare<[number, number], CookbookEntryRow>(
        'SELECT * FROM cookbook_entries WHERE student_id = ? AND recipe_id = ?',
      )
      .get(studentId, recipeId);
    if (existing) {
      res.status(200).json(existing);
      return;
    }

    const addedBy = req.session.role === 'child' ? 'student' : (req.session.role as 'teacher' | 'parent');
    const info = db
      .prepare(
        'INSERT INTO cookbook_entries (student_id, recipe_id, added_by) VALUES (?, ?, ?)',
      )
      .run(studentId, recipeId, addedBy);

    logActivity(db, {
      actorType: actorTypeFor(req),
      actorId: req.session.role === 'child' ? studentId : (req.session.userId ?? studentId),
      action: 'recipe_added_to_cookbook',
      contentType: 'recipe',
      contentId: recipeId,
    });

    const created = db
      .prepare<[number], CookbookEntryRow>('SELECT * FROM cookbook_entries WHERE id = ?')
      .get(info.lastInsertRowid as number);
    res.status(201).json(created);
  });

  // GET /students/:id/cookbook — filter/sort (FR-007).
  router.get('/students/:id/cookbook', requireAuth, (req, res) => {
    const studentId = Number(req.params.id);
    if (!canAccessStudent(req, db, studentId)) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const { filterPlantId, filterMade, sort } = req.query as {
      filterPlantId?: string;
      filterMade?: string;
      sort?: string;
    };

    const conditions = ['ce.student_id = ?'];
    const params: (string | number)[] = [studentId];

    if (filterPlantId) {
      conditions.push(
        'EXISTS (SELECT 1 FROM recipe_plants rp WHERE rp.recipe_id = ce.recipe_id AND rp.plant_id = ?)',
      );
      params.push(Number(filterPlantId));
    }
    if (filterMade === 'true' || filterMade === 'false') {
      conditions.push('ce.is_made = ?');
      params.push(filterMade === 'true' ? 1 : 0);
    }

    const orderBy = SORTS[sort ?? ''] ?? SORTS.newest;
    const entries = db
      .prepare(
        `SELECT ce.*, r.name AS recipe_name, r.image_path AS recipe_image_path
         FROM cookbook_entries ce
         JOIN recipes r ON r.id = ce.recipe_id
         WHERE ${conditions.join(' AND ')}
         ORDER BY ${orderBy}`,
      )
      .all(...params);

    res.json(entries);
  });

  // POST /cookbook/:entryId/made — "I made it!" (FR-008).
  router.post('/cookbook/:entryId/made', requireAuth, (req, res) => {
    const entry = db
      .prepare<[string], CookbookEntryRow>('SELECT * FROM cookbook_entries WHERE id = ?')
      .get(String(req.params.entryId));
    if (!entry) {
      res.status(404).json({ error: 'entry_not_found' });
      return;
    }
    if (!canAccessStudent(req, db, entry.student_id)) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    db.prepare(
      `UPDATE cookbook_entries SET is_made = 1, made_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       WHERE id = ?`,
    ).run(entry.id);

    logActivity(db, {
      actorType: actorTypeFor(req),
      actorId: req.session.role === 'child' ? entry.student_id : (req.session.userId ?? entry.student_id),
      action: 'recipe_made',
      contentType: 'recipe',
      contentId: entry.recipe_id,
    });

    const updated = db
      .prepare<[number], CookbookEntryRow>('SELECT * FROM cookbook_entries WHERE id = ?')
      .get(entry.id);
    res.json(updated);
  });

  // POST /cookbook/:entryId/rating — 1-3, requires is_made first (FR-008).
  router.post('/cookbook/:entryId/rating', requireAuth, (req, res) => {
    const entry = db
      .prepare<[string], CookbookEntryRow>('SELECT * FROM cookbook_entries WHERE id = ?')
      .get(String(req.params.entryId));
    if (!entry) {
      res.status(404).json({ error: 'entry_not_found' });
      return;
    }
    if (!canAccessStudent(req, db, entry.student_id)) {
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

    db.prepare(
      `UPDATE cookbook_entries SET rating = ?, rated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       WHERE id = ?`,
    ).run(rating, entry.id);

    logActivity(db, {
      actorType: actorTypeFor(req),
      actorId: req.session.role === 'child' ? entry.student_id : (req.session.userId ?? entry.student_id),
      action: 'recipe_rated',
      contentType: 'recipe',
      contentId: entry.recipe_id,
    });

    const updated = db
      .prepare<[number], CookbookEntryRow>('SELECT * FROM cookbook_entries WHERE id = ?')
      .get(entry.id);
    res.json(updated);
  });

  // DELETE /cookbook/:entryId — remove a saved recipe (student self-manage).
  router.delete('/cookbook/:entryId', requireAuth, (req, res) => {
    const entry = db
      .prepare<[string], CookbookEntryRow>('SELECT * FROM cookbook_entries WHERE id = ?')
      .get(String(req.params.entryId));
    if (!entry) {
      res.status(404).json({ error: 'entry_not_found' });
      return;
    }
    if (!canAccessStudent(req, db, entry.student_id)) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    db.prepare('DELETE FROM cookbook_entries WHERE id = ?').run(entry.id);

    logActivity(db, {
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
