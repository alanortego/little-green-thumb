import { Router } from 'express';
import bcrypt from 'bcryptjs';
import type { Pool } from 'pg';
import type { StudentRow, UserRow } from '../models/types.js';

export function createAuthRouter(db: Pool): Router {
  const router = Router();

  router.post('/login', async (req, res) => {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ error: 'email_and_password_required' });
      return;
    }

    const user = (
      await db.query<UserRow>(
        'SELECT * FROM users WHERE email = $1 AND role IN (\'teacher\', \'admin\')',
        [email],
      )
    ).rows[0];
    if (!user || !user.password_hash || !bcrypt.compareSync(password, user.password_hash)) {
      res.status(401).json({ error: 'invalid_credentials' });
      return;
    }

    req.session.role = user.role as 'teacher' | 'admin';
    req.session.userId = user.id;
    const ownClass =
      user.role === 'teacher'
        ? (await db.query<{ id: number }>('SELECT id FROM classes WHERE teacher_id = $1', [user.id]))
          .rows[0]
        : undefined;
    res.json({
      id: user.id,
      name: user.name,
      role: user.role,
      classId: ownClass?.id ?? null,
    });
  });

  router.get('/me', async (req, res) => {
    if (!req.session.role || req.session.role === 'child') {
      res.status(403).json({ error: 'forbidden' });
      return;
    }
    const user = (
      await db.query<UserRow>('SELECT * FROM users WHERE id = $1', [req.session.userId])
    ).rows[0];
    if (!user) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }
    const ownClass =
      user.role === 'teacher'
        ? (await db.query<{ id: number }>('SELECT id FROM classes WHERE teacher_id = $1', [user.id]))
          .rows[0]
        : undefined;
    res.json({
      id: user.id,
      name: user.name,
      role: user.role,
      classId: ownClass?.id ?? null,
    });
  });

  router.post('/parent-code', async (req, res) => {
    const { code } = req.body as { code?: string };
    if (!code) {
      res.status(400).json({ error: 'code_required' });
      return;
    }

    const student = (
      await db.query<StudentRow>('SELECT * FROM students WHERE parent_quick_code = $1', [code])
    ).rows[0];
    if (!student) {
      res.status(404).json({ error: 'invalid_code' });
      return;
    }

    let parentUserId: number;
    if (req.session.role === 'parent' && req.session.userId) {
      parentUserId = req.session.userId;
    } else {
      parentUserId = (
        await db.query<{ id: number }>(
          'INSERT INTO users (role, name) VALUES (\'parent\', \'Parent\') RETURNING id',
        )
      ).rows[0].id;
    }

    if (student.parent_id !== parentUserId) {
      await db.query('UPDATE students SET parent_id = $1 WHERE id = $2', [parentUserId, student.id]);
    }

    const linkedStudentIds = (
      await db.query<{ id: number }>('SELECT id FROM students WHERE parent_id = $1', [parentUserId])
    ).rows.map((linkedStudent) => linkedStudent.id);

    req.session.role = 'parent';
    req.session.userId = parentUserId;
    req.session.linkedStudentIds = linkedStudentIds;
    req.session.studentId = student.id;

    res.json({ linkedStudentIds, activeStudentId: student.id });
  });

  router.get('/students-picker', async (req, res) => {
    const classId = req.query.classId as string | undefined;
    const students = classId
      ? (
        await db.query<Pick<StudentRow, 'id' | 'display_name' | 'avatar_key'>>(
          'SELECT id, display_name, avatar_key FROM students WHERE class_id = $1 ORDER BY display_name',
          [classId],
        )
      ).rows
      : (
        await db.query<Pick<StudentRow, 'id' | 'display_name' | 'avatar_key'>>(
          'SELECT id, display_name, avatar_key FROM students ORDER BY display_name',
        )
      ).rows;
    res.json(students);
  });

  router.post('/select-student', async (req, res) => {
    const { studentId } = req.body as { studentId?: string };
    if (!studentId) {
      res.status(400).json({ error: 'student_id_required' });
      return;
    }

    const student = (
      await db.query<StudentRow>('SELECT * FROM students WHERE id = $1', [studentId])
    ).rows[0];
    if (!student) {
      res.status(404).json({ error: 'student_not_found' });
      return;
    }

    req.session.role = 'child';
    req.session.studentId = student.id;
    req.session.lastActivityAt = Date.now();
    res.json({ id: student.id, displayName: student.display_name, avatarKey: student.avatar_key });
  });

  router.post('/logout', (req, res) => {
    req.session.destroy(() => {
      res.status(204).end();
    });
  });

  return router;
}
