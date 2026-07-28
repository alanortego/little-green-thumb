import express from 'express';
import type Database from 'better-sqlite3';
import { createSessionMiddleware } from './middleware/session.js';
import { idleTimeout } from './middleware/idleTimeout.js';
import { createAuthRouter } from './routes/auth.js';
import { createPlantsRouter } from './routes/plants.js';
import { createRecipesRouter } from './routes/recipes.js';
import { createCookbookRouter } from './routes/cookbook.js';
import { createClassesRouter } from './routes/classes.js';
import { createStudentsRouter } from './routes/students.js';
import { createParentsRouter } from './routes/parents.js';
import { createAdminRouter } from './routes/admin.js';
import { createGardenRouter } from './routes/garden.js';

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173';

/**
 * Builds the Express app. Takes `db` as a parameter (rather than importing
 * the singleton directly) so tests can pass an in-memory database.
 */
export function createApp(db: Database.Database) {
  const app = express();

  // Ponytail: hand-rolled CORS instead of the `cors` package — the frontend
  // is a single known origin needing credentialed requests, not a public
  // API; add `cors` if more origins/config knobs are ever needed.
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', FRONTEND_ORIGIN);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  app.use(express.json());
  app.use(createSessionMiddleware(db));
  app.use(idleTimeout);

  app.use('/auth', createAuthRouter(db));
  app.use('/plants', createPlantsRouter(db));
  app.use(createRecipesRouter(db));
  app.use(createCookbookRouter(db));
  app.use(createClassesRouter(db));
  app.use(createStudentsRouter(db));
  app.use(createParentsRouter(db));
  app.use(createAdminRouter(db));
  app.use(createGardenRouter(db));

  app.get('/health', (_req, res) => res.json({ ok: true }));

  return app;
}
