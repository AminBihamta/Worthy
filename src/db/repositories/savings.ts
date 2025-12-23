import { getDb } from '../index';
import { createId } from '../../utils/id';

export interface SavingsBucketRow {
  id: string;
  category_id: string;
  name: string;
  target_amount_minor: number | null;
  created_at: number;
  archived_at: number | null;
}

export interface SavingsBucketListRow extends SavingsBucketRow {
  category_name: string;
  category_color: string;
  category_icon: string;
  saved_minor: number;
}

export interface SavingsContributionRow {
  id: string;
  bucket_id: string;
  amount_minor: number;
  date_ts: number;
  notes: string | null;
}

export async function listSavingsBuckets(): Promise<SavingsBucketListRow[]> {
  const db = await getDb();
  return db.getAllAsync<SavingsBucketListRow>(
    `SELECT b.*, c.name as category_name, c.color as category_color, c.icon as category_icon,
      COALESCE(SUM(sc.amount_minor), 0) as saved_minor
     FROM savings_buckets b
     JOIN categories c ON c.id = b.category_id
     LEFT JOIN savings_contributions sc ON sc.bucket_id = b.id
     WHERE b.archived_at IS NULL
     GROUP BY b.id
     ORDER BY b.created_at DESC`,
  );
}

export async function createSavingsBucket(input: {
  category_id: string;
  name: string;
  target_amount_minor?: number | null;
}): Promise<string> {
  const db = await getDb();
  const id = createId('sav_');
  await db.runAsync(
    `INSERT INTO savings_buckets (id, category_id, name, target_amount_minor, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    id,
    input.category_id,
    input.name,
    input.target_amount_minor ?? null,
    Date.now(),
  );
  return id;
}

export async function addSavingsContribution(input: {
  bucket_id: string;
  amount_minor: number;
  date_ts: number;
  notes?: string | null;
}): Promise<string> {
  const db = await getDb();
  const id = createId('scon_');
  await db.runAsync(
    `INSERT INTO savings_contributions (id, bucket_id, amount_minor, date_ts, notes)
     VALUES (?, ?, ?, ?, ?)`,
    id,
    input.bucket_id,
    input.amount_minor,
    input.date_ts,
    input.notes ?? null,
  );
  return id;
}

export async function listContributions(bucketId: string): Promise<SavingsContributionRow[]> {
  const db = await getDb();
  return db.getAllAsync<SavingsContributionRow>(
    'SELECT * FROM savings_contributions WHERE bucket_id = ? ORDER BY date_ts DESC',
    bucketId,
  );
}

export async function archiveSavingsBucket(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE savings_buckets SET archived_at = ? WHERE id = ?', Date.now(), id);
}
