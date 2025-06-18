import { drizzle } from 'drizzle-orm/better-sqlite3';
import BetterSqlite3 from 'better-sqlite3';
import * as schema from "@shared/schema";

// For development, use SQLite
const sqlite = new BetterSqlite3('./dev.db');
export const db = drizzle(sqlite, { schema });

// Create tables if they don't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS receipts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    merchant_name TEXT,
    amount REAL,
    date TEXT,
    items TEXT,
    trust_score REAL,
    fraud_flags TEXT,
    confidence REAL,
    trust_factors TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    rating INTEGER NOT NULL,
    content TEXT NOT NULL,
    sentiment TEXT,
    ai_reply TEXT,
    has_replied INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    party_size INTEGER NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed',
    special_requests TEXT,
    is_vip INTEGER DEFAULT 0,
    no_show_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS response_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    template TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// Add trust_factors column if it doesn't exist (migration)
try {
  sqlite.exec(`ALTER TABLE receipts ADD COLUMN trust_factors TEXT;`);
} catch (error) {
  // Column already exists, ignore error
  console.log("trust_factors column already exists or migration not needed");
}