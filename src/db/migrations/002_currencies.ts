const sql = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS currencies (
  code TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  symbol TEXT,
  rate_to_base REAL NOT NULL,
  created_at INTEGER NOT NULL,
  archived_at INTEGER
);

ALTER TABLE expenses ADD COLUMN currency_code TEXT;
ALTER TABLE incomes ADD COLUMN currency_code TEXT;

UPDATE expenses
SET currency_code = (
  SELECT currency FROM accounts WHERE accounts.id = expenses.account_id
)
WHERE currency_code IS NULL;

UPDATE incomes
SET currency_code = (
  SELECT currency FROM accounts WHERE accounts.id = incomes.account_id
)
WHERE currency_code IS NULL;

CREATE INDEX IF NOT EXISTS idx_currencies_code ON currencies (code);
`;

export const migration002 = {
  version: 2,
  sql,
};
