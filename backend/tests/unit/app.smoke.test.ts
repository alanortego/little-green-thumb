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
});
