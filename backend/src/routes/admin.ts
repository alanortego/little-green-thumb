import { Router } from 'express';
import type Database from 'better-sqlite3';
import { requireRole } from '../middleware/roleGuard.js';

/**
 * GET /admin/usage?from=&to= — aggregate usage counts for the super admin
 * dashboard (FR-019). `from`/`to` are ISO date strings (inclusive); both are
 * optional — an open range covers all activity.
 */
export function createAdminRouter(db: Database.Database): Router {
  const router = Router();

  router.get('/admin/usage', requireRole('admin'), (req, res) => {
    const from = typeof req.query.from === 'string' ? req.query.from : null;
    const to = typeof req.query.to === 'string' ? req.query.to : null;

    const countForAction = (action: string): number => {
      const row = db
        .prepare<
        [string, string | null, string | null, string | null, string | null],
        { count: number }
      >(
          `SELECT COUNT(*) as count FROM activity_log
           WHERE action = ?
             AND (? IS NULL OR created_at >= ?)
             AND (? IS NULL OR created_at <= ?)`,
        )
        .get(action, from, from, to, to);
      return row?.count ?? 0;
    };

    res.json({
      from,
      to,
      plantsScanned: countForAction('plant_scanned'),
      recipesAdded: countForAction('recipe_added_to_cookbook'),
      recipesMade: countForAction('recipe_made'),
    });
  });

  return router;
}
