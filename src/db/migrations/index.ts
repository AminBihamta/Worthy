import { migration001 } from './001_init';
import { migration002 } from './002_currencies';
import { migration003 } from './003_remove_goals';
import { migration004 } from './004_remove_receipts';
import { migration005 } from './005_budget_average';
import type { Migration } from './types';

export const migrations: Migration[] = [
  migration001,
  migration002,
  migration003,
  migration004,
  migration005,
];
