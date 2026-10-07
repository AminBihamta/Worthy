import type { Migration } from './types';

const sql = `
ALTER TABLE budgets ADD COLUMN average_period TEXT NOT NULL DEFAULT 'off';
`;

export const migration005: Migration = {
  version: 5,
  sql,
};
