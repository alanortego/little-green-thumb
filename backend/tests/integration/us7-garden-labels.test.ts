import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { closeTestDb, makeTestDb, resetSequences } from '../helpers/testDb.js';

describe('US7: Teacher/admin selects garden plants and prints QR labels', () => {
  let db: Awaited<ReturnType<typeof makeTestDb>>;
  let app: ReturnType<typeof createApp>;
  let teacherAgent: ReturnType<typeof request.agent>;
  let otherTeacherAgent: ReturnType<typeof request.agent>;

  afterAll(() => closeTestDb(db));

  beforeAll(async () => {
    db = await makeTestDb();
    app = createApp(db);
    teacherAgent = request.agent(app);
    otherTeacherAgent = request.agent(app);
    const hash = bcrypt.hashSync('password123', 4);
    await db.query(
      `INSERT INTO users (id, role, name, email, password_hash)
       VALUES (1, 'teacher', 'Ms. Rivera', 't@example.com', $1)`,
      [hash],
    );
    await db.query(
      `INSERT INTO users (id, role, name, email, password_hash)
       VALUES (2, 'teacher', 'Mr. Lee', 'l@example.com', $1)`,
      [hash],
    );
    await db.query(`
      INSERT INTO classes (id, name, teacher_id) VALUES (1, 'Room 4', 1), (2, 'Room 5', 2);
      INSERT INTO plants (id, name, qr_code, is_published) VALUES
        (1, 'Carrot', 'QR-CARROT', TRUE), (2, 'Pea', 'QR-PEA', TRUE), (3, 'Kale', 'QR-KALE', TRUE);
    `);
    await resetSequences(db);

    await teacherAgent.post('/auth/login').send({ email: 't@example.com', password: 'password123' });
    await otherTeacherAgent
      .post('/auth/login')
      .send({ email: 'l@example.com', password: 'password123' });
  });

  it('rejects an empty garden selection', async () => {
    const res = await teacherAgent.put('/classes/1/garden-selection').send({ plantIds: [] });
    expect(res.status).toBe(400);
  });

  it('sets and returns a garden selection for the teacher’s own class', async () => {
    const putRes = await teacherAgent.put('/classes/1/garden-selection').send({ plantIds: [1, 2] });
    expect(putRes.status).toBe(200);
    expect(putRes.body.map((p: { name: string }) => p.name).sort()).toEqual(['Carrot', 'Pea']);

    const getRes = await teacherAgent.get('/classes/1/garden-selection');
    expect(getRes.status).toBe(200);
    expect(getRes.body).toHaveLength(2);
  });

  it('rejects a teacher managing another class’s garden', async () => {
    const res = await otherTeacherAgent.put('/classes/1/garden-selection').send({ plantIds: [1] });
    expect(res.status).toBe(403);
  });

  it('generates a printable HTML label sheet for the current selection', async () => {
    const res = await teacherAgent.get('/classes/1/garden-labels.pdf');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('Carrot');
    expect(res.text).toContain('Pea');
    expect(res.text).toContain('data:image/png;base64');
  });

  it('404s the label sheet for a class with no garden selection', async () => {
    const res = await otherTeacherAgent.get('/classes/2/garden-labels.pdf');
    expect(res.status).toBe(404);
  });
});
