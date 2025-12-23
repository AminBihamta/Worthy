import { getDb } from '../index';
import { createId } from '../../utils/id';

export type AccountType = 'cash' | 'bank' | 'ewallet' | 'credit';

export interface AccountRow {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  starting_balance_minor: number;
  created_at: number;
  archived_at: number | null;
}

export async function listAccounts(includeArchived = false): Promise<AccountRow[]> {
  const db = await getDb();
  const where = includeArchived ? '' : 'WHERE archived_at IS NULL';
  return db.getAllAsync<AccountRow>(`SELECT * FROM accounts ${where} ORDER BY created_at DESC`);
}

export async function getAccount(id: string): Promise<AccountRow | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<AccountRow>('SELECT * FROM accounts WHERE id = ?', id);
  return row ?? null;
}

export async function createAccount(input: {
  name: string;
  type: AccountType;
  currency: string;
  starting_balance_minor: number;
}): Promise<string> {
  const db = await getDb();
  const id = createId('acct_');
  await db.runAsync(
    'INSERT INTO accounts (id, name, type, currency, starting_balance_minor, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    id,
    input.name,
    input.type,
    input.currency,
    input.starting_balance_minor,
    Date.now(),
  );
  return id;
}

export async function updateAccount(
  id: string,
  input: Partial<Omit<AccountRow, 'id' | 'created_at'>>,
): Promise<void> {
  const db = await getDb();
  const fields = Object.keys(input);
  if (fields.length === 0) return;
  const assignments = fields.map((field) => `${field} = ?`).join(', ');
  const values = fields.map((field) => (input as Record<string, unknown>)[field]);
  await db.runAsync(`UPDATE accounts SET ${assignments} WHERE id = ?`, ...values, id);
}

export async function archiveAccount(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE accounts SET archived_at = ? WHERE id = ?', Date.now(), id);
}
