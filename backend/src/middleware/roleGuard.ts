import type { RequestHandler } from 'express';
import type { SessionRole } from './session.js';

/**
 * Role-guard middleware factory. Usage: `requireRole('teacher', 'admin')`.
 * ponytail: one guard function covers every route in contracts/api.md — no
 * per-role middleware classes needed.
 */
export function requireRole(...roles: SessionRole[]): RequestHandler {
  return (req, res, next) => {
    if (!req.session.role || !roles.includes(req.session.role)) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }
    next();
  };
}

/** Any authenticated session, regardless of role. */
export const requireAuth: RequestHandler = (req, res, next) => {
  if (!req.session.role) {
    res.status(403).json({ error: 'forbidden' });
    return;
  }
  next();
};
