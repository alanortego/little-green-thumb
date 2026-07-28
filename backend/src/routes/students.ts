import { Router } from 'express';
import type Database from 'better-sqlite3';
import { requireAuth } from '../middleware/roleGuard.js';
import { canAccessStudent } from '../services/studentAccess.js';

/** T051: plants a student has scanned (FR-012), same ownership rules as Cookbook routes. */
export function createStudentsRouter(db: Database.Database): Router {
  const router = Router();

  router.get('/students/:id/discoveries', requireAuth, (req, res) => {
    const studentId = Number(req.params.id);
    if (!canAccessStudent(req, db, studentId)) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const discoveries = db
      .prepare(
        `SELECT pd.*, p.name AS plant_name, p.image_path AS plant_image_path
         FROM plant_discoveries pd
         JOIN plants p ON p.id = pd.plant_id
         WHERE pd.student_id = ?
         ORDER BY pd.last_scanned_at DESC`,
      )
      .all(studentId);

    res.json(discoveries);
  });

  return router;
}
