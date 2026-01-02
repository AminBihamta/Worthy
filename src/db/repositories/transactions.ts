import { getDb } from '../index';

export type TransactionType = 'expense' | 'income' | 'transfer';

export interface TransactionRow {
  id: string;
  type: TransactionType;
  title: string;
  amount_minor: number;
  date_ts: number;
  category_name: string | null;
  category_color: string | null;
  category_icon: string | null;
  account_name: string | null;
  account_currency: string | null;
  slider_0_100: number | null;
  notes: string | null;
  from_account_name: string | null;
  to_account_name: string | null;
}

export async function listTransactions(filters?: {
  start?: number;
  end?: number;
  limit?: number;
}): Promise<TransactionRow[]> {
  const db = await getDb();
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (filters?.start) {
    conditions.push('date_ts >= ?');
    params.push(filters.start);
  }
  if (filters?.end) {
    conditions.push('date_ts <= ?');
    params.push(filters.end);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = filters?.limit ? `LIMIT ${filters.limit}` : '';

  return db.getAllAsync<TransactionRow>(
    `SELECT * FROM (
      SELECT e.id as id, 'expense' as type, e.title as title, e.amount_minor as amount_minor, e.date_ts as date_ts,
        c.name as category_name, c.color as category_color, c.icon as category_icon,
        a.name as account_name, COALESCE(e.currency_code, a.currency) as account_currency, e.slider_0_100 as slider_0_100, e.notes as notes,
        NULL as from_account_name, NULL as to_account_name
      FROM expenses e
      JOIN categories c ON c.id = e.category_id
      JOIN accounts a ON a.id = e.account_id
      UNION ALL
      SELECT i.id as id, 'income' as type, i.source as title, i.amount_minor as amount_minor, i.date_ts as date_ts,
        NULL as category_name, NULL as category_color, NULL as category_icon,
        a.name as account_name, COALESCE(i.currency_code, a.currency) as account_currency, NULL as slider_0_100, i.notes as notes,
        NULL as from_account_name, NULL as to_account_name
      FROM incomes i
      JOIN accounts a ON a.id = i.account_id
      UNION ALL
      SELECT t.id as id, 'transfer' as type, 'Transfer' as title, t.amount_minor as amount_minor, t.date_ts as date_ts,
        NULL as category_name, NULL as category_color, NULL as category_icon,
        af.name as account_name, af.currency as account_currency, NULL as slider_0_100, t.notes as notes,
        af.name as from_account_name, at.name as to_account_name
      FROM transfers t
      JOIN accounts af ON af.id = t.from_account_id
      JOIN accounts at ON at.id = t.to_account_id
    )
    ${where}
    ORDER BY date_ts DESC
    ${limit}`,
    ...params,
  );
}

export async function getFirstTransactionDate(): Promise<number | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ min_date: number | null }>(
    `SELECT MIN(date_ts) as min_date FROM (
      SELECT date_ts FROM expenses
      UNION ALL
      SELECT date_ts FROM incomes
      UNION ALL
      SELECT date_ts FROM transfers
    )`,
  );
  return row?.min_date ?? null;
}
