import { Router } from 'express';
import type { Pool } from 'pg';
import { requireRole } from '../middleware/roleGuard.js';
import { logActivity } from '../services/activityLog.js';
import { generateQrLabelDataUrl } from '../services/qrLabelGenerator.js';
import type { PlantRow } from '../models/types.js';

async function canAccessClass(
  db: Pool,
  req: { session: { role?: string; userId?: number } },
  classId: number,
): Promise<boolean> {
  if (req.session.role === 'admin') {
    return true;
  }
  const owned = await db.query(
    'SELECT 1 FROM classes WHERE id = $1 AND teacher_id = $2',
    [classId, req.session.userId],
  );
  return Boolean(owned.rowCount);
}

async function loadGardenSelection(db: Pool, classId: number): Promise<PlantRow[]> {
  return (
    await db.query<PlantRow>(
      `SELECT p.* FROM plants p
       JOIN garden_selections gs ON gs.plant_id = p.id
       WHERE gs.class_id = $1
       ORDER BY p.name`,
      [classId],
    )
  ).rows;
}

export function createGardenRouter(db: Pool): Router {
  const router = Router();

  router.get('/classes/:id/garden-selection', requireRole('teacher', 'admin'), async (req, res) => {
    const classId = Number(req.params.id);
    if (!(await canAccessClass(db, req, classId))) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }
    res.json(await loadGardenSelection(db, classId));
  });

  router.put('/classes/:id/garden-selection', requireRole('teacher', 'admin'), async (req, res) => {
    const classId = Number(req.params.id);
    if (!(await canAccessClass(db, req, classId))) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const { plantIds } = req.body as { plantIds?: number[] };
    if (!plantIds || plantIds.length === 0) {
      res.status(400).json({ error: 'empty_selection' });
      return;
    }

    const client = await db.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM garden_selections WHERE class_id = $1', [classId]);
      for (const plantId of plantIds) {
        await client.query(
          'INSERT INTO garden_selections (class_id, plant_id, selected_by) VALUES ($1, $2, $3)',
          [classId, plantId, req.session.userId],
        );
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    res.json(await loadGardenSelection(db, classId));
  });

  router.get('/classes/:id/garden-labels.pdf', requireRole('teacher', 'admin'), async (req, res) => {
    const classId = Number(req.params.id);
    if (!(await canAccessClass(db, req, classId))) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const plants = await loadGardenSelection(db, classId);
    if (plants.length === 0) {
      res.status(404).json({ error: 'empty_selection' });
      return;
    }

    const labels = await Promise.all(
      plants.map(async (plant) => ({
        name: plant.name,
        qrDataUrl: await generateQrLabelDataUrl(plant.qr_code),
      })),
    );

    await logActivity(db, {
      actorType: req.session.role === 'admin' ? 'admin' : 'teacher',
      actorId: req.session.userId as number,
      action: 'garden_labels_printed',
    });

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Garden QR Labels</title>
<style>
  body { font-family: sans-serif; margin: 0; padding: 16px; }
  .sheet { display: flex; flex-wrap: wrap; gap: 16px; }
  .label { width: 220px; border: 1px dashed #999; padding: 12px; text-align: center; page-break-inside: avoid; }
  .label img { width: 180px; height: 180px; }
  .label h2 { font-size: 16px; margin: 8px 0 0; }
</style>
</head>
<body>
  <div class="sheet">
    ${labels
      .map(
        (label) => `<div class="label"><img src="${label.qrDataUrl}" alt="${label.name} QR code" /><h2>${label.name}</h2></div>`,
      )
      .join('\n    ')}
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  });

  return router;
}
