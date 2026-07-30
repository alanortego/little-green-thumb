import connectPgSimple from 'connect-pg-simple';
import session from 'express-session';
import type { RequestHandler } from 'express';
import type { Pool } from 'pg';

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

const PgStore = connectPgSimple(session);

/** Builds the shared PostgreSQL-backed session middleware. */
export function createSessionMiddleware(db: Pool): RequestHandler {
  return session({
    store: new PgStore({
      pool: db,
      createTableIfMissing: false,
      pruneSessionInterval: 15 * 60,
    }),
    secret: process.env.SESSION_SECRET ?? 'dev-only-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    },
  });
}
