import { getDb } from '../index';
import { createId } from '../../utils/id';

export interface RecurringRuleRow {
  id: string;
  entity_type: 'expense' | 'income';
  entity_id: string;
  rrule_text: string;
  next_run_ts: number;
  active: number;
}

export async function listRecurringRules(): Promise<RecurringRuleRow[]> {
  const db = await getDb();
  return db.getAllAsync<RecurringRuleRow>('SELECT * FROM recurring_rules ORDER BY next_run_ts ASC');
}

export async function createRecurringRule(input: {
  entity_type: 'expense' | 'income';
  entity_id: string;
  rrule_text: string;
  next_run_ts: number;
}): Promise<string> {
  const db = await getDb();
  const id = createId('rr_');
  await db.runAsync(
    'INSERT INTO recurring_rules (id, entity_type, entity_id, rrule_text, next_run_ts, active) VALUES (?, ?, ?, ?, ?, ?)',
    id,
    input.entity_type,
    input.entity_id,
    input.rrule_text,
    input.next_run_ts,
    1,
  );
  return id;
}

export async function updateRecurringRule(id: string, active: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE recurring_rules SET active = ? WHERE id = ?', active ? 1 : 0, id);
}
