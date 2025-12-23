import * as SQLite from 'expo-sqlite';
import { migrations } from './migrations';
import { seedDefaultData } from './seed';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
let initPromise: Promise<void> | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('worthy.db');
  }
  return dbPromise;
}

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = ON;');
  const versionRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  let currentVersion = versionRow?.user_version ?? 0;

  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      await db.execAsync('BEGIN;');
      try {
        await db.execAsync(migration.sql);
        await db.execAsync(`PRAGMA user_version = ${migration.version};`);
        await db.execAsync('COMMIT;');
        currentVersion = migration.version;
      } catch (error) {
        await db.execAsync('ROLLBACK;');
        throw error;
      }
    }
  }
}

export async function initDb(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const db = await getDb();
      await migrate(db);
      await seedDefaultData();
    })();
  }
  return initPromise;
}
