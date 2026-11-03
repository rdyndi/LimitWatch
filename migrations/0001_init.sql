-- 1. Cards Table
CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  limit_amount INTEGER NOT NULL,
  color TEXT NOT NULL,
  due_day INTEGER,
  type TEXT NOT NULL DEFAULT 'CREDIT_CARD',
  e_statement_fee INTEGER DEFAULT 0,
  logo_url TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 2. Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  date TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'EXPENSE',
  category TEXT NOT NULL DEFAULT 'Umum',
  is_installment BOOLEAN DEFAULT 0,
  installment_id TEXT,
  owner TEXT NOT NULL DEFAULT 'PERSONAL',
  is_validated BOOLEAN DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);

-- 3. Installments Table
CREATE TABLE IF NOT EXISTS installments (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL,
  transaction_id TEXT,
  name TEXT NOT NULL,
  total_amount INTEGER NOT NULL,
  total_months INTEGER NOT NULL,
  monthly_amount INTEGER NOT NULL,
  months_paid INTEGER DEFAULT 0,
  start_date TEXT NOT NULL,
  owner TEXT NOT NULL DEFAULT 'PERSONAL',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);

-- 4. Savings Table
CREATE TABLE IF NOT EXISTS savings (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  date TEXT NOT NULL,
  note TEXT,
  owner TEXT NOT NULL DEFAULT 'PERSONAL',
  target_month INTEGER,
  target_year INTEGER,
  is_transferred BOOLEAN DEFAULT 0,
  used_by_transaction_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);

-- 5. Piutangs Table
CREATE TABLE IF NOT EXISTS piutangs (
  id TEXT PRIMARY KEY,
  card_id TEXT NOT NULL,
  debtor_name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  date TEXT NOT NULL,
  note TEXT,
  target_month INTEGER,
  target_year INTEGER,
  is_collected BOOLEAN DEFAULT 0,
  collected_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
);

-- 6. Settings Table
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
