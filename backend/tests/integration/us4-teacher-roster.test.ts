import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { closeTestDb, makeTestDb, resetSequences } from '../helpers/testDb.js';

describe('US4: Teacher reviews roster and assists with Cookbook', () => {
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
       VALUES ($1, 'teacher', $2, $3, $4)`,
      [1, 'Ms. Rivera', 't@example.com', hash],
    );
    await db.query(
      `INSERT INTO users (id, role, name, email, password_hash)
       VALUES ($1, 'teacher', $2, $3, $4)`,
      [2, 'Mr. Lee', 'l@example.com', hash],
    );
    await db.query(`
      INSERT INTO classes (id, name, teacher_id) VALUES (1, 'Room 4', 1), (2, 'Room 5', 2);
      INSERT INTO students (id, display_name, avatar_key, class_id) VALUES
        (1, 'Ava', 'fox', 1), (2, 'Ben', 'owl', 1);
      INSERT INTO recipes (id, name, is_published) VALUES (1, 'Carrot Soup', TRUE);
      INSERT INTO cookbook_entries (student_id, recipe_id, added_by, is_made)
        VALUES (1, 1, 'student', TRUE);
    `);
    await resetSequences(db);

    await teacherAgent.post('/auth/login').send({ email: 't@example.com', password: 'password123' });
    await otherTeacherAgent
      .post('/auth/login')
      .send({ email: 'l@example.com', password: 'password123' });
  });

  it('rejects an unauthenticated roster request', async () => {
    const res = await request(app).get('/classes/1/students');
    expect(res.status).toBe(403);
  });

  it("returns the teacher's own class roster with Cookbook summary counts", async () => {
    const res = await teacherAgent.get('/classes/1/students');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    const ava = res.body.find((s: { display_name: string }) => s.display_name === 'Ava');
    expect(ava.cookbookCount).toBe(1);
    expect(ava.madeCount).toBe(1);
  });

  it('exposes classId via /auth/me so the SPA can re-derive it after a refresh', async () => {
    const res = await teacherAgent.get('/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.classId).toBe(1);
  });

  it("rejects a teacher viewing another teacher's class", async () => {
    const res = await otherTeacherAgent.get('/classes/1/students');
    expect(res.status).toBe(403);
  });

  it("lets a teacher add a recipe to a student's cookbook on their behalf (added_by=teacher)", async () => {
    const res = await teacherAgent.post('/students/2/cookbook').send({ recipeId: 1 });
    expect(res.status).toBe(201);
    expect(res.body.added_by).toBe('teacher');
  });
});
