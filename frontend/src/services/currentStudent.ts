const KEY = 'lgt.currentStudent';

export interface CurrentStudent {
  id: number;
  displayName: string;
  avatarKey: string;
}

/**
 * Mirrors the session cookie's studentId on the client so screens like
 * Cookbook/RecipeComplete don't need an extra round-trip just to know
 * "who is playing right now." sessionStorage (not localStorage) matches
 * the tab-lifetime nature of a shared-tablet child session.
 */
export function setCurrentStudent(student: CurrentStudent): void {
  sessionStorage.setItem(KEY, JSON.stringify(student));
}

export function getCurrentStudent(): CurrentStudent | null {
  const raw = sessionStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as CurrentStudent) : null;
}

export function clearCurrentStudent(): void {
  sessionStorage.removeItem(KEY);
}
