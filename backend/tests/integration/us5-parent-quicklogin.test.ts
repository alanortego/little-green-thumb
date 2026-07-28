import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { makeTestDb } from '../helpers/testDb.js';

describe('US5: Parent quick-login, multi-child picker, and Cookbook assist', () => {
  const db = makeTestDb();
  const app = createApp(db);
  const parentAgent = request.agent(app);
  const teacherAgent = request.agent(app);
  const otherTeacherAgent = request.agent(app);

  afterAll(() => db.close());

  beforeAll(async () => {
    const hash = bcrypt.hashSync('password123', 4);
    db.prepare(
      'INSERT INTO users (id, role, name, email, password_hash) VALUES (1, \'teacher\', \'Ms. Rivera\', \'t@example.com\', ?)',
    ).run(hash);
    db.prepare(
      'INSERT INTO users (id, role, name, email, password_hash) VALUES (4, \'teacher\', \'Mr. Lee\', \'l@example.com\', ?)',
    ).run(hash);
    db.exec(`
      INSERT INTO classes (id, name, teacher_id) VALUES (1, 'Room 4', 1), (2, 'Room 5', 4);
      INSERT INTO students (id, display_name, avatar_key, class_id, parent_quick_code) VALUES
        (1, 'Ava', 'fox', 1, 'CODE-AVA'),
        (2, 'Sam', 'owl', 1, 'CODE-SAM');
      INSERT INTO recipes (id, name, is_published) VALUES (1, 'Carrot Soup', 1);
      INSERT INTO plants (id, name, qr_code, is_published) VALUES (1, 'Carrot', 'QR-CARROT', 1);
      INSERT INTO plant_discoveries (student_id, plant_id) VALUES (1, 1);
    `);

    await teacherAgent.post('/auth/login').send({ email: 't@example.com', password: 'password123' });
    await otherTeacherAgent
      .post('/auth/login')
      .send({ email: 'l@example.com', password: 'password123' });
  });

  it('rejects an unknown quick code', async () => {
    const res = await request(app).post('/auth/parent-code').send({ code: 'NOPE' });
    expect(res.status).toBe(404);
  });

  it('creates a parent session and links the first child on a valid code', async () => {
    const res = await parentAgent.post('/auth/parent-code').send({ code: 'CODE-AVA' });
    expect(res.status).toBe(200);
    expect(res.body.activeStudentId).toBe(1);
    expect(res.body.linkedStudentIds).toEqual([1]);
  });

  it("lets the same parent view their child's discoveries and Cookbook", async () => {
    const discoveries = await parentAgent.get('/students/1/discoveries');
    expect(discoveries.status).toBe(200);
    expect(discoveries.body).toHaveLength(1);
    expect(discoveries.body[0].plant_name).toBe('Carrot');

    const add = await parentAgent.post('/students/1/cookbook').send({ recipeId: 1 });
    expect(add.status).toBe(201);
    expect(add.body.added_by).toBe('parent');
  });

  it('links a second child to the same parent session (no new login) instead of starting over', async () => {
    const res = await parentAgent.post('/auth/parent-code').send({ code: 'CODE-SAM' });
    expect(res.status).toBe(200);
    expect(res.body.activeStudentId).toBe(2);
    expect(res.body.linkedStudentIds.sort()).toEqual([1, 2]);
  });

  it('lists both linked children and switches the active one without re-login', async () => {
    const list = await parentAgent.get('/parents/me/students');
    expect(list.status).toBe(200);
    expect(list.body.map((s: { id: number }) => s.id).sort()).toEqual([1, 2]);

    const switchRes = await parentAgent.post('/parents/select-student').send({ studentId: 1 });
    expect(switchRes.status).toBe(200);
    expect(switchRes.body.id).toBe(1);
  });

  it("rejects switching to a child that isn't linked to this parent", async () => {
    db.exec(
      'INSERT INTO students (id, display_name, avatar_key, class_id) VALUES (3, \'Ben\', \'bear\', 1)',
    );
    const res = await parentAgent.post('/parents/select-student').send({ studentId: 3 });
    expect(res.status).toBe(404);
  });

  it("T071: lets a teacher (re)generate their own student's quick code", async () => {
    const res = await teacherAgent.post('/parents/generate-code').send({ studentId: 1 });
    expect(res.status).toBe(200);
    expect(res.body.code).toMatch(/^\d{6}$/);

    // The freshly generated code immediately works for parent quick-login.
    const login = await request(app).post('/auth/parent-code').send({ code: res.body.code });
    expect(login.status).toBe(200);
    expect(login.body.activeStudentId).toBe(1);
  });

  it('rejects a teacher generating a code for a student outside their own class', async () => {
    const res = await otherTeacherAgent.post('/parents/generate-code').send({ studentId: 1 });
    expect(res.status).toBe(403);
  });
});
