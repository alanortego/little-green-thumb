import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import Database from 'better-sqlite3';

const currentDir = dirname(fileURLToPath(import.meta.url));

/** In-memory SQLite DB with the app schema applied — shared by all backend tests. */
export function makeTestDb(): Database.Database {
  const db = new Database(':memory:');
  db.exec(readFileSync(join(currentDir, '../../src/db/schema.sql'), 'utf8'));
  return db;
}
