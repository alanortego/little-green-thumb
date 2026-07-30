import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { closeTestDb, makeTestDb, resetSequences } from '../helpers/testDb.js';

describe('US2: recipe browse and step-through', () => {
  let db: Awaited<ReturnType<typeof makeTestDb>>;
  let app: ReturnType<typeof createApp>;
  let agent: ReturnType<typeof request.agent>;

  afterAll(() => closeTestDb(db));

  beforeAll(async () => {
    db = await makeTestDb();
    app = createApp(db);
    agent = request.agent(app);
    await db.query(`
      INSERT INTO users (id, role, name, email, password_hash) VALUES (1, 'teacher', 'Ms. Rivera', 't@example.com', 'x');
      INSERT INTO classes (id, name, teacher_id) VALUES (1, 'Room 4', 1);
      INSERT INTO students (id, display_name, avatar_key, class_id) VALUES (1, 'Ava', 'fox', 1);
      INSERT INTO plants (id, name, qr_code, benefit_text, is_published) VALUES (1, 'Carrot', 'QR-CARROT-01', 'Sees in the dark', TRUE);
      INSERT INTO recipes (id, name, is_published) VALUES (1, 'Carrot Soup', TRUE);
      INSERT INTO recipes (id, name, is_published) VALUES (2, 'Draft Carrot Cake', FALSE);
      INSERT INTO recipe_plants (recipe_id, plant_id) VALUES (1, 1), (2, 1);
      INSERT INTO recipe_steps (recipe_id, step_order, step_text) VALUES
        (1, 1, 'Wash the carrots.'),
        (1, 2, 'Chop the carrots.'),
        (1, 3, 'Simmer until soft.');
    `);
    await resetSequences(db);
    await agent.post('/auth/select-student').send({ studentId: 1 });
  });

  it('lists only published recipes linked to a plant', async () => {
    const res = await agent.get('/plants/1/recipes');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Carrot Soup');
  });

  it('returns 404 for a plant with no recipes', async () => {
    const res = await agent.get('/plants/999/recipes');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns a recipe with its ordered steps', async () => {
    const res = await agent.get('/recipes/1');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Carrot Soup');
    expect(res.body.steps).toHaveLength(3);
    expect(res.body.steps[0].step_text).toBe('Wash the carrots.');
    expect(res.body.steps[2].step_order).toBe(3);
  });

  it('404s for an unknown recipe id', async () => {
    const res = await agent.get('/recipes/999');
    expect(res.status).toBe(404);
  });
});
