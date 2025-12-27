import { getDb } from '../index';

export interface CurrencyRow {
  code: string;
  name: string;
  symbol: string | null;
  rate_to_base: number;
  created_at: number;
  archived_at: number | null;
}

export async function listCurrencies(includeArchived = false): Promise<CurrencyRow[]> {
  const db = await getDb();
  const where = includeArchived ? '' : 'WHERE archived_at IS NULL';
  return db.getAllAsync<CurrencyRow>(
    `SELECT * FROM currencies ${where} ORDER BY code ASC`,
  );
}

export async function getCurrency(code: string): Promise<CurrencyRow | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<CurrencyRow>('SELECT * FROM currencies WHERE code = ?', code);
  return row ?? null;
}

export async function upsertCurrency(input: {
  code: string;
  name: string;
  symbol?: string | null;
  rate_to_base: number;
}): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO currencies (code, name, symbol, rate_to_base, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(code) DO UPDATE SET
       name = excluded.name,
       symbol = excluded.symbol,
       rate_to_base = excluded.rate_to_base,
       archived_at = NULL`,
    input.code.toUpperCase(),
    input.name,
    input.symbol ?? null,
    input.rate_to_base,
    Date.now(),
  );
}

export async function archiveCurrency(code: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE currencies SET archived_at = ? WHERE code = ?', Date.now(), code);
}
