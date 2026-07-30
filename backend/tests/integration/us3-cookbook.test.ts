import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { closeTestDb, makeTestDb, resetSequences } from '../helpers/testDb.js';

describe('US3: Cookbook add/browse/made/rate', () => {
  let db: Awaited<ReturnType<typeof makeTestDb>>;
  let app: ReturnType<typeof createApp>;
  let studentAgent: ReturnType<typeof request.agent>;

  afterAll(() => closeTestDb(db));

  beforeAll(async () => {
    db = await makeTestDb();
    app = createApp(db);
    studentAgent = request.agent(app);
    await db.query(`
      INSERT INTO users (id, role, name, email, password_hash) VALUES (1, 'teacher', 'Ms. Rivera', 't@example.com', 'x');
      INSERT INTO classes (id, name, teacher_id) VALUES (1, 'Room 4', 1);
      INSERT INTO students (id, display_name, avatar_key, class_id, parent_id) VALUES (1, 'Ava', 'fox', 1, NULL);
      INSERT INTO recipes (id, name, is_published) VALUES (1, 'Carrot Soup', TRUE);
    `);
    await resetSequences(db);
    await studentAgent.post('/auth/select-student').send({ studentId: 1 });
  });

  it('adds a recipe to the cookbook and is idempotent on repeat add', async () => {
    const first = await studentAgent.post('/students/1/cookbook').send({ recipeId: 1 });
    expect(first.status).toBe(201);
    expect(first.body.student_id).toBe(1);
    expect(first.body.is_made).toBe(false);

    const second = await studentAgent.post('/students/1/cookbook').send({ recipeId: 1 });
    expect(second.status).toBe(200);
    expect(second.body.id).toBe(first.body.id);

    const count = (await db.query<{ n: number }>('SELECT COUNT(*)::int as n FROM cookbook_entries')).rows[0];
    expect(count.n).toBe(1);
  });

  it('lists the cookbook with the joined recipe name', async () => {
    const res = await studentAgent.get('/students/1/cookbook');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].recipe_name).toBe('Carrot Soup');
  });

  it('rejects rating before "made" is set', async () => {
    const entryId = (await db.query<{ id: number }>(
      'SELECT id FROM cookbook_entries WHERE student_id = $1',
      [1],
    )).rows[0].id;
    const res = await studentAgent.post(`/cookbook/${entryId}/rating`).send({ rating: 3 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('not_yet_made');
  });

  it('marks "I made it" then allows rating 1-3', async () => {
    const entryId = (await db.query<{ id: number }>(
      'SELECT id FROM cookbook_entries WHERE student_id = $1',
      [1],
    )).rows[0].id;

    const made = await studentAgent.post(`/cookbook/${entryId}/made`).send({});
    expect(made.status).toBe(200);
    expect(made.body.is_made).toBe(true);

    const rated = await studentAgent.post(`/cookbook/${entryId}/rating`).send({ rating: 3 });
    expect(rated.status).toBe(200);
    expect(rated.body.rating).toBe(3);

    const badRating = await studentAgent.post(`/cookbook/${entryId}/rating`).send({ rating: 5 });
    expect(badRating.status).toBe(400);
  });

  it('rejects access from an unrelated student session', async () => {
    await db.query(
      'INSERT INTO students (id, display_name, avatar_key, class_id) VALUES ($1, $2, $3, $4)',
      [2, 'Ben', 'owl', 1],
    );
    const otherAgent = request.agent(app);
    await otherAgent.post('/auth/select-student').send({ studentId: 2 });

    const res = await otherAgent.get('/students/1/cookbook');
    expect(res.status).toBe(403);
  });
});
