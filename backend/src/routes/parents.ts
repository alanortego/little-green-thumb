import { randomInt } from 'node:crypto';
import { Router } from 'express';
import type { Pool } from 'pg';
import { requireRole } from '../middleware/roleGuard.js';
import type { StudentRow } from '../models/types.js';

/** A short numeric code a parent can type easily (FR-011). */
async function generateUniqueQuickCode(db: Pool): Promise<string> {
  for (;;) {
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const exists = await db.query('SELECT 1 FROM students WHERE parent_quick_code = $1', [code]);
    if (!exists.rowCount) {
      return code;
    }
  }
}

/** T052/T053: parent's linked-children picker (FR-011a). */
export function createParentsRouter(db: Pool): Router {
  const router = Router();

  router.post('/parents/generate-code', requireRole('teacher'), async (req, res) => {
    const { studentId } = req.body as { studentId?: number };
    if (!studentId) {
      res.status(400).json({ error: 'student_id_required' });
      return;
    }

    const student = (await db.query<StudentRow>('SELECT * FROM students WHERE id = $1', [studentId])).rows[0];
    if (!student) {
      res.status(404).json({ error: 'student_not_found' });
      return;
    }

    const owned = await db.query(
      'SELECT 1 FROM classes WHERE id = $1 AND teacher_id = $2',
      [student.class_id, req.session.userId],
    );
    if (!owned.rowCount) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const code = await generateUniqueQuickCode(db);
    await db.query('UPDATE students SET parent_quick_code = $1 WHERE id = $2', [code, studentId]);
    res.json({ code });
  });

  router.get('/parents/me/students', requireRole('parent'), async (req, res) => {
    const students = (
      await db.query<Pick<StudentRow, 'id' | 'display_name' | 'avatar_key'>>(
        'SELECT id, display_name, avatar_key FROM students WHERE parent_id = $1 ORDER BY display_name',
        [req.session.userId],
      )
    ).rows;
    res.json(students);
  });

  router.post('/parents/select-student', requireRole('parent'), async (req, res) => {
    const { studentId } = req.body as { studentId?: number };
    if (!studentId) {
      res.status(400).json({ error: 'student_id_required' });
      return;
    }

    const student = (
      await db.query<StudentRow>(
        'SELECT * FROM students WHERE id = $1 AND parent_id = $2',
        [studentId, req.session.userId],
      )
    ).rows[0];
    if (!student) {
      res.status(404).json({ error: 'student_not_found' });
      return;
    }

    req.session.studentId = student.id;
    res.json({ id: student.id, displayName: student.display_name, avatarKey: student.avatar_key });
  });

  return router;
}
