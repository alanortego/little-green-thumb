import { Router } from 'express';
import type { Pool } from 'pg';
import { requireAuth } from '../middleware/roleGuard.js';
import { canAccessStudent } from '../services/studentAccess.js';

/** T051: plants a student has scanned (FR-012), same ownership rules as Cookbook routes. */
export function createStudentsRouter(db: Pool): Router {
  const router = Router();

  router.get('/students/:id/discoveries', requireAuth, async (req, res) => {
    const studentId = Number(req.params.id);
    if (!(await canAccessStudent(req, db, studentId))) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const discoveries = (
      await db.query(
        `SELECT pd.*, p.name AS plant_name, p.image_path AS plant_image_path
         FROM plant_discoveries pd
         JOIN plants p ON p.id = pd.plant_id
         WHERE pd.student_id = $1
         ORDER BY pd.last_scanned_at DESC`,
        [studentId],
      )
    ).rows;

    res.json(discoveries);
  });

  return router;
}
