import { getDb } from '../index';

export async function getWrapStats(start: number, end: number) {
  const db = await getDb();

  const [expenseTotal, incomeTotal, topCategory, biggestExpense, topSpendDay, expenseCount, incomeCount] =
    await Promise.all([
      db.getFirstAsync<{ total_minor: number }>(
        `SELECT ROUND(SUM(e.amount_minor * COALESCE(cur.rate_to_base, 1))) as total_minor
         FROM expenses e
         JOIN accounts a ON a.id = e.account_id
         LEFT JOIN currencies cur ON cur.code = COALESCE(e.currency_code, a.currency)
         WHERE e.date_ts BETWEEN ? AND ?`,
        start,
        end,
      ),
      db.getFirstAsync<{ total_minor: number }>(
        `SELECT ROUND(SUM(i.amount_minor * COALESCE(cur.rate_to_base, 1))) as total_minor
         FROM incomes i
         JOIN accounts a ON a.id = i.account_id
         LEFT JOIN currencies cur ON cur.code = COALESCE(i.currency_code, a.currency)
         WHERE i.date_ts BETWEEN ? AND ?`,
        start,
        end,
      ),
      db.getFirstAsync<{
        name: string;
        color: string;
        icon: string;
        total_minor: number;
      }>(
        `SELECT c.name as name, c.color as color, c.icon as icon,
            ROUND(SUM(e.amount_minor * COALESCE(cur.rate_to_base, 1))) as total_minor
         FROM expenses e
         JOIN categories c ON c.id = e.category_id
         JOIN accounts a ON a.id = e.account_id
         LEFT JOIN currencies cur ON cur.code = COALESCE(e.currency_code, a.currency)
         WHERE e.date_ts BETWEEN ? AND ?
         GROUP BY e.category_id
         ORDER BY total_minor DESC
         LIMIT 1`,
        start,
        end,
      ),
      db.getFirstAsync<{
        title: string;
        date_ts: number;
        category_name: string;
        category_color: string;
        category_icon: string;
        amount_minor: number;
      }>(
        `SELECT e.title as title, e.date_ts as date_ts,
            c.name as category_name, c.color as category_color, c.icon as category_icon,
            ROUND(e.amount_minor * COALESCE(cur.rate_to_base, 1)) as amount_minor
         FROM expenses e
         JOIN categories c ON c.id = e.category_id
         JOIN accounts a ON a.id = e.account_id
         LEFT JOIN currencies cur ON cur.code = COALESCE(e.currency_code, a.currency)
         WHERE e.date_ts BETWEEN ? AND ?
         ORDER BY amount_minor DESC
         LIMIT 1`,
        start,
        end,
      ),
      db.getFirstAsync<{ day: string; total_minor: number }>(
        `SELECT strftime('%Y-%m-%d', e.date_ts / 1000, 'unixepoch') as day,
            ROUND(SUM(e.amount_minor * COALESCE(cur.rate_to_base, 1))) as total_minor
         FROM expenses e
         JOIN accounts a ON a.id = e.account_id
         LEFT JOIN currencies cur ON cur.code = COALESCE(e.currency_code, a.currency)
         WHERE e.date_ts BETWEEN ? AND ?
         GROUP BY day
         ORDER BY total_minor DESC
         LIMIT 1`,
        start,
        end,
      ),
      db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count
         FROM expenses e
         WHERE e.date_ts BETWEEN ? AND ?`,
        start,
        end,
      ),
      db.getFirstAsync<{ count: number }>(
        `SELECT COUNT(*) as count
         FROM incomes i
         WHERE i.date_ts BETWEEN ? AND ?`,
        start,
        end,
      ),
    ]);

  return {
    totalExpenseMinor: expenseTotal?.total_minor ?? 0,
    totalIncomeMinor: incomeTotal?.total_minor ?? 0,
    topCategory: topCategory ?? null,
    biggestExpense: biggestExpense ?? null,
    topSpendDay: topSpendDay ?? null,
    expenseCount: expenseCount?.count ?? 0,
    incomeCount: incomeCount?.count ?? 0,
  };
}
