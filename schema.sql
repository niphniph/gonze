-- Database schema for productivity tracker
DROP TABLE IF EXISTS tracker_data;
DROP TABLE IF EXISTS verification_codes;
DROP TABLE IF EXISTS users;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  email_verified INTEGER DEFAULT 0,
  reset_token TEXT,
  reset_token_expires INTEGER,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_codes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  token TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tracker_data (
  user_id TEXT PRIMARY KEY,
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
