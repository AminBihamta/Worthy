import { getDb } from '../index';
import { createId } from '../../utils/id';

export interface CategoryRow {
  id: string;
  name: string;
  icon: string;
  color: string;
  sort_order: number;
  created_at: number;
  archived_at: number | null;
}

export async function listCategories(includeArchived = false): Promise<CategoryRow[]> {
  const db = await getDb();
  const where = includeArchived ? '' : 'WHERE archived_at IS NULL';
  return db.getAllAsync<CategoryRow>(
    `SELECT * FROM categories ${where} ORDER BY sort_order ASC, created_at ASC`,
  );
}

export async function createCategory(input: {
  name: string;
  icon: string;
  color: string;
  sort_order?: number;
}): Promise<string> {
  const db = await getDb();
  const id = createId('cat_');
  const maxSort = await db.getFirstAsync<{ max: number }>(
    'SELECT MAX(sort_order) as max FROM categories',
  );
  const sortOrder = input.sort_order ?? (maxSort?.max ? maxSort.max + 1 : 1);
  await db.runAsync(
    'INSERT INTO categories (id, name, icon, color, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    id,
    input.name,
    input.icon,
    input.color,
    sortOrder,
    Date.now(),
  );
  return id;
}

export async function updateCategory(
  id: string,
  input: Partial<Omit<CategoryRow, 'id' | 'created_at'>>,
): Promise<void> {
  const db = await getDb();
  const fields = Object.keys(input);
  if (fields.length === 0) return;
  const assignments = fields.map((field) => `${field} = ?`).join(', ');
  const values = fields.map((field) => (input as Record<string, unknown>)[field]);
  await db.runAsync(`UPDATE categories SET ${assignments} WHERE id = ?`, ...values, id);
}

export async function reorderCategories(
  order: { id: string; sort_order: number }[],
): Promise<void> {
  const db = await getDb();
  await db.execAsync('BEGIN;');
  try {
    for (const item of order) {
      await db.runAsync(
        'UPDATE categories SET sort_order = ? WHERE id = ?',
        item.sort_order,
        item.id,
      );
    }
    await db.execAsync('COMMIT;');
  } catch (error) {
    await db.execAsync('ROLLBACK;');
    throw error;
  }
}

export async function archiveCategory(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE categories SET archived_at = ? WHERE id = ?', Date.now(), id);
}
