import { getDb } from '../index';
import { createId } from '../../utils/id';

export interface IncomeRow {
  id: string;
  source: string;
  amount_minor: number;
  account_id: string;
  currency_code: string | null;
  date_ts: number;
  hours_worked: number | null;
  notes: string | null;
  created_at: number;
  updated_at: number;
}

export interface IncomeListRow extends IncomeRow {
  account_name: string;
  account_currency: string;
}

export async function listIncomes(filters?: {
  start?: number;
  end?: number;
  accountId?: string;
  limit?: number;
}): Promise<IncomeListRow[]> {
  const db = await getDb();
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (filters?.start) {
    conditions.push('i.date_ts >= ?');
    params.push(filters.start);
  }
  if (filters?.end) {
    conditions.push('i.date_ts <= ?');
    params.push(filters.end);
  }
  if (filters?.accountId) {
    conditions.push('i.account_id = ?');
    params.push(filters.accountId);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = filters?.limit ? `LIMIT ${filters.limit}` : '';

  return db.getAllAsync<IncomeListRow>(
    `SELECT i.*, a.name as account_name, a.currency as account_currency
     FROM incomes i
     JOIN accounts a ON a.id = i.account_id
     ${where}
     ORDER BY i.date_ts DESC
     ${limit}`,
    ...params,
  );
}

export async function getIncome(id: string): Promise<IncomeListRow | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<IncomeListRow>(
    `SELECT i.*, a.name as account_name, a.currency as account_currency
     FROM incomes i
     JOIN accounts a ON a.id = i.account_id
     WHERE i.id = ?`,
    id,
  );
  return row ?? null;
}

export async function createIncome(input: {
  source: string;
  amount_minor: number;
  account_id: string;
  currency_code?: string | null;
  date_ts: number;
  hours_worked?: number | null;
  notes?: string | null;
}): Promise<string> {
  const db = await getDb();
  const id = createId('inc_');
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO incomes (id, source, amount_minor, account_id, currency_code, date_ts, hours_worked, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.source,
    input.amount_minor,
    input.account_id,
    input.currency_code ?? null,
    input.date_ts,
    input.hours_worked ?? null,
    input.notes ?? null,
    now,
    now,
  );
  return id;
}

export async function updateIncome(
  id: string,
  input: Partial<Omit<IncomeRow, 'id' | 'created_at' | 'updated_at'>>,
): Promise<void> {
  const db = await getDb();
  const fields = Object.keys(input);
  if (fields.length === 0) return;
  const assignments = fields.map((field) => `${field} = ?`).join(', ');
  const values = fields.map((field) => (input as Record<string, unknown>)[field]);
  await db.runAsync(
    `UPDATE incomes SET ${assignments}, updated_at = ? WHERE id = ?`,
    ...values,
    Date.now(),
    id,
  );
}

export async function deleteIncome(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM incomes WHERE id = ?', id);
}

export async function getIncomeTotals(start: number, end: number) {
  const db = await getDb();
  const row = await db.getFirstAsync<{ total_minor: number }>(
    `SELECT ROUND(SUM(i.amount_minor * COALESCE(c.rate_to_base, 1))) as total_minor
     FROM incomes i
     JOIN accounts a ON a.id = i.account_id
     LEFT JOIN currencies c ON c.code = COALESCE(i.currency_code, a.currency)
     WHERE i.date_ts BETWEEN ? AND ?`,
    start,
    end,
  );
  return row?.total_minor ?? 0;
}

export async function getIncomeHoursTotals(start: number, end: number) {
  const db = await getDb();
  const row = await db.getFirstAsync<{ total_minor: number; total_hours: number }>(
    `SELECT ROUND(SUM(i.amount_minor * COALESCE(c.rate_to_base, 1))) as total_minor,
      SUM(i.hours_worked) as total_hours
     FROM incomes i
     JOIN accounts a ON a.id = i.account_id
     LEFT JOIN currencies c ON c.code = COALESCE(i.currency_code, a.currency)
     WHERE i.date_ts BETWEEN ? AND ? AND i.hours_worked IS NOT NULL`,
    start,
    end,
  );
  return {
    total_minor: row?.total_minor ?? 0,
    total_hours: row?.total_hours ?? 0,
  };
}
