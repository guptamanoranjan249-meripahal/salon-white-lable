import { chmodSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import BetterSqlite3 from 'better-sqlite3';

if (process.platform !== 'win32') process.umask(0o077);

export type SalonDatabase = InstanceType<typeof BetterSqlite3>;

interface TableColumn {
  name: string;
}

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
      password_hash TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL DEFAULT 'salon_owner' CHECK (role IN ('super_admin', 'salon_owner')),
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
      google_sub TEXT UNIQUE,
      email_verified_at TEXT,
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
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
      approval_status TEXT NOT NULL DEFAULT 'onboarding' CHECK (approval_status IN ('onboarding', 'draft', 'pending_approval', 'approved', 'rejected', 'changes_requested')),
      approval_reason TEXT NOT NULL DEFAULT '',
      submitted_at TEXT,
      reviewed_at TEXT,
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

    CREATE TABLE IF NOT EXISTS salon_reviews (
      id TEXT PRIMARY KEY,
      salon_id TEXT NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
      admin_id TEXT NOT NULL REFERENCES users(id),
      action TEXT NOT NULL CHECK (action IN ('approved', 'rejected', 'changes_requested')),
      reason TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_salon_reviews_salon ON salon_reviews(salon_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      salon_id TEXT NOT NULL UNIQUE REFERENCES salons(id) ON DELETE CASCADE,
      plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'growth', 'premium')),
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('trialing', 'active', 'past_due', 'cancelled', 'suspended')),
      starts_at TEXT NOT NULL,
      renews_at TEXT,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status, plan);

    CREATE TABLE IF NOT EXISTS platform_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS email_verification_tokens (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_email_verification_expiry ON email_verification_tokens(expires_at);

    CREATE TABLE IF NOT EXISTS oauth_states (
      state_hash TEXT PRIMARY KEY,
      nonce TEXT NOT NULL,
      code_verifier TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_oauth_states_expiry ON oauth_states(expires_at);
  `);

  // Upgrade existing local installations without losing owner accounts or salon content.
  const userColumns = new Set((database.pragma('table_info(users)') as TableColumn[]).map(column => column.name));
  if (!userColumns.has('role')) database.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'salon_owner' CHECK (role IN ('super_admin', 'salon_owner'))");
  if (!userColumns.has('status')) database.exec("ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended'))");
  if (!userColumns.has('google_sub')) database.exec('ALTER TABLE users ADD COLUMN google_sub TEXT');
  if (!userColumns.has('email_verified_at')) {
    database.exec('ALTER TABLE users ADD COLUMN email_verified_at TEXT');
    // Existing owner accounts predate verification; preserve their existing access during upgrade.
    database.exec('UPDATE users SET email_verified_at = created_at WHERE email_verified_at IS NULL');
  }
  database.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_sub ON users(google_sub) WHERE google_sub IS NOT NULL');

  const salonColumns = new Set((database.pragma('table_info(salons)') as TableColumn[]).map(column => column.name));
  if (!salonColumns.has('status')) database.exec("ALTER TABLE salons ADD COLUMN status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended'))");
  if (!salonColumns.has('approval_status')) {
    database.exec("ALTER TABLE salons ADD COLUMN approval_status TEXT NOT NULL DEFAULT 'draft' CHECK (approval_status IN ('onboarding', 'draft', 'pending_approval', 'approved', 'rejected', 'changes_requested'))");
    database.exec("UPDATE salons SET approval_status = CASE WHEN is_published = 1 THEN 'approved' ELSE 'draft' END");
  }
  if (!salonColumns.has('approval_reason')) database.exec("ALTER TABLE salons ADD COLUMN approval_reason TEXT NOT NULL DEFAULT ''");
  if (!salonColumns.has('submitted_at')) database.exec('ALTER TABLE salons ADD COLUMN submitted_at TEXT');
  if (!salonColumns.has('reviewed_at')) database.exec('ALTER TABLE salons ADD COLUMN reviewed_at TEXT');
  database.exec('CREATE INDEX IF NOT EXISTS idx_salons_public_status ON salons(published_slug, is_published, status)');
  database.exec('CREATE INDEX IF NOT EXISTS idx_salons_approval ON salons(approval_status, submitted_at)');

  const now = new Date().toISOString();
  database.prepare(`
    INSERT OR IGNORE INTO subscriptions (id, salon_id, plan, status, starts_at, renews_at, updated_at)
    SELECT lower(hex(randomblob(16))), id, 'free', 'active', created_at, NULL, ? FROM salons
  `).run(now);
  const insertSetting = database.prepare('INSERT OR IGNORE INTO platform_settings (key, value, updated_at) VALUES (?, ?, ?)');
  insertSetting.run('platformName', 'Nexora Salon Studio', now);
  insertSetting.run('supportEmail', '', now);
  insertSetting.run('defaultCurrency', 'INR', now);
  insertSetting.run('allowOwnerRegistration', 'true', now);

  return database;
}

export const database = createDatabase();
