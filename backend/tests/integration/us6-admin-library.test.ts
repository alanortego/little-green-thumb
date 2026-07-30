import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { closeTestDb, makeTestDb, resetSequences } from '../helpers/testDb.js';

describe('US6: Super admin builds the Plant and Recipe library', () => {
  let db: Awaited<ReturnType<typeof makeTestDb>>;
  let app: ReturnType<typeof createApp>;
  let adminAgent: ReturnType<typeof request.agent>;
  let teacherAgent: ReturnType<typeof request.agent>;

  afterAll(() => closeTestDb(db));

  beforeAll(async () => {
    db = await makeTestDb();
    app = createApp(db);
    adminAgent = request.agent(app);
    teacherAgent = request.agent(app);
    const hash = bcrypt.hashSync('password123', 4);
    await db.query(
      `INSERT INTO users (id, role, name, email, password_hash)
       VALUES (1, 'admin', 'Super Admin', 'admin@example.com', $1)`,
      [hash],
    );
    await db.query(
      `INSERT INTO users (id, role, name, email, password_hash)
       VALUES (2, 'teacher', 'Ms. Rivera', 't@example.com', $1)`,
      [hash],
    );
    await resetSequences(db);

    await adminAgent.post('/auth/login').send({ email: 'admin@example.com', password: 'password123' });
    await teacherAgent.post('/auth/login').send({ email: 't@example.com', password: 'password123' });
  });

  it('rejects a non-admin from creating a plant', async () => {
    const res = await teacherAgent.post('/plants').send({ name: 'Carrot', qrCode: 'QR-CARROT' });
    expect(res.status).toBe(403);
  });

  it('creates a draft plant and blocks publish until required fields are set', async () => {
    const createRes = await adminAgent.post('/plants').send({ name: 'Carrot', qrCode: 'QR-CARROT' });
    expect(createRes.status).toBe(201);
    expect(createRes.body.is_published).toBe(false);
    const plantId = createRes.body.id;

    const blockedPublish = await adminAgent.post(`/plants/${plantId}/publish`);
    expect(blockedPublish.status).toBe(422);
    expect(blockedPublish.body.missingFields).toEqual(
      expect.arrayContaining(['image_path', 'benefit_text']),
    );

    const editRes = await adminAgent.put(`/plants/${plantId}`).send({
      imagePath: '/img/carrot.png',
      benefitText: 'Carrots help you see in the dark!',
    });
    expect(editRes.status).toBe(200);

    const publishRes = await adminAgent.post(`/plants/${plantId}/publish`);
    expect(publishRes.status).toBe(200);
    expect(publishRes.body.is_published).toBe(true);
  });

  it('creates a recipe with steps/plants and blocks publish until every step has media', async () => {
    const plant = await adminAgent.post('/plants').send({ name: 'Pea', qrCode: 'QR-PEA' });
    const plantId = plant.body.id;

    const createRes = await adminAgent.post('/recipes').send({
      name: 'Pea Soup',
      plantIds: [plantId],
      steps: [
        { stepOrder: 1, imagePath: '/img/step1.png' },
        { stepOrder: 2 },
      ],
    });
    expect(createRes.status).toBe(201);
    expect(createRes.body.steps).toHaveLength(2);
    const recipeId = createRes.body.id;

    const blockedPublish = await adminAgent.post(`/recipes/${recipeId}/publish`);
    expect(blockedPublish.status).toBe(422);
    expect(blockedPublish.body.missingFields).toEqual(
      expect.arrayContaining(['step_2_image_path']),
    );

    const updateRes = await adminAgent.put(`/recipes/${recipeId}`).send({
      steps: [
        { stepOrder: 1, imagePath: '/img/step1.png' },
        { stepOrder: 2, imagePath: '/img/step2.png' },
      ],
    });
    expect(updateRes.status).toBe(200);

    const publishRes = await adminAgent.post(`/recipes/${recipeId}/publish`);
    expect(publishRes.status).toBe(200);
    expect(publishRes.body.is_published).toBe(true);
  });

  it('returns aggregate usage counts, optionally filtered by date range', async () => {
    await db.query(`
      INSERT INTO activity_log (actor_type, actor_id, action, created_at) VALUES
        ('student', 1, 'plant_scanned', '2024-01-01T00:00:00.000Z'),
        ('student', 1, 'recipe_added_to_cookbook', '2024-01-02T00:00:00.000Z'),
        ('student', 1, 'recipe_made', '2099-01-01T00:00:00.000Z');
    `);

    const allTime = await adminAgent.get('/admin/usage');
    expect(allTime.status).toBe(200);
    expect(allTime.body.plantsScanned).toBeGreaterThanOrEqual(1);
    expect(allTime.body.recipesAdded).toBeGreaterThanOrEqual(1);

    const filtered = await adminAgent.get('/admin/usage?from=2024-01-01&to=2024-01-31');
    expect(filtered.body.recipesMade).toBe(0);
  });

  it('rejects a non-admin from viewing the usage dashboard', async () => {
    const res = await teacherAgent.get('/admin/usage');
    expect(res.status).toBe(403);
  });
});
