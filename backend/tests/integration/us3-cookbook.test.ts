import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { makeTestDb } from '../helpers/testDb.js';

describe('US3: Cookbook add/browse/made/rate', () => {
  const db = makeTestDb();
  const app = createApp(db);
  const studentAgent = request.agent(app);

  afterAll(() => db.close());

  beforeAll(async () => {
    db.exec(`
      INSERT INTO users (id, role, name, email, password_hash) VALUES (1, 'teacher', 'Ms. Rivera', 't@example.com', 'x');
      INSERT INTO classes (id, name, teacher_id) VALUES (1, 'Room 4', 1);
      INSERT INTO students (id, display_name, avatar_key, class_id, parent_id) VALUES (1, 'Ava', 'fox', 1, NULL);
      INSERT INTO recipes (id, name, is_published) VALUES (1, 'Carrot Soup', 1);
    `);
    await studentAgent.post('/auth/select-student').send({ studentId: 1 });
  });

  it('adds a recipe to the cookbook and is idempotent on repeat add', async () => {
    const first = await studentAgent.post('/students/1/cookbook').send({ recipeId: 1 });
    expect(first.status).toBe(201);
    expect(first.body.student_id).toBe(1);
    expect(first.body.is_made).toBe(0);

    const second = await studentAgent.post('/students/1/cookbook').send({ recipeId: 1 });
    expect(second.status).toBe(200);
    expect(second.body.id).toBe(first.body.id);

    const count = db.prepare('SELECT COUNT(*) as n FROM cookbook_entries').get() as { n: number };
    expect(count.n).toBe(1);
  });

  it('lists the cookbook with the joined recipe name', async () => {
    const res = await studentAgent.get('/students/1/cookbook');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].recipe_name).toBe('Carrot Soup');
  });

  it('rejects rating before "made" is set', async () => {
    const entryId = (
      db.prepare('SELECT id FROM cookbook_entries WHERE student_id = 1').get() as { id: number }
    ).id;
    const res = await studentAgent.post(`/cookbook/${entryId}/rating`).send({ rating: 3 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('not_yet_made');
  });

  it('marks "I made it" then allows rating 1-3', async () => {
    const entryId = (
      db.prepare('SELECT id FROM cookbook_entries WHERE student_id = 1').get() as { id: number }
    ).id;

    const made = await studentAgent.post(`/cookbook/${entryId}/made`).send({});
    expect(made.status).toBe(200);
    expect(made.body.is_made).toBe(1);

    const rated = await studentAgent.post(`/cookbook/${entryId}/rating`).send({ rating: 3 });
    expect(rated.status).toBe(200);
    expect(rated.body.rating).toBe(3);

    const badRating = await studentAgent.post(`/cookbook/${entryId}/rating`).send({ rating: 5 });
    expect(badRating.status).toBe(400);
  });

  it('rejects access from an unrelated student session', async () => {
    db.exec(
      'INSERT INTO students (id, display_name, avatar_key, class_id) VALUES (2, \'Ben\', \'owl\', 1)',
    );
    const otherAgent = request.agent(app);
    await otherAgent.post('/auth/select-student').send({ studentId: 2 });

    const res = await otherAgent.get('/students/1/cookbook');
    expect(res.status).toBe(403);
  });
});
