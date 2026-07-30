import type { Request } from 'express';
import type { Db } from '../db/connection.js';
import type { StudentRow } from '../models/types.js';

/**
 * Checks whether the current session may act on behalf of `studentId`:
 * the child themself, their teacher (own class), their linked parent, or
 * any admin. Shared by every route scoped to "student (self) / teacher
 * (own class) / parent (own child)" per contracts.md.
 */
export async function canAccessStudent(req: Request, db: Db, studentId: number): Promise<boolean> {
  const { role, studentId: sessionStudentId, userId } = req.session;
  if (role === 'admin') {
    return true;
  }
  if (role === 'child') {
    return sessionStudentId === studentId;
  }

  const student = (
    await db.query<StudentRow>('SELECT * FROM students WHERE id = $1', [studentId])
  ).rows[0];
  if (!student) {
    return false;
  }

  if (role === 'parent') {
    return student.parent_id === userId;
  }
  if (role === 'teacher') {
    const owned = await db.query(
      'SELECT 1 FROM classes WHERE id = $1 AND teacher_id = $2',
      [student.class_id, userId],
    );
    return Boolean(owned.rowCount);
  }
  return false;
}
