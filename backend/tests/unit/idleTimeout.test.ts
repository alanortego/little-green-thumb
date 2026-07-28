import { describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { STUDENT_IDLE_TIMEOUT_MS, idleTimeout } from '../../src/middleware/idleTimeout.js';

/** T075: idle-timeout expiry (FR-013a) — minimal req/res mocks, no server needed. */
function makeReqRes(role: string | undefined, lastActivityAt: number | undefined) {
  const session: Record<string, unknown> = { role, lastActivityAt, destroy: vi.fn((cb: () => void) => cb()) };
  const req = { session } as unknown as Request;
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  const res = { status } as unknown as Response;
  return { req, res, session, status, json };
}

describe('idleTimeout middleware', () => {
  it('destroys the session and returns 401 once a child session exceeds 30 minutes idle', () => {
    const { req, res, session, status, json } = makeReqRes('child', Date.now() - STUDENT_IDLE_TIMEOUT_MS - 1);
    const next = vi.fn();

    idleTimeout(req, res, next);

    expect(session.destroy).toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({ error: 'session_idle_timeout' });
    expect(next).not.toHaveBeenCalled();
  });

  it('refreshes lastActivityAt and continues for a child session within the window', () => {
    const { req, res, session } = makeReqRes('child', Date.now() - 1000);
    const next = vi.fn();

    idleTimeout(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(session.lastActivityAt).toBeGreaterThan(Date.now() - 1000);
  });

  it('does not apply the idle timeout to non-child (teacher/parent/admin) sessions', () => {
    const { req, res, session } = makeReqRes('teacher', Date.now() - STUDENT_IDLE_TIMEOUT_MS - 1);
    const next = vi.fn();

    idleTimeout(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(session.destroy).not.toHaveBeenCalled();
  });
});
