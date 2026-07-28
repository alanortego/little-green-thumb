import { Router } from 'express';
import type Database from 'better-sqlite3';
import { requireRole } from '../middleware/roleGuard.js';
import { logActivity } from '../services/activityLog.js';
import { generateQrLabelDataUrl } from '../services/qrLabelGenerator.js';
import type { PlantRow } from '../models/types.js';

/** Teachers may only manage their own class's garden; admins may manage any. */
function canAccessClass(db: Database.Database, req: { session: { role?: string; userId?: number } }, classId: number): boolean {
  if (req.session.role === 'admin') {
    return true; 
  }
  const owned = db
    .prepare('SELECT 1 FROM classes WHERE id = ? AND teacher_id = ?')
    .get(classId, req.session.userId);
  return Boolean(owned);
}

function loadGardenSelection(db: Database.Database, classId: number): PlantRow[] {
  return db
    .prepare<[number], PlantRow>(
      `SELECT p.* FROM plants p
       JOIN garden_selections gs ON gs.plant_id = p.id
       WHERE gs.class_id = ?
       ORDER BY p.name`,
    )
    .all(classId);
}

/**
 * US7: garden selection (which published plants are physically present) and
 * the printable QR label sheet generated from it (FR-017).
 */
export function createGardenRouter(db: Database.Database): Router {
  const router = Router();

  router.get('/classes/:id/garden-selection', requireRole('teacher', 'admin'), (req, res) => {
    const classId = Number(req.params.id);
    if (!canAccessClass(db, req, classId)) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }
    res.json(loadGardenSelection(db, classId));
  });

  router.put('/classes/:id/garden-selection', requireRole('teacher', 'admin'), (req, res) => {
    const classId = Number(req.params.id);
    if (!canAccessClass(db, req, classId)) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const { plantIds } = req.body as { plantIds?: number[] };
    if (!plantIds || plantIds.length === 0) {
      res.status(400).json({ error: 'empty_selection' });
      return;
    }

    const tx = db.transaction(() => {
      db.prepare('DELETE FROM garden_selections WHERE class_id = ?').run(classId);
      const insert = db.prepare(
        'INSERT INTO garden_selections (class_id, plant_id, selected_by) VALUES (?, ?, ?)',
      );
      for (const plantId of plantIds) {
        insert.run(classId, plantId, req.session.userId as number);
      }
    });
    tx();

    res.json(loadGardenSelection(db, classId));
  });

  // GET /classes/:id/garden-labels.pdf — a printable HTML sheet; the
  // teacher/admin uses the browser's print-to-PDF to produce the actual
  // file (per contracts/api.md), so this serves HTML rather than a PDF
  // binary. ponytail: no server-side PDF library needed for that.
  router.get('/classes/:id/garden-labels.pdf', requireRole('teacher', 'admin'), async (req, res) => {
    const classId = Number(req.params.id);
    if (!canAccessClass(db, req, classId)) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const plants = loadGardenSelection(db, classId);
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

    logActivity(db, {
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
