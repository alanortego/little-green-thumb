declare module 'better-sqlite3-session-store' {
  import type session from 'express-session';
  import type Database from 'better-sqlite3';

  interface SqliteStoreOptions {
    client: Database.Database;
    expired?: { clear?: boolean; intervalMs?: number };
  }

  export default function sqliteStoreFactory(
    session: typeof import('express-session'),
  ): {
    new (options: SqliteStoreOptions): session.Store;
  };
}
