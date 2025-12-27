import { createId } from '../utils/id';
import { getDb } from './index';

const defaultCategories = [
  { name: 'Commute', icon: 'map', color: '#4E79A7' },
  { name: 'Entertainment', icon: 'film', color: '#A0CBE8' },
  { name: 'Grocery', icon: 'shopping-cart', color: '#59A14F' },
  { name: 'Take out', icon: 'coffee', color: '#F28E2B' },
  { name: 'Rent', icon: 'home', color: '#E15759' },
  { name: 'Bills', icon: 'file-text', color: '#76B7B2' },
  { name: 'Subscriptions', icon: 'repeat', color: '#EDC949' },
  { name: 'Misc', icon: 'grid', color: '#B07AA1' },
];

export async function seedDefaultData(): Promise<void> {
  const db = await getDb();
  const categoryCount = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM categories',
  );
  if (!categoryCount || categoryCount.count === 0) {
    const now = Date.now();
    for (let i = 0; i < defaultCategories.length; i += 1) {
      const item = defaultCategories[i];
      await db.runAsync(
        'INSERT INTO categories (id, name, icon, color, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        createId('cat_'),
        item.name,
        item.icon,
        item.color,
        i + 1,
        now,
      );
    }
  }

  const accountCount = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM accounts',
  );
  if (!accountCount || accountCount.count === 0) {
    const now = Date.now();
    await db.runAsync(
      'INSERT INTO accounts (id, name, type, currency, starting_balance_minor, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      createId('acct_'),
      'Cash',
      'cash',
      'USD',
      0,
      now,
    );
  }

  const settingsCount = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM settings',
  );
  if (!settingsCount || settingsCount.count === 0) {
    await db.runAsync('INSERT INTO settings (key, value) VALUES (?, ?)', 'theme_mode', 'system');
    await db.runAsync('INSERT INTO settings (key, value) VALUES (?, ?)', 'hours_per_day', '8');
    await db.runAsync(
      'INSERT INTO settings (key, value) VALUES (?, ?)',
      'fixed_hourly_rate_minor',
      '0',
    );
    await db.runAsync('INSERT INTO settings (key, value) VALUES (?, ?)', 'base_currency', 'USD');
  }

  const currencyCount = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM currencies',
  );
  if (!currencyCount || currencyCount.count === 0) {
    const now = Date.now();
    await db.runAsync(
      'INSERT INTO currencies (code, name, symbol, rate_to_base, created_at) VALUES (?, ?, ?, ?, ?)',
      'USD',
      'US Dollar',
      '$',
      1,
      now,
    );
  }
}
