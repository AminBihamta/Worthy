import { getDb } from '../index';
import { createId } from '../../utils/id';

export interface TransferRow {
  id: string;
  from_account_id: string;
  to_account_id: string;
  amount_minor: number;
  date_ts: number;
  notes: string | null;
  created_at: number;
}

export interface TransferListRow extends TransferRow {
  from_account_name: string;
  to_account_name: string;
  currency: string;
}

export async function listTransfers(filters?: {
  start?: number;
  end?: number;
  limit?: number;
}): Promise<TransferListRow[]> {
  const db = await getDb();
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (filters?.start) {
    conditions.push('t.date_ts >= ?');
    params.push(filters.start);
  }
  if (filters?.end) {
    conditions.push('t.date_ts <= ?');
    params.push(filters.end);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = filters?.limit ? `LIMIT ${filters.limit}` : '';

  return db.getAllAsync<TransferListRow>(
    `SELECT t.*, af.name as from_account_name, at.name as to_account_name, af.currency as currency
     FROM transfers t
     JOIN accounts af ON af.id = t.from_account_id
     JOIN accounts at ON at.id = t.to_account_id
     ${where}
     ORDER BY t.date_ts DESC
     ${limit}`,
    ...params,
  );
}

export async function createTransfer(input: {
  from_account_id: string;
  to_account_id: string;
  amount_minor: number;
  date_ts: number;
  notes?: string | null;
}): Promise<string> {
  const db = await getDb();
  const id = createId('trf_');
  await db.runAsync(
    `INSERT INTO transfers (id, from_account_id, to_account_id, amount_minor, date_ts, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id,
    input.from_account_id,
    input.to_account_id,
    input.amount_minor,
    input.date_ts,
    input.notes ?? null,
    Date.now(),
  );
  return id;
}

export async function deleteTransfer(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM transfers WHERE id = ?', id);
}
