import type { RequestHandler } from 'express';

export const STUDENT_IDLE_TIMEOUT_MS = 30 * 60 * 1000; // FR-013a: 30 minutes

/**
 * Enforces the 30-minute idle timeout for student ("child") sessions
 * (FR-013a). Teacher/parent/admin sessions are untouched — they rely on
 * standard cookie expiry only, per the spec's Session behavior contract.
 *
 * Must be mounted after createSessionMiddleware and before any route that
 * needs req.session.role.
 */
export const idleTimeout: RequestHandler = (req, res, next) => {
  if (req.session.role !== 'child') {
    next();
    return;
  }

  const now = Date.now();
  const last = req.session.lastActivityAt;

  if (last !== undefined && now - last > STUDENT_IDLE_TIMEOUT_MS) {
    req.session.destroy(() => {
      res.status(401).json({ error: 'session_idle_timeout' });
    });
    return;
  }

  req.session.lastActivityAt = now;
  next();
};
