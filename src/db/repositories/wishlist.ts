import { getDb } from '../index';
import { createId } from '../../utils/id';

export interface WishlistItemRow {
  id: string;
  category_id: string;
  title: string;
  target_price_minor: number | null;
  link: string | null;
  priority: number | null;
  created_at: number;
  archived_at: number | null;
}

export interface WishlistItemListRow extends WishlistItemRow {
  category_name: string;
  category_color: string;
  category_icon: string;
  saved_minor: number;
}

export async function listWishlistItems(): Promise<WishlistItemListRow[]> {
  const db = await getDb();
  return db.getAllAsync<WishlistItemListRow>(
    `SELECT w.*, c.name as category_name, c.color as category_color, c.icon as category_icon,
      COALESCE(SUM(sc.amount_minor), 0) as saved_minor
     FROM wishlist_items w
     JOIN categories c ON c.id = w.category_id
     LEFT JOIN savings_buckets b ON b.category_id = w.category_id AND b.archived_at IS NULL
     LEFT JOIN savings_contributions sc ON sc.bucket_id = b.id
     WHERE w.archived_at IS NULL
     GROUP BY w.id
     ORDER BY w.created_at DESC`,
  );
}

export async function createWishlistItem(input: {
  category_id: string;
  title: string;
  target_price_minor?: number | null;
  link?: string | null;
  priority?: number | null;
}): Promise<string> {
  const db = await getDb();
  const id = createId('wish_');
  await db.runAsync(
    `INSERT INTO wishlist_items (id, category_id, title, target_price_minor, link, priority, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.category_id,
    input.title,
    input.target_price_minor ?? null,
    input.link ?? null,
    input.priority ?? null,
    Date.now(),
  );
  return id;
}

export async function updateWishlistItem(
  id: string,
  input: Partial<Omit<WishlistItemRow, 'id' | 'created_at'>>,
): Promise<void> {
  const db = await getDb();
  const fields = Object.keys(input);
  if (fields.length === 0) return;
  const assignments = fields.map((field) => `${field} = ?`).join(', ');
  const values = fields.map((field) => (input as Record<string, unknown>)[field]);
  await db.runAsync(`UPDATE wishlist_items SET ${assignments} WHERE id = ?`, ...values, id);
}

export async function archiveWishlistItem(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE wishlist_items SET archived_at = ? WHERE id = ?', Date.now(), id);
}
