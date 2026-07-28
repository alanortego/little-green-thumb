import { Router } from 'express';
import type Database from 'better-sqlite3';
import { requireRole } from '../middleware/roleGuard.js';

/**
 * T043: teacher/admin roster route. Per-student Cookbook summary counts
 * (cookbookCount, madeCount) plus distinct plants discovered, so
 * Roster.tsx can render the whole class without N follow-up requests.
 */
export function createClassesRouter(db: Database.Database): Router {
  const router = Router();

  router.get('/classes/:id/students', requireRole('teacher', 'admin'), (req, res) => {
    const classId = Number(req.params.id);

    if (req.session.role === 'teacher') {
      const owned = db
        .prepare('SELECT 1 FROM classes WHERE id = ? AND teacher_id = ?')
        .get(classId, req.session.userId);
      if (!owned) {
        res.status(403).json({ error: 'forbidden' });
        return;
      }
    }

    const students = db
      .prepare(
        `SELECT
           s.id, s.display_name, s.avatar_key,
           COUNT(DISTINCT ce.id) AS cookbookCount,
           COUNT(DISTINCT CASE WHEN ce.is_made = 1 THEN ce.id END) AS madeCount,
           COUNT(DISTINCT pd.plant_id) AS plantsDiscovered
         FROM students s
         LEFT JOIN cookbook_entries ce ON ce.student_id = s.id
         LEFT JOIN plant_discoveries pd ON pd.student_id = s.id
         WHERE s.class_id = ?
         GROUP BY s.id
         ORDER BY s.display_name`,
      )
      .all(classId);

    res.json(students);
  });

  return router;
}
