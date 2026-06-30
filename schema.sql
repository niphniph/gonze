-- Database schema for productivity tracker authentication and user data

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_verified INTEGER DEFAULT 0,
  verification_code TEXT,
  verification_code_expires INTEGER,
  reset_token TEXT,
  reset_token_expires INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tracker_data (
  user_id INTEGER PRIMARY KEY,
  tasks TEXT,
  habits TEXT,
  habits_history TEXT,
  weekly TEXT,
  finance TEXT,
  integrations TEXT,
  meetings TEXT,
  calendar_events TEXT,
  financial_accounts TEXT,
  transactions TEXT,
  financial_insights TEXT,
  budgets TEXT,
  savings_goals TEXT,
  profile TEXT,
  updated_at INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
