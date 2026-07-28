import { Router } from 'express';
import bcrypt from 'bcryptjs';
import type Database from 'better-sqlite3';
import type { StudentRow, UserRow } from '../models/types.js';

export function createAuthRouter(db: Database.Database): Router {
  const router = Router();

  // Teacher/Admin credential login (FR-022).
  router.post('/login', (req, res) => {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ error: 'email_and_password_required' });
      return;
    }

    const user = db
      .prepare<[string], UserRow>(
        'SELECT * FROM users WHERE email = ? AND role IN (\'teacher\', \'admin\')',
      )
      .get(email);

    if (!user || !user.password_hash || !bcrypt.compareSync(password, user.password_hash)) {
      res.status(401).json({ error: 'invalid_credentials' });
      return;
    }

    req.session.role = user.role as 'teacher' | 'admin';
    req.session.userId = user.id;
    const ownClass =
      user.role === 'teacher'
        ? db.prepare('SELECT id FROM classes WHERE teacher_id = ?').get(user.id)
        : undefined;
    res.json({
      id: user.id,
      name: user.name,
      role: user.role,
      classId: (ownClass as { id: number } | undefined)?.id ?? null,
    });
  });

  // GET /auth/me — lets the teacher/admin SPA re-derive "who's logged in" (incl. classId)
  // after a page refresh, without re-storing credentials client-side.
  router.get('/me', (req, res) => {
    if (!req.session.role || req.session.role === 'child') {
      res.status(403).json({ error: 'forbidden' });
      return;
    }
    const user = db
      .prepare<[number], UserRow>('SELECT * FROM users WHERE id = ?')
      .get(req.session.userId as number);
    if (!user) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }
    const ownClass =
      user.role === 'teacher'
        ? db.prepare('SELECT id FROM classes WHERE teacher_id = ?').get(user.id)
        : undefined;
    res.json({
      id: user.id,
      name: user.name,
      role: user.role,
      classId: (ownClass as { id: number } | undefined)?.id ?? null,
    });
  });

  // POST /auth/parent-code — quick parent login/link (FR-011). Each code links exactly one
  // child; if the parent is already signed in, this links an *additional* child to the same
  // session instead of starting over (FR-011a).
  router.post('/parent-code', (req, res) => {
    const { code } = req.body as { code?: string };
    if (!code) {
      res.status(400).json({ error: 'code_required' });
      return;
    }

    const student = db
      .prepare<[string], StudentRow>('SELECT * FROM students WHERE parent_quick_code = ?')
      .get(code);
    if (!student) {
      res.status(404).json({ error: 'invalid_code' });
      return;
    }

    let parentUserId: number;
    if (req.session.role === 'parent' && req.session.userId) {
      // Already signed in as a parent — link this child to the same account.
      parentUserId = req.session.userId;
    } else {
      // First code entered this session — create a lightweight parent account.
      const info = db
        .prepare('INSERT INTO users (role, name) VALUES (\'parent\', \'Parent\')')
        .run();
      parentUserId = info.lastInsertRowid as number;
    }

    if (student.parent_id !== parentUserId) {
      db.prepare('UPDATE students SET parent_id = ? WHERE id = ?').run(parentUserId, student.id);
    }

    const linkedStudentIds = (
      db
        .prepare<[number], { id: number }>('SELECT id FROM students WHERE parent_id = ?')
        .all(parentUserId)
    ).map((s) => s.id);

    req.session.role = 'parent';
    req.session.userId = parentUserId;
    req.session.linkedStudentIds = linkedStudentIds;
    req.session.studentId = student.id; // Newly-linked child becomes the active one

    res.json({ linkedStudentIds, activeStudentId: student.id });
  });

  // Child login: tap-an-avatar picker, no password (FR-013). The student list itself is
  // served publicly (names/avatars only, no PII) so the picker works with zero prior auth.
  router.get('/students-picker', (req, res) => {
    const classId = req.query.classId as string | undefined;
    const students = classId
      ? db
        .prepare<[string], Pick<StudentRow, 'id' | 'display_name' | 'avatar_key'>>(
          'SELECT id, display_name, avatar_key FROM students WHERE class_id = ? ORDER BY display_name',
        )
        .all(classId)
      : db
        .prepare<[], Pick<StudentRow, 'id' | 'display_name' | 'avatar_key'>>(
          'SELECT id, display_name, avatar_key FROM students ORDER BY display_name',
        )
        .all();
    res.json(students);
  });

  router.post('/select-student', (req, res) => {
    const { studentId } = req.body as { studentId?: string };
    if (!studentId) {
      res.status(400).json({ error: 'student_id_required' });
      return;
    }

    const student = db
      .prepare<[string], StudentRow>('SELECT * FROM students WHERE id = ?')
      .get(studentId);
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
