import { Router } from 'express';
import type { Pool } from 'pg';
import { requireRole } from '../middleware/roleGuard.js';

/**
 * T043: teacher/admin roster route. Per-student Cookbook summary counts
 * (cookbookCount, madeCount) plus distinct plants discovered, so
 * Roster.tsx can render the whole class without N follow-up requests.
 */
export function createClassesRouter(db: Pool): Router {
  const router = Router();

  router.get('/classes/:id/students', requireRole('teacher', 'admin'), async (req, res) => {
    const classId = Number(req.params.id);

    if (req.session.role === 'teacher') {
      const owned = await db.query(
        'SELECT 1 FROM classes WHERE id = $1 AND teacher_id = $2',
        [classId, req.session.userId],
      );
      if (!owned.rowCount) {
        res.status(403).json({ error: 'forbidden' });
        return;
      }
    }

    const students = (
      await db.query(
        `SELECT
           s.id, s.display_name, s.avatar_key,
           COUNT(DISTINCT ce.id)::int AS "cookbookCount",
           COUNT(DISTINCT ce.id) FILTER (WHERE ce.is_made)::int AS "madeCount",
           COUNT(DISTINCT pd.plant_id)::int AS "plantsDiscovered"
         FROM students s
         LEFT JOIN cookbook_entries ce ON ce.student_id = s.id
         LEFT JOIN plant_discoveries pd ON pd.student_id = s.id
         WHERE s.class_id = $1
         GROUP BY s.id
         ORDER BY s.display_name`,
        [classId],
      )
    ).rows;

    res.json(students);
  });

  return router;
}
