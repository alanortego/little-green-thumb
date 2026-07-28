import { Router } from 'express';
import type Database from 'better-sqlite3';
import { requireAuth, requireRole } from '../middleware/roleGuard.js';
import { logActivity } from '../services/activityLog.js';
import type { PlantRow } from '../models/types.js';

/** Fields FR-016 requires before a Plant can be published. */
function missingPlantFields(plant: PlantRow): string[] {
  const missing: string[] = [];
  if (!plant.image_path) {
    missing.push('image_path'); 
  }
  if (!plant.benefit_text) {
    missing.push('benefit_text'); 
  }
  return missing;
}

export function createPlantsRouter(db: Database.Database): Router {
  const router = Router();

  // GET /plants — published plants for everyone; admin can add drafts via ?includeDrafts=1 (FR-004).
  router.get('/', requireAuth, (req, res) => {
    const includeDrafts = req.session.role === 'admin' && req.query.includeDrafts === '1';
    const plants = includeDrafts
      ? db.prepare<[], PlantRow>('SELECT * FROM plants ORDER BY name').all()
      : db
        .prepare<[], PlantRow>('SELECT * FROM plants WHERE is_published = 1 ORDER BY name')
        .all();
    res.json(plants);
  });

  // GET /plants/:id — plant benefit page detail (FR-002).
  router.get('/:id', requireAuth, (req, res) => {
    const plant = db
      .prepare<[string], PlantRow>('SELECT * FROM plants WHERE id = ?')
      .get(String(req.params.id));
    if (!plant) {
      res.status(404).json({ error: 'plant_not_found' });
      return;
    }
    res.json(plant);
  });

  // POST /plants — create a draft Plant entry (FR-015). Admin-only.
  router.post('/', requireRole('admin'), (req, res) => {
    const { name, qrCode } = req.body as { name?: string; qrCode?: string };
    if (!name || !qrCode) {
      res.status(400).json({ error: 'name_and_qr_code_required' });
      return;
    }

    const info = db
      .prepare('INSERT INTO plants (name, qr_code, created_by) VALUES (?, ?, ?)')
      .run(name, qrCode, req.session.userId as number);
    const created = db
      .prepare<[number], PlantRow>('SELECT * FROM plants WHERE id = ?')
      .get(info.lastInsertRowid as number);
    res.status(201).json(created);
  });

  // PUT /plants/:id — edit any field (FR-015). Admin-only.
  router.put('/:id', requireRole('admin'), (req, res) => {
    const plantId = Number(req.params.id);
    const existing = db.prepare<[number], PlantRow>('SELECT * FROM plants WHERE id = ?').get(plantId);
    if (!existing) {
      res.status(404).json({ error: 'plant_not_found' });
      return;
    }

    const { name, qrCode, imagePath, benefitText } = req.body as {
      name?: string;
      qrCode?: string;
      imagePath?: string | null;
      benefitText?: string | null;
    };

    db.prepare(
      `UPDATE plants SET
         name = COALESCE(?, name),
         qr_code = COALESCE(?, qr_code),
         image_path = COALESCE(?, image_path),
         benefit_text = COALESCE(?, benefit_text),
         updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       WHERE id = ?`,
    ).run(
      name ?? null,
      qrCode ?? null,
      imagePath ?? null,
      benefitText ?? null,
      plantId,
    );

    const updated = db.prepare<[number], PlantRow>('SELECT * FROM plants WHERE id = ?').get(plantId);
    res.json(updated);
  });

  // POST /plants/:id/publish — field-gated publish (FR-016). Admin-only.
  router.post('/:id/publish', requireRole('admin'), (req, res) => {
    const plantId = Number(req.params.id);
    const plant = db.prepare<[number], PlantRow>('SELECT * FROM plants WHERE id = ?').get(plantId);
    if (!plant) {
      res.status(404).json({ error: 'plant_not_found' });
      return;
    }

    const missingFields = missingPlantFields(plant);
    if (missingFields.length > 0) {
      res.status(422).json({ error: 'missing_required_fields', missingFields });
      return;
    }

    db.prepare('UPDATE plants SET is_published = 1 WHERE id = ?').run(plantId);
    const published = db.prepare<[number], PlantRow>('SELECT * FROM plants WHERE id = ?').get(plantId);
    res.json(published);
  });

  // GET /plants/by-qr/:qrCode — resolves a scanned QR code to its Plant (FR-001, FR-018)
  // and records a plant_discoveries row for the active student.
  router.get('/by-qr/:qrCode', requireAuth, (req, res) => {
    const plant = db
      .prepare<[string], PlantRow>('SELECT * FROM plants WHERE qr_code = ? AND is_published = 1')
      .get(String(req.params.qrCode));

    if (!plant) {
      // Friendly 404 — the client shows a retry/browse-library fallback (Edge Cases, User Story 1).
      res.status(404).json({ error: 'qr_code_not_recognized' });
      return;
    }

    const studentId = req.session.studentId;
    if (req.session.role === 'child' && studentId) {
      db.prepare(
        `INSERT INTO plant_discoveries (student_id, plant_id, first_scanned_at, last_scanned_at)
         VALUES (@studentId, @plantId, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'), strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
         ON CONFLICT (student_id, plant_id)
         DO UPDATE SET last_scanned_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
      ).run({ studentId, plantId: plant.id });

      logActivity(db, {
        actorType: 'student',
        actorId: studentId,
        action: 'plant_scanned',
        contentType: 'plant',
        contentId: plant.id,
      });
    }

    res.json(plant);
  });

  return router;
}
