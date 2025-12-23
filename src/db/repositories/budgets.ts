import { getDb } from '../index';
import { createId } from '../../utils/id';

export interface BudgetRow {
  id: string;
  category_id: string;
  amount_minor: number;
  period_type: string;
  start_date_ts: number;
  created_at: number;
  archived_at: number | null;
}

export interface BudgetListRow extends BudgetRow {
  category_name: string;
  category_color: string;
  category_icon: string;
}

export async function listBudgets(includeArchived = false): Promise<BudgetListRow[]> {
  const db = await getDb();
  const where = includeArchived ? '' : 'WHERE b.archived_at IS NULL';
  return db.getAllAsync<BudgetListRow>(
    `SELECT b.*, c.name as category_name, c.color as category_color, c.icon as category_icon
     FROM budgets b
     JOIN categories c ON c.id = b.category_id
     ${where}
     ORDER BY b.created_at DESC`,
  );
}

export async function createBudget(input: {
  category_id: string;
  amount_minor: number;
  period_type: string;
  start_date_ts: number;
}): Promise<string> {
  const db = await getDb();
  const id = createId('bud_');
  await db.runAsync(
    `INSERT INTO budgets (id, category_id, amount_minor, period_type, start_date_ts, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    id,
    input.category_id,
    input.amount_minor,
    input.period_type,
    input.start_date_ts,
    Date.now(),
  );
  return id;
}

export async function updateBudget(
  id: string,
  input: Partial<Omit<BudgetRow, 'id' | 'created_at'>>,
): Promise<void> {
  const db = await getDb();
  const fields = Object.keys(input);
  if (fields.length === 0) return;
  const assignments = fields.map((field) => `${field} = ?`).join(', ');
  const values = fields.map((field) => (input as Record<string, unknown>)[field]);
  await db.runAsync(`UPDATE budgets SET ${assignments} WHERE id = ?`, ...values, id);
}

export async function archiveBudget(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE budgets SET archived_at = ? WHERE id = ?', Date.now(), id);
}
