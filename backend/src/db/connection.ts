import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const currentDir = dirname(fileURLToPath(import.meta.url));

const DB_PATH = process.env.DATABASE_PATH ?? join(currentDir, '../../data/app.db');

let db: Database.Database | undefined;

/**
 * Returns the shared SQLite connection, applying schema.sql on first use.
 * ponytail: no migration framework — schema.sql is idempotent (CREATE TABLE
 * IF NOT EXISTS); add a real migration tool if the schema needs versioned
 * changes after data exists in production.
 */
export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    const schema = readFileSync(join(currentDir, 'schema.sql'), 'utf8');
    db.exec(schema);
  }
  return db;
}

export function closeDb(): void {
  db?.close();
  db = undefined;
}
