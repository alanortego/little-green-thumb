import { randomInt } from 'node:crypto';
import { Router } from 'express';
import type Database from 'better-sqlite3';
import { requireRole } from '../middleware/roleGuard.js';
import type { StudentRow } from '../models/types.js';

/** A short numeric code a parent can type easily (FR-011). Retries on the
 *  rare collision against the UNIQUE parent_quick_code constraint. */
function generateUniqueQuickCode(db: Database.Database): string {
  for (;;) {
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const exists = db.prepare('SELECT 1 FROM students WHERE parent_quick_code = ?').get(code);
    if (!exists) {
      return code; 
    }
  }
}

/** T052/T053: parent's linked-children picker (FR-011a). */
export function createParentsRouter(db: Database.Database): Router {
  const router = Router();

  // T071: teacher (own class) issues/regenerates a student's quick code (FR-011).
  router.post('/parents/generate-code', requireRole('teacher'), (req, res) => {
    const { studentId } = req.body as { studentId?: number };
    if (!studentId) {
      res.status(400).json({ error: 'student_id_required' });
      return;
    }

    const student = db.prepare<[number], StudentRow>('SELECT * FROM students WHERE id = ?').get(studentId);
    if (!student) {
      res.status(404).json({ error: 'student_not_found' });
      return;
    }

    const owned = db
      .prepare('SELECT 1 FROM classes WHERE id = ? AND teacher_id = ?')
      .get(student.class_id, req.session.userId);
    if (!owned) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const code = generateUniqueQuickCode(db);
    db.prepare('UPDATE students SET parent_quick_code = ? WHERE id = ?').run(code, studentId);
    res.json({ code });
  });

  router.get('/parents/me/students', requireRole('parent'), (req, res) => {
    const students = db
      .prepare<[number], Pick<StudentRow, 'id' | 'display_name' | 'avatar_key'>>(
        'SELECT id, display_name, avatar_key FROM students WHERE parent_id = ? ORDER BY display_name',
      )
      .all(req.session.userId as number);
    res.json(students);
  });

  // Switches the parent's active child in-session — no re-login (FR-011a).
  router.post('/parents/select-student', requireRole('parent'), (req, res) => {
    const { studentId } = req.body as { studentId?: number };
    if (!studentId) {
      res.status(400).json({ error: 'student_id_required' });
      return;
    }

    const student = db
      .prepare<[number, number], StudentRow>(
        'SELECT * FROM students WHERE id = ? AND parent_id = ?',
      )
      .get(studentId, req.session.userId as number);
    if (!student) {
      res.status(404).json({ error: 'student_not_found' });
      return;
    }

    req.session.studentId = student.id;
    res.json({ id: student.id, displayName: student.display_name, avatarKey: student.avatar_key });
  });

  return router;
}
