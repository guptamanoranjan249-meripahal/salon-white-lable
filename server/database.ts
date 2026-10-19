import { chmodSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import BetterSqlite3 from 'better-sqlite3';

if (process.platform !== 'win32') process.umask(0o077);

export type SalonDatabase = InstanceType<typeof BetterSqlite3>;

export function createDatabase(databasePath = process.env.DATABASE_PATH || path.resolve('data/salon-builder.sqlite')): SalonDatabase {
  if (databasePath !== ':memory:') {
    mkdirSync(path.dirname(databasePath), { recursive: true, mode: 0o700 });
  }

  const database = new BetterSqlite3(databasePath);
  if (databasePath !== ':memory:' && process.platform !== 'win32') chmodSync(databasePath, 0o600);
  database.pragma('foreign_keys = ON');
  database.pragma('busy_timeout = 5000');
  if (databasePath !== ':memory:') database.pragma('journal_mode = WAL');
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE COLLATE NOCASE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS salons (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      slug TEXT NOT NULL UNIQUE COLLATE NOCASE,
      published_slug TEXT UNIQUE COLLATE NOCASE,
      config_json TEXT NOT NULL,
      published_config_json TEXT,
      is_published INTEGER NOT NULL DEFAULT 0 CHECK (is_published IN (0, 1)),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_salons_public_slug ON salons(published_slug, is_published);
    CREATE INDEX IF NOT EXISTS idx_salons_owner ON salons(owner_id);

    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      salon_id TEXT NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
      service_id TEXT NOT NULL,
      service_name TEXT NOT NULL,
      price REAL NOT NULL CHECK (price >= 0),
      appointment_date TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Completed', 'Rejected')),
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_bookings_salon_date ON bookings(salon_id, appointment_date DESC);
  `);

  return database;
}

export const database = createDatabase();
