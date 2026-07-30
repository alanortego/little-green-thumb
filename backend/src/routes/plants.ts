import { Router } from 'express';
import type { Pool } from 'pg';
import { requireAuth, requireRole } from '../middleware/roleGuard.js';
import { logActivity } from '../services/activityLog.js';
import type { PlantRow } from '../models/types.js';

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

export function createPlantsRouter(db: Pool): Router {
  const router = Router();

  router.get('/', requireAuth, async (req, res) => {
    const includeDrafts = req.session.role === 'admin' && req.query.includeDrafts === '1';
    const plants = includeDrafts
      ? (await db.query<PlantRow>('SELECT * FROM plants ORDER BY name')).rows
      : (await db.query<PlantRow>('SELECT * FROM plants WHERE is_published = TRUE ORDER BY name')).rows;
    res.json(plants);
  });

  router.get('/:id', requireAuth, async (req, res) => {
    const plant = (
      await db.query<PlantRow>('SELECT * FROM plants WHERE id = $1', [req.params.id])
    ).rows[0];
    if (!plant) {
      res.status(404).json({ error: 'plant_not_found' });
      return;
    }
    res.json(plant);
  });

  router.post('/', requireRole('admin'), async (req, res) => {
    const { name, qrCode } = req.body as { name?: string; qrCode?: string };
    if (!name || !qrCode) {
      res.status(400).json({ error: 'name_and_qr_code_required' });
      return;
    }

    const created = (
      await db.query<PlantRow>(
        'INSERT INTO plants (name, qr_code, created_by) VALUES ($1, $2, $3) RETURNING *',
        [name, qrCode, req.session.userId],
      )
    ).rows[0];
    res.status(201).json(created);
  });

  router.put('/:id', requireRole('admin'), async (req, res) => {
    const plantId = Number(req.params.id);
    const existing = (await db.query<PlantRow>('SELECT * FROM plants WHERE id = $1', [plantId])).rows[0];
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

    const updated = (
      await db.query<PlantRow>(
        `UPDATE plants SET
           name = COALESCE($1, name),
           qr_code = COALESCE($2, qr_code),
           image_path = COALESCE($3, image_path),
           benefit_text = COALESCE($4, benefit_text),
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $5
         RETURNING *`,
        [name ?? null, qrCode ?? null, imagePath ?? null, benefitText ?? null, plantId],
      )
    ).rows[0];
    res.json(updated);
  });

  router.post('/:id/publish', requireRole('admin'), async (req, res) => {
    const plantId = Number(req.params.id);
    const plant = (await db.query<PlantRow>('SELECT * FROM plants WHERE id = $1', [plantId])).rows[0];
    if (!plant) {
      res.status(404).json({ error: 'plant_not_found' });
      return;
    }

    const missingFields = missingPlantFields(plant);
    if (missingFields.length > 0) {
      res.status(422).json({ error: 'missing_required_fields', missingFields });
      return;
    }

    const published = (
      await db.query<PlantRow>(
        'UPDATE plants SET is_published = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
        [plantId],
      )
    ).rows[0];
    res.json(published);
  });

  router.get('/by-qr/:qrCode', requireAuth, async (req, res) => {
    const plant = (
      await db.query<PlantRow>(
        'SELECT * FROM plants WHERE qr_code = $1 AND is_published = TRUE',
        [req.params.qrCode],
      )
    ).rows[0];

    if (!plant) {
      res.status(404).json({ error: 'qr_code_not_recognized' });
      return;
    }

    const studentId = req.session.studentId;
    if (req.session.role === 'child' && studentId) {
      await db.query(
        `INSERT INTO plant_discoveries (student_id, plant_id)
         VALUES ($1, $2)
         ON CONFLICT (student_id, plant_id)
         DO UPDATE SET last_scanned_at = CURRENT_TIMESTAMP`,
        [studentId, plant.id],
      );

      await logActivity(db, {
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
