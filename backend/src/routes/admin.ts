import { Router } from 'express';
import type { Pool } from 'pg';
import { requireRole } from '../middleware/roleGuard.js';

/**
 * GET /admin/usage?from=&to= — aggregate usage counts for the super admin
 * dashboard (FR-019). `from`/`to` are ISO date strings (inclusive); both are
 * optional — an open range covers all activity.
 */
export function createAdminRouter(db: Pool): Router {
  const router = Router();

  router.get('/admin/usage', requireRole('admin'), async (req, res) => {
    const from = typeof req.query.from === 'string' ? req.query.from : null;
    const to = typeof req.query.to === 'string' ? req.query.to : null;

    const countForAction = async (action: string): Promise<number> => {
      const row = (
        await db.query<{ count: number }>(
          `SELECT COUNT(*)::int AS count FROM activity_log
           WHERE action = $1
             AND ($2::timestamptz IS NULL OR created_at >= $2::timestamptz)
             AND ($3::timestamptz IS NULL OR created_at <= $3::timestamptz)`,
          [action, from, to],
        )
      ).rows[0];
      return row?.count ?? 0;
    };

    const [plantsScanned, recipesAdded, recipesMade] = await Promise.all([
      countForAction('plant_scanned'),
      countForAction('recipe_added_to_cookbook'),
      countForAction('recipe_made'),
    ]);
    res.json({ from, to, plantsScanned, recipesAdded, recipesMade });
  });

  return router;
}
