import { getDb } from '../index';
import { createId } from '../../utils/id';

export interface ExpenseRow {
  id: string;
  title: string;
  amount_minor: number;
  category_id: string;
  account_id: string;
  currency_code: string | null;
  date_ts: number;
  slider_0_100: number;
  notes: string | null;
  created_at: number;
  updated_at: number;
}

export interface ExpenseListRow extends ExpenseRow {
  category_name: string;
  category_color: string;
  category_icon: string;
  account_name: string;
  account_currency: string;
}

export async function listExpenses(filters?: {
  start?: number;
  end?: number;
  categoryId?: string;
  accountId?: string;
  limit?: number;
}): Promise<ExpenseListRow[]> {
  const db = await getDb();
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (filters?.start) {
    conditions.push('e.date_ts >= ?');
    params.push(filters.start);
  }
  if (filters?.end) {
    conditions.push('e.date_ts <= ?');
    params.push(filters.end);
  }
  if (filters?.categoryId) {
    conditions.push('e.category_id = ?');
    params.push(filters.categoryId);
  }
  if (filters?.accountId) {
    conditions.push('e.account_id = ?');
    params.push(filters.accountId);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = filters?.limit ? `LIMIT ${filters.limit}` : '';

  return db.getAllAsync<ExpenseListRow>(
    `SELECT e.*, c.name as category_name, c.color as category_color, c.icon as category_icon, a.name as account_name, a.currency as account_currency
     FROM expenses e
     JOIN categories c ON c.id = e.category_id
     JOIN accounts a ON a.id = e.account_id
     ${where}
     ORDER BY e.date_ts DESC
     ${limit}`,
    ...params,
  );
}

export async function getExpense(id: string): Promise<ExpenseListRow | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<ExpenseListRow>(
    `SELECT e.*, c.name as category_name, c.color as category_color, c.icon as category_icon, a.name as account_name, a.currency as account_currency
     FROM expenses e
     JOIN categories c ON c.id = e.category_id
     JOIN accounts a ON a.id = e.account_id
     WHERE e.id = ?`,
    id,
  );
  return row ?? null;
}

export async function createExpense(input: {
  title: string;
  amount_minor: number;
  category_id: string;
  account_id: string;
  currency_code?: string | null;
  date_ts: number;
  slider_0_100: number;
  notes?: string | null;
}): Promise<string> {
  const db = await getDb();
  const id = createId('exp_');
  const now = Date.now();
  await db.runAsync(
    `INSERT INTO expenses (id, title, amount_minor, category_id, account_id, currency_code, date_ts, slider_0_100, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.title,
    input.amount_minor,
    input.category_id,
    input.account_id,
    input.currency_code ?? null,
    input.date_ts,
    input.slider_0_100,
    input.notes ?? null,
    now,
    now,
  );
  return id;
}

export async function updateExpense(
  id: string,
  input: Partial<Omit<ExpenseRow, 'id' | 'created_at' | 'updated_at'>>,
): Promise<void> {
  const db = await getDb();
  const fields = Object.keys(input);
  if (fields.length === 0) return;
  const assignments = fields.map((field) => `${field} = ?`).join(', ');
  const values = fields.map((field) => (input as Record<string, unknown>)[field]);
  await db.runAsync(
    `UPDATE expenses SET ${assignments}, updated_at = ? WHERE id = ?`,
    ...values,
    Date.now(),
    id,
  );
}

export async function deleteExpense(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM expenses WHERE id = ?', id);
}

export async function sumExpensesByCategory(start: number, end: number) {
  const db = await getDb();
  return db.getAllAsync<{ category_id: string; total_minor: number }>(
    `SELECT e.category_id, ROUND(SUM(e.amount_minor * COALESCE(c.rate_to_base, 1))) as total_minor
     FROM expenses e
     JOIN accounts a ON a.id = e.account_id
     LEFT JOIN currencies c ON c.code = COALESCE(e.currency_code, a.currency)
     WHERE e.date_ts BETWEEN ? AND ?
     GROUP BY e.category_id`,
    start,
    end,
  );
}

export async function getExpenseTotals(start: number, end: number) {
  const db = await getDb();
  const row = await db.getFirstAsync<{ total_minor: number }>(
    `SELECT ROUND(SUM(e.amount_minor * COALESCE(c.rate_to_base, 1))) as total_minor
     FROM expenses e
     JOIN accounts a ON a.id = e.account_id
     LEFT JOIN currencies c ON c.code = COALESCE(e.currency_code, a.currency)
     WHERE e.date_ts BETWEEN ? AND ?`,
    start,
    end,
  );
  return row?.total_minor ?? 0;
}
