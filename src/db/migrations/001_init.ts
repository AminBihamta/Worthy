const sql = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  currency TEXT NOT NULL,
  starting_balance_minor INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  archived_at INTEGER
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  archived_at INTEGER
);

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  amount_minor INTEGER NOT NULL,
  category_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  date_ts INTEGER NOT NULL,
  slider_0_100 INTEGER NOT NULL,
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE RESTRICT,
  FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS incomes (
  id TEXT PRIMARY KEY NOT NULL,
  source TEXT NOT NULL,
  amount_minor INTEGER NOT NULL,
  account_id TEXT NOT NULL,
  date_ts INTEGER NOT NULL,
  hours_worked REAL,
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS transfers (
  id TEXT PRIMARY KEY NOT NULL,
  from_account_id TEXT NOT NULL,
  to_account_id TEXT NOT NULL,
  amount_minor INTEGER NOT NULL,
  date_ts INTEGER NOT NULL,
  notes TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (from_account_id) REFERENCES accounts (id) ON DELETE RESTRICT,
  FOREIGN KEY (to_account_id) REFERENCES accounts (id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY NOT NULL,
  category_id TEXT NOT NULL,
  amount_minor INTEGER NOT NULL,
  period_type TEXT NOT NULL,
  start_date_ts INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  archived_at INTEGER,
  FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS savings_buckets (
  id TEXT PRIMARY KEY NOT NULL,
  category_id TEXT NOT NULL,
  name TEXT NOT NULL,
  target_amount_minor INTEGER,
  created_at INTEGER NOT NULL,
  archived_at INTEGER,
  FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS savings_contributions (
  id TEXT PRIMARY KEY NOT NULL,
  bucket_id TEXT NOT NULL,
  amount_minor INTEGER NOT NULL,
  date_ts INTEGER NOT NULL,
  notes TEXT,
  FOREIGN KEY (bucket_id) REFERENCES savings_buckets (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS wishlist_items (
  id TEXT PRIMARY KEY NOT NULL,
  category_id TEXT NOT NULL,
  title TEXT NOT NULL,
  target_price_minor INTEGER,
  link TEXT,
  priority INTEGER,
  created_at INTEGER NOT NULL,
  archived_at INTEGER,
  FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS receipt_inbox (
  id TEXT PRIMARY KEY NOT NULL,
  image_uri TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  status TEXT NOT NULL,
  suggested_title TEXT,
  suggested_amount_minor INTEGER,
  suggested_date_ts INTEGER,
  linked_expense_id TEXT,
  FOREIGN KEY (linked_expense_id) REFERENCES expenses (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS recurring_rules (
  id TEXT PRIMARY KEY NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  rrule_text TEXT NOT NULL,
  next_run_ts INTEGER NOT NULL,
  active INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses (date_ts);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses (category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_account ON expenses (account_id);
CREATE INDEX IF NOT EXISTS idx_incomes_date ON incomes (date_ts);
CREATE INDEX IF NOT EXISTS idx_incomes_account ON incomes (account_id);
CREATE INDEX IF NOT EXISTS idx_receipts_status ON receipt_inbox (status);
CREATE INDEX IF NOT EXISTS idx_wishlist_category ON wishlist_items (category_id);
CREATE INDEX IF NOT EXISTS idx_contrib_bucket ON savings_contributions (bucket_id);
`;

export const migration001 = {
  version: 1,
  sql,
};
