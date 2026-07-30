import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { closeTestDb, makeTestDb } from '../helpers/testDb.js';

describe('app smoke test', () => {
  let db: Awaited<ReturnType<typeof makeTestDb>>;
  let app: ReturnType<typeof createApp>;

  afterAll(() => closeTestDb(db));

  beforeAll(async () => {
    db = await makeTestDb();
    app = createApp(db);
  });

  it('responds to /health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('rejects login with missing credentials', async () => {
    const res = await request(app).post('/auth/login').send({});
    expect(res.status).toBe(400);
  });

  it('rejects login with unknown email', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'nobody@example.com', password: 'x' });
    expect(res.status).toBe(401);
  });

  it('uses a secure cross-site cookie for an HTTPS frontend', async () => {
    const originalOrigin = process.env.FRONTEND_ORIGIN;
    process.env.FRONTEND_ORIGIN = 'https://little-green-thumb.onrender.com';

    try {
      const httpsApp = createApp(db);
      httpsApp.post('/test-session', (req, res) => {
        req.session.role = 'child';
        res.sendStatus(204);
      });

      const res = await request(httpsApp)
        .post('/test-session')
        .set('X-Forwarded-Proto', 'https');

      expect(res.headers['set-cookie']).toEqual(
        expect.arrayContaining([expect.stringContaining('Secure; SameSite=None')]),
      );
    } finally {
      if (originalOrigin === undefined) {
        delete process.env.FRONTEND_ORIGIN;
      } else {
        process.env.FRONTEND_ORIGIN = originalOrigin;
      }
    }
  });
});
