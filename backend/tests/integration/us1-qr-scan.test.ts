import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { makeTestDb } from '../helpers/testDb.js';

describe('US1: QR scan → plant detail', () => {
  const db = makeTestDb();
  const app = createApp(db);
  const agent = request.agent(app);

  afterAll(() => db.close());

  beforeAll(() => {
    db.exec(`
      INSERT INTO users (id, role, name, email, password_hash) VALUES (1, 'teacher', 'Ms. Rivera', 't@example.com', 'x');
      INSERT INTO classes (id, name, teacher_id) VALUES (1, 'Room 4', 1);
      INSERT INTO students (id, display_name, avatar_key, class_id) VALUES (1, 'Ava', 'fox', 1);
      INSERT INTO plants (id, name, qr_code, benefit_text, is_published)
        VALUES (1, 'Carrot', 'QR-CARROT-01', 'Carrots help you see in the dark!', 1);
      INSERT INTO plants (id, name, qr_code, benefit_text, is_published)
        VALUES (2, 'Draft Kale', 'QR-KALE-01', 'Not ready yet', 0);
    `);
  });

  it('lists only published plants without auth rejection once logged in', async () => {
    const login = await agent.post('/auth/select-student').send({ studentId: 1 });
    expect(login.status).toBe(200);
    expect(login.body).toEqual({ id: 1, displayName: 'Ava', avatarKey: 'fox' });

    const list = await agent.get('/plants');
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].name).toBe('Carrot');
  });

  it('resolves a scanned QR code to the plant and logs a discovery', async () => {
    const res = await agent.get('/plants/by-qr/QR-CARROT-01');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Carrot');
    expect(res.body.benefit_text).toContain('dark');

    const discovery = db
      .prepare('SELECT * FROM plant_discoveries WHERE student_id = 1 AND plant_id = 1')
      .get();
    expect(discovery).toBeTruthy();

    const activity = db
      .prepare("SELECT * FROM activity_log WHERE action = 'plant_scanned'")
      .get();
    expect(activity).toBeTruthy();
  });

  it('returns a friendly 404 for an unrecognized QR code', async () => {
    const res = await agent.get('/plants/by-qr/QR-DOES-NOT-EXIST');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('qr_code_not_recognized');
  });

  it('does not resolve an unpublished plant by QR code', async () => {
    const res = await agent.get('/plants/by-qr/QR-KALE-01');
    expect(res.status).toBe(404);
  });

  it('rejects unauthenticated requests', async () => {
    const res = await request(app).get('/plants');
    expect(res.status).toBe(403);
  });
});
