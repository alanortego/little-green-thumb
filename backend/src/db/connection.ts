import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool, type PoolClient } from 'pg';

const currentDir = dirname(fileURLToPath(import.meta.url));
export type Db = Pool | PoolClient;

let db: Pool | undefined;
let initialization: Promise<void> | undefined;

export async function initializeDatabase(database: Db): Promise<void> {
  const schema = await readFile(join(currentDir, 'schema.sql'), 'utf8');
  await database.query(schema);
}

/**
 * Returns the shared PostgreSQL pool and initializes the idempotent schema
 * once. Render supplies DATABASE_URL; the local fallback names a dedicated
 * development database.
 */
export async function getDb(): Promise<Pool> {
  if (!db) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL must be set to the PostgreSQL development or production database');
    }
    db = new Pool({ connectionString: process.env.DATABASE_URL });
    db.on('error', (error) => {
      process.stderr.write(`Unexpected PostgreSQL pool error: ${error.message}\n`);
    });
    initialization = initializeDatabase(db);
  }
  await initialization;
  return db;
}

export async function closeDb(): Promise<void> {
  await db?.end();
  db = undefined;
  initialization = undefined;
}
