import { getDb } from '../index';
import { createId } from '../../utils/id';

export interface ReceiptInboxRow {
  id: string;
  image_uri: string;
  created_at: number;
  status: string;
  suggested_title: string | null;
  suggested_amount_minor: number | null;
  suggested_date_ts: number | null;
  linked_expense_id: string | null;
}

export async function listReceiptInbox(status?: string): Promise<ReceiptInboxRow[]> {
  const db = await getDb();
  const where = status ? 'WHERE status = ?' : '';
  return db.getAllAsync<ReceiptInboxRow>(
    `SELECT * FROM receipt_inbox ${where} ORDER BY created_at DESC`,
    ...(status ? [status] : []),
  );
}

export async function createReceiptInboxItem(input: {
  image_uri: string;
  suggested_title?: string | null;
  suggested_amount_minor?: number | null;
  suggested_date_ts?: number | null;
}): Promise<string> {
  const db = await getDb();
  const id = createId('rcpt_');
  await db.runAsync(
    `INSERT INTO receipt_inbox (id, image_uri, created_at, status, suggested_title, suggested_amount_minor, suggested_date_ts)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.image_uri,
    Date.now(),
    'pending',
    input.suggested_title ?? null,
    input.suggested_amount_minor ?? null,
    input.suggested_date_ts ?? null,
  );
  return id;
}

export async function updateReceiptInbox(
  id: string,
  input: Partial<Omit<ReceiptInboxRow, 'id' | 'created_at'>>,
): Promise<void> {
  const db = await getDb();
  const fields = Object.keys(input);
  if (fields.length === 0) return;
  const assignments = fields.map((field) => `${field} = ?`).join(', ');
  const values = fields.map((field) => (input as Record<string, unknown>)[field]);
  await db.runAsync(`UPDATE receipt_inbox SET ${assignments} WHERE id = ?`, ...values, id);
}

export async function deleteReceiptInboxItem(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM receipt_inbox WHERE id = ?', id);
}
