import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { initializeDatabase } from '../../src/db/connection.js';

function getTestDatabaseUrl(): string {
  const databaseUrl = process.env.TEST_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('TEST_DATABASE_URL must be set to a dedicated PostgreSQL test database');
  }
  return databaseUrl;
}

const TEST_DATABASE_URL = getTestDatabaseUrl();

export interface TestDb extends Pool {
  readonly testSchema: string;
}

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replaceAll('"', '""')}"`;
}

async function ensureTestDatabase(): Promise<void> {
  const testUrl = new URL(TEST_DATABASE_URL);
  const databaseName = decodeURIComponent(testUrl.pathname.slice(1));
  if (!databaseName) {
    throw new Error('TEST_DATABASE_URL must include a dedicated database name');
  }

  const maintenanceUrl = new URL(testUrl);
  maintenanceUrl.pathname = '/postgres';
  const maintenance = new Pool({ connectionString: maintenanceUrl.toString() });
  try {
    await maintenance.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
  } catch (error: unknown) {
    if (
      !(
        typeof error === 'object'
        && error
        && 'code' in error
        && (error.code === '42P04' || error.code === '23505')
      )
    ) {
      throw error;
    }
  } finally {
    await maintenance.end();
  }
}

/**
 * Creates an isolated schema for a test file inside the dedicated test
 * database. Each Vitest worker uses its own schema, so parallel test files
 * never share application or session data.
 */
export async function makeTestDb(): Promise<TestDb> {
  await ensureTestDatabase();
  const testSchema = `test_${randomUUID().replaceAll('-', '')}`;
  const db = new Pool({
    connectionString: TEST_DATABASE_URL,
    options: `-c search_path=${testSchema},public`,
  }) as TestDb;
  Object.defineProperty(db, 'testSchema', { value: testSchema });
  await db.query(`CREATE SCHEMA ${quoteIdentifier(testSchema)}`);
  await initializeDatabase(db);
  return db;
}

export async function closeTestDb(db: TestDb | undefined): Promise<void> {
  if (!db) {
    return;
  }
  const { testSchema } = db;
  await db.end();

  const cleanup = new Pool({ connectionString: TEST_DATABASE_URL });
  try {
    await cleanup.query(`DROP SCHEMA IF EXISTS ${quoteIdentifier(testSchema)} CASCADE`);
  } finally {
    await cleanup.end();
  }
}

/** Advances identity sequences after fixtures that explicitly set numeric ids. */
export async function resetSequences(db: TestDb): Promise<void> {
  for (const table of [
    'users',
    'classes',
    'students',
    'plants',
    'recipes',
    'recipe_steps',
    'cookbook_entries',
    'plant_discoveries',
    'garden_selections',
    'activity_log',
  ]) {
    await db.query(
      `SELECT setval(
        pg_get_serial_sequence('${table}', 'id'),
        COALESCE((SELECT MAX(id) FROM ${table}), 1),
        EXISTS (SELECT 1 FROM ${table})
      )`,
    );
  }
}
