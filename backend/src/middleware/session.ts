import session from 'express-session';
import sqliteStoreFactory from 'better-sqlite3-session-store';
import type { RequestHandler } from 'express';
import type Database from 'better-sqlite3';

export type SessionRole = 'child' | 'teacher' | 'parent' | 'admin';

declare module 'express-session' {
  interface SessionData {
    role?: SessionRole;
    /** Users.id for teacher/parent/admin sessions */
    userId?: number;
    /** Students.id for the active student — the child themself, or a parent's currently-selected child */
    studentId?: number;
    /** All students.id linked to a parent account, for the FR-011a picker */
    linkedStudentIds?: number[];
    /** Epoch ms of last request; drives the 30-min student idle timeout (FR-013a) */
    lastActivityAt?: number;
  }
}

const SqliteStore = sqliteStoreFactory(session);

/**
 * Builds the shared session middleware backed by the same SQLite file as
 * app data (simplest option for a single-process, single-school deployment).
 * ponytail: one session store for all roles; split stores only if the
 * session table ever needs independent scaling/retention from app data.
 */
export function createSessionMiddleware(db: Database.Database): RequestHandler {
  return session({
    store: new SqliteStore({ client: db, expired: { clear: true, intervalMs: 15 * 60 * 1000 } }),
    secret: process.env.SESSION_SECRET ?? 'dev-only-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      // Teacher/parent/admin sessions use standard cookie expiry (24h);
      // student idle-timeout is enforced separately by idleTimeout.ts (FR-013a).
      maxAge: 24 * 60 * 60 * 1000,
    },
  });
}
