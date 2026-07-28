const KEY = 'lgt.currentTeacher';

export interface CurrentTeacher {
  id: number;
  name: string;
  role: 'teacher' | 'admin';
  classId: number | null;
}

/**
 * Mirrors the teacher/admin session on the client, same rationale as
 * currentStudent.ts: avoids a round-trip on every screen to know "who's
 * logged in" and which class they own. Refreshed via GET /auth/me so a
 * page reload doesn't lose it (unlike the child flow, teacher sessions
 * aren't expected to be re-picked constantly).
 */
export function setCurrentTeacher(teacher: CurrentTeacher): void {
  sessionStorage.setItem(KEY, JSON.stringify(teacher));
}

export function getCurrentTeacher(): CurrentTeacher | null {
  const raw = sessionStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as CurrentTeacher) : null;
}

export function clearCurrentTeacher(): void {
  sessionStorage.removeItem(KEY);
}
