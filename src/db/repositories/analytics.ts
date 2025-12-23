import { getDb } from '../index';

export async function getExpenseSeries(input: {
  start: number;
  end: number;
  granularity: 'day' | 'month';
}) {
  const db = await getDb();
  const fmt = input.granularity === 'month' ? '%Y-%m' : '%Y-%m-%d';
  return db.getAllAsync<{ bucket: string; total_minor: number }>(
    `SELECT strftime('${fmt}', date_ts / 1000, 'unixepoch') as bucket, SUM(amount_minor) as total_minor
     FROM expenses
     WHERE date_ts BETWEEN ? AND ?
     GROUP BY bucket
     ORDER BY bucket ASC`,
    input.start,
    input.end,
  );
}

export async function getIncomeSeries(input: {
  start: number;
  end: number;
  granularity: 'day' | 'month';
}) {
  const db = await getDb();
  const fmt = input.granularity === 'month' ? '%Y-%m' : '%Y-%m-%d';
  return db.getAllAsync<{ bucket: string; total_minor: number }>(
    `SELECT strftime('${fmt}', date_ts / 1000, 'unixepoch') as bucket, SUM(amount_minor) as total_minor
     FROM incomes
     WHERE date_ts BETWEEN ? AND ?
     GROUP BY bucket
     ORDER BY bucket ASC`,
    input.start,
    input.end,
  );
}

export async function getSpendingByCategory(start: number, end: number) {
  const db = await getDb();
  return db.getAllAsync<{
    category_id: string;
    category_name: string;
    category_color: string;
    total_minor: number;
  }>(
    `SELECT e.category_id, c.name as category_name, c.color as category_color, SUM(e.amount_minor) as total_minor
     FROM expenses e
     JOIN categories c ON c.id = e.category_id
     WHERE e.date_ts BETWEEN ? AND ?
     GROUP BY e.category_id
     ORDER BY total_minor DESC`,
    start,
    end,
  );
}

export async function getRegretByCategory(start: number, end: number) {
  const db = await getDb();
  return db.getAllAsync<{
    category_id: string;
    category_name: string;
    avg_regret: number;
    total_spent: number;
  }>(
    `SELECT e.category_id, c.name as category_name, AVG(e.slider_0_100) as avg_regret, SUM(e.amount_minor) as total_spent
     FROM expenses e
     JOIN categories c ON c.id = e.category_id
     WHERE e.date_ts BETWEEN ? AND ?
     GROUP BY e.category_id
     ORDER BY avg_regret ASC`,
    start,
    end,
  );
}

export async function getMostRegretfulExpenses(start: number, end: number, limit = 5) {
  const db = await getDb();
  return db.getAllAsync<{ title: string; avg_regret: number; total_spent: number }>(
    `SELECT e.title as title, AVG(e.slider_0_100) as avg_regret, SUM(e.amount_minor) as total_spent
     FROM expenses e
     WHERE e.date_ts BETWEEN ? AND ?
     GROUP BY e.title
     ORDER BY avg_regret ASC
     LIMIT ${limit}`,
    start,
    end,
  );
}

export async function getLifeCostByCategory(start: number, end: number) {
  const db = await getDb();
  return db.getAllAsync<{ category_id: string; category_name: string; total_minor: number }>(
    `SELECT e.category_id, c.name as category_name, SUM(e.amount_minor) as total_minor
     FROM expenses e
     JOIN categories c ON c.id = e.category_id
     WHERE e.date_ts BETWEEN ? AND ?
     GROUP BY e.category_id
     ORDER BY total_minor DESC`,
    start,
    end,
  );
}

export async function getEffectiveHourlyRate(): Promise<{
  hourly_rate_minor: number | null;
  total_hours: number;
  total_income_minor: number;
}> {
  const db = await getDb();
  const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const row = await db.getFirstAsync<{ total_minor: number; total_hours: number }>(
    `SELECT SUM(amount_minor) as total_minor, SUM(hours_worked) as total_hours
     FROM incomes
     WHERE date_ts >= ? AND hours_worked IS NOT NULL AND hours_worked > 0`,
    since,
  );
  const totalIncome = row?.total_minor ?? 0;
  const totalHours = row?.total_hours ?? 0;
  if (!totalHours) {
    return { hourly_rate_minor: null, total_hours: totalHours, total_income_minor: totalIncome };
  }
  return {
    hourly_rate_minor: Math.round(totalIncome / totalHours),
    total_hours: totalHours,
    total_income_minor: totalIncome,
  };
}
