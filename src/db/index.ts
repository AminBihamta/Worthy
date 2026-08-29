import * as SQLite from 'expo-sqlite';
import { migrations } from './migrations';
import { seedDefaultData } from './seed';

const DATABASE_NAME = 'worthy.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
let initPromise: Promise<void> | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DATABASE_NAME);
  }
  return dbPromise;
}

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = ON;');
  const versionRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  let currentVersion = versionRow?.user_version ?? 0;

  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      await migration.prepare?.();
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

export async function resetDatabase(): Promise<void> {
  const db = await getDb();
  await db.closeAsync();

  dbPromise = null;
  initPromise = null;

  try {
    await SQLite.deleteDatabaseAsync(DATABASE_NAME);
    await initDb();
  } catch (error) {
    // Allow a later retry instead of retaining a rejected initialization promise.
    initPromise = null;
    throw error;
  }
}
