import type { Request } from 'express';
import type Database from 'better-sqlite3';
import type { StudentRow } from '../models/types.js';

/**
 * Checks whether the current session may act on behalf of `studentId`:
 * the child themself, their teacher (own class), their linked parent, or
 * any admin. Shared by every route scoped to "student (self) / teacher
 * (own class) / parent (own child)" per contracts.md.
 */
export function canAccessStudent(req: Request, db: Database.Database, studentId: number): boolean {
  const { role, studentId: sessionStudentId, userId } = req.session;
  if (role === 'admin') {
    return true; 
  }
  if (role === 'child') {
    return sessionStudentId === studentId; 
  }

  const student = db
    .prepare<[number], StudentRow>('SELECT * FROM students WHERE id = ?')
    .get(studentId);
  if (!student) {
    return false; 
  }

  if (role === 'parent') {
    return student.parent_id === userId; 
  }
  if (role === 'teacher') {
    const owned = db
      .prepare('SELECT 1 FROM classes WHERE id = ? AND teacher_id = ?')
      .get(student.class_id, userId);
    return Boolean(owned);
  }
  return false;
}
