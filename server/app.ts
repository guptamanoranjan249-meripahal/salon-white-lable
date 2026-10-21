import { randomBytes, randomUUID, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { chmodSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { hasEmailDeliveryConfig, sendVerificationEmail } from './mailer';
import type { AccountStatus, AdminOverview, AdminPage, AdminReviewRecord, AdminSalonRecord, AdminSubscriptionRecord, AdminUserRecord, ApprovalStatus, PlatformSettings, SalonConfig, SalonOwner, SalonRecord, SubscriptionPlan, SubscriptionStatus, UserRole } from '../src/types';
import { database as defaultDatabase, type SalonDatabase } from './database';
import {
  cleanText,
  defaultSalonConfig,
  isRecord,
  normalizeEmail,
  normalizeSalonConfig,
  normalizeSlug,
  ValidationError,
} from './validation';

const SESSION_COOKIE = 'salon_session';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const PASSWORD_COST = 16_384;
const COOKIE_OPTIONS = 'Path=/; HttpOnly; SameSite=Lax';

interface UserRow {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  role: UserRole;
  status: AccountStatus;
  google_sub: string | null;
  email_verified_at: string | null;
  created_at: string;
}

interface SalonRow {
  id: string;
  owner_id: string;
  slug: string;
  published_slug: string | null;
  config_json: string;
  published_config_json: string | null;
  is_published: number;
  status: 'active' | 'suspended';
  approval_status: ApprovalStatus;
  approval_reason: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

interface AdminSalonRow extends SalonRow {
  owner_name: string;
  owner_email: string;
  owner_status: AccountStatus;
  plan: SubscriptionPlan | null;
  subscription_status: SubscriptionStatus | null;
}

interface AuthContext {
  user: SalonOwner;
  salon: SalonRecord | null;
}

interface OAuthStateRow {
  state_hash: string;
  nonce: string;
  code_verifier: string;
  expires_at: number;
}

interface BookingRow {
  id: string;
  salon_id: string;
  service_id: string;
  service_name: string;
  price: number;
  appointment_date: string;
  time_slot: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  notes: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Rejected';
  created_at: string;
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, 64, { N: PASSWORD_COST, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${PASSWORD_COST}$${salt.toString('hex')}$${derived.toString('hex')}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [scheme, cost, saltHex, hashHex] = stored.split('$');
  if (scheme !== 'scrypt' || !cost || !saltHex || !hashHex) return false;
  try {
    const expected = Buffer.from(hashHex, 'hex');
    const actual = scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length, {
      N: Number(cost), r: 8, p: 1, maxmem: 64 * 1024 * 1024,
    });
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

function cookieValue(request: Request, name: string): string | null {
  const header = request.headers.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() === name) {
      try { return decodeURIComponent(part.slice(separator + 1).trim()); }
      catch { return null; }
    }
  }
  return null;
}

function setSessionCookie(response: Response, token: string): void {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  response.append('Set-Cookie', `${SESSION_COOKIE}=${token}; ${COOKIE_OPTIONS}; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}${secure}`);
}

function clearSessionCookie(response: Response): void {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  response.setHeader('Set-Cookie', `${SESSION_COOKIE}=; ${COOKIE_OPTIONS}; Max-Age=0${secure}`);
}

const GOOGLE_STATE_COOKIE = 'salon_google_state';
const GOOGLE_STATE_TTL_MS = 10 * 60 * 1000;
const GOOGLE_JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));

function setGoogleStateCookie(response: Response, state: string): void {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  response.setHeader('Set-Cookie', `${GOOGLE_STATE_COOKIE}=${encodeURIComponent(state)}; Path=/api/auth/google; HttpOnly; SameSite=Lax; Max-Age=600${secure}`);
}

function clearGoogleStateCookie(response: Response): void {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  response.setHeader('Set-Cookie', `${GOOGLE_STATE_COOKIE}=; Path=/api/auth/google; HttpOnly; SameSite=Lax; Max-Age=0${secure}`);
}

function safeEqual(first: string, second: string): boolean {
  const a = Buffer.from(first);
  const b = Buffer.from(second);
  return a.length === b.length && timingSafeEqual(a, b);
}

function slugFromGoogleName(name: string): string {
  const base = name.toLowerCase().normalize('NFKD').replace(/\p{M}/gu, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 34) || 'my-salon';
  return `${base}-${randomBytes(4).toString('hex')}`;
}

function parseSalonConfig(json: string | null, fallback = ''): SalonConfig {
  const defaults = defaultSalonConfig(fallback);
  if (!json) return defaults;
  try {
    const parsed: unknown = JSON.parse(json);
    if (!isRecord(parsed)) return defaults;
    const brand = isRecord(parsed.brand) ? parsed.brand : {};
    const contact = isRecord(parsed.contact) ? parsed.contact : {};
    const theme = isRecord(parsed.theme) ? parsed.theme : {};
    const template = ['atelier', 'minimal', 'botanical'].includes(String(brand.template)) ? brand.template as SalonConfig['brand']['template'] : 'atelier';
    return {
      brand: { ...defaults.brand, ...brand, template },
      contact: { ...defaults.contact, ...contact },
      theme: { ...defaults.theme, ...theme },
      services: Array.isArray(parsed.services) ? parsed.services as SalonConfig['services'] : [],
      staff: Array.isArray(parsed.staff) ? parsed.staff as SalonConfig['staff'] : [],
    } as SalonConfig;
  } catch {
    return defaults;
  }
}

function ownerSalonFromRow(row: SalonRow): SalonRecord {
  return {
    id: row.id,
    ownerId: row.owner_id,
    slug: row.slug,
    publishedSlug: row.published_slug,
    config: parseSalonConfig(row.config_json),
    publishedConfig: row.published_config_json ? parseSalonConfig(row.published_config_json) : null,
    isPublished: Boolean(row.is_published),
    status: row.status,
    approvalStatus: row.approval_status,
    approvalReason: row.approval_reason,
    submittedAt: row.submitted_at,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function publicSalonFromRow(row: SalonRow): { id: string; slug: string; config: SalonConfig; isPublished: true } {
  return {
    id: row.id,
    slug: row.published_slug || row.slug,
    config: parseSalonConfig(row.published_config_json, parseSalonConfig(row.config_json).brand.name),
    isPublished: true,
  };
}

function ownerFromRow(row: UserRow): SalonOwner {
  return { id: row.id, email: row.email, name: row.name, role: row.role, status: row.status, emailVerified: Boolean(row.email_verified_at) };
}

function adminSalonFromRow(row: AdminSalonRow): AdminSalonRecord {
  const config = parseSalonConfig(row.config_json);
  return {
    id: row.id, ownerId: row.owner_id, ownerName: row.owner_name, ownerEmail: row.owner_email,
    name: config.brand.name, slug: row.slug, publishedSlug: row.published_slug,
    isPublished: Boolean(row.is_published) && row.status === 'active' && row.owner_status === 'active',
    status: row.status, approvalStatus: row.approval_status, approvalReason: row.approval_reason,
    submittedAt: row.submitted_at, reviewedAt: row.reviewed_at,
    serviceCount: config.services.filter(service => service.name.trim()).length,
    staffCount: config.staff.filter(member => member.name.trim()).length,
    plan: row.plan || 'free', subscriptionStatus: row.subscription_status || 'active',
    createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

function getPlatformSettings(database: SalonDatabase): PlatformSettings {
  const rows = database.prepare('SELECT key, value FROM platform_settings').all() as Array<{ key: string; value: string }>;
  const values = Object.fromEntries(rows.map(row => [row.key, row.value]));
  return {
    platformName: values.platformName || 'Nexora Salon Studio',
    supportEmail: values.supportEmail || '',
    defaultCurrency: values.defaultCurrency || 'INR',
    allowOwnerRegistration: values.allowOwnerRegistration !== 'false',
  };
}

function newSalonConfig(database: SalonDatabase, salonName: string): SalonConfig {
  const config = defaultSalonConfig(salonName);
  config.brand.currency = getPlatformSettings(database).defaultCurrency;
  return config;
}

function ownerRegistrationEnabled(database: SalonDatabase): boolean {
  const row = database.prepare("SELECT value FROM platform_settings WHERE key = 'allowOwnerRegistration'").get() as { value: string } | undefined;
  return row?.value !== 'false';
}

function makeVerificationUrl(request: Request, token: string): string {
  const relativeUrl = `/api/auth/verify-email?token=${encodeURIComponent(token)}`;
  if (!hasEmailDeliveryConfig() && process.env.NODE_ENV !== 'production') return relativeUrl;
  const configuredBase = process.env.APP_BASE_URL;
  if (process.env.NODE_ENV === 'production' && !configuredBase) throw new Error('APP_BASE_URL must be configured for production email verification.');
  const base = configuredBase || `${request.protocol}://${request.get('host')}`;
  let parsedBase: URL;
  try { parsedBase = new URL(base); } catch { throw new Error('APP_BASE_URL must be a valid absolute URL.'); }
  if (process.env.NODE_ENV === 'production' && parsedBase.protocol !== 'https:') throw new Error('APP_BASE_URL must use HTTPS in production.');
  return new URL(relativeUrl, parsedBase).toString();
}

function insertFreeSubscription(database: SalonDatabase, salonId: string, now: string): void {
  database.prepare(`INSERT INTO subscriptions (id, salon_id, plan, status, starts_at, renews_at, updated_at)
    VALUES (?, ?, 'free', 'active', ?, NULL, ?)`)
    .run(randomUUID(), salonId, now, now);
}

function sendData(response: Response, data: unknown, status = 200): void {
  response.status(status).json({ data });
}

function sendError(response: Response, status: number, message: string): void {
  response.status(status).json({ error: message });
}

function rateLimit(maxRequests: number, windowMs: number) {
  const visits = new Map<string, { count: number; resetAt: number }>();
  return (request: Request, response: Response, next: NextFunction) => {
    const key = request.ip || request.socket.remoteAddress || 'unknown';
    const now = Date.now();
    if (visits.size > 5000) {
      for (const [address, entry] of visits) {
        if (entry.resetAt <= now) visits.delete(address);
      }
      if (visits.size > 5000) visits.clear();
    }
    const current = visits.get(key);
    if (!current || current.resetAt <= now) {
      visits.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }
    current.count += 1;
    if (current.count > maxRequests) {
      response.setHeader('Retry-After', Math.ceil((current.resetAt - now) / 1000));
      sendError(response, 429, 'Too many requests. Please wait a moment and try again.');
      return;
    }
    next();
  };
}

function cookieOriginCheck(request: Request, response: Response, next: NextFunction): void {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    next();
    return;
  }
  const origin = request.get('origin');
  if (!origin) {
    next();
    return;
  }
  try {
    const originHost = new URL(origin).host.toLowerCase();
    const forwardedHost = process.env.TRUST_PROXY === 'true' ? request.get('x-forwarded-host')?.split(',')[0]?.trim() : undefined;
    const requestHost = (forwardedHost || request.get('host') || '').toLowerCase();
    if (requestHost && originHost !== requestHost) {
      sendError(response, 403, 'This request could not be verified. Reload the page and try again.');
      return;
    }
    next();
  } catch {
    sendError(response, 403, 'This request could not be verified. Reload the page and try again.');
  }
}

function publicSlugFromRequest(request: Request): string | null {
  const querySlug = typeof request.query.slug === 'string' ? request.query.slug.trim().toLowerCase() : '';
  if (querySlug) return querySlug;

  const baseDomain = (process.env.PUBLIC_BASE_DOMAIN || '').trim().toLowerCase().replace(/^\.+|\.+$/g, '');
  if (!baseDomain) return null;
  const forwardedHost = process.env.TRUST_PROXY === 'true' ? request.get('x-forwarded-host')?.split(',')[0]?.trim() : undefined;
  const host = (forwardedHost || request.get('host') || '').split(':')[0].toLowerCase();
  const suffix = `.${baseDomain}`;
  if (!host.endsWith(suffix)) return null;
  const subdomain = host.slice(0, -suffix.length);
  if (!subdomain || subdomain === 'www' || subdomain.includes('.')) return null;
  return subdomain;
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) return false;
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const maximum = today.getTime() + 366 * 24 * 60 * 60 * 1000;
  return parsed.getTime() >= today.getTime() && parsed.getTime() <= maximum;
}

function reviewMissing(config: SalonConfig): string[] {
  const missing: string[] = [];
  if (!config.brand.name.trim()) missing.push('salon name');
  if (!config.brand.heroTitle.trim()) missing.push('homepage heading');
  if (!config.brand.logoUrl) missing.push('salon logo');
  if (!config.brand.heroImageUrl) missing.push('hero image');
  if (!config.contact.phone.trim()) missing.push('phone number');
  if (!config.contact.address.trim()) missing.push('complete address');
  if (!config.contact.locationUrl.trim()) missing.push('map or location link');
  if (!config.contact.email.trim()) missing.push('contact email');
  if (!config.contact.hours.trim()) missing.push('opening hours');
  if (!config.services.some(service => service.name.trim())) missing.push('at least one service and price');
  if (!config.staff.some(member => member.name.trim())) missing.push('at least one team member');
  return missing;
}

function bookingFromRow(row: BookingRow) {
  return {
    id: row.id,
    salonId: row.salon_id,
    serviceId: row.service_id,
    serviceName: row.service_name,
    price: row.price,
    date: row.appointment_date,
    timeSlot: row.time_slot,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
  };
}

export function createApp(database: SalonDatabase = defaultDatabase) {
  const app = express();
  const uploadRoot = path.resolve(process.env.UPLOADS_DIR || 'uploads');
  mkdirSync(uploadRoot, { recursive: true, mode: 0o700 });
  if (process.platform !== 'win32') chmodSync(uploadRoot, 0o700);

  if (process.env.TRUST_PROXY === 'true') app.set('trust proxy', 1);

  app.disable('x-powered-by');
  app.use((_request, response, next) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    // Keep the hosted development preview embeddable; lock down production framing to same-origin.
    if (process.env.NODE_ENV === 'production') response.setHeader('X-Frame-Options', 'SAMEORIGIN');
    response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });
  app.use(express.json({ limit: '8mb' }));
  app.use('/api', (request, response, next) => {
    response.setHeader('Cache-Control', 'no-store');
    cookieOriginCheck(request, response, next);
  });

  const authenticate = (request: Request, response: Response, next: NextFunction) => {
    const token = cookieValue(request, SESSION_COOKIE);
    if (!token || !/^[a-f0-9]{64}$/.test(token)) {
      sendError(response, 401, 'Please sign in to continue.');
      return;
    }
    const session = database.prepare(`
      SELECT users.id, users.email, users.name, users.password_hash, users.role, users.status, users.google_sub, users.email_verified_at, users.created_at
      FROM sessions JOIN users ON users.id = sessions.user_id
      WHERE sessions.token_hash = ? AND sessions.expires_at > ?
    `).get(sha256(token), Date.now()) as unknown as UserRow | undefined;
    if (!session || session.status !== 'active' || !session.email_verified_at) {
      sendError(response, 401, 'Your session has expired, your email is unverified, or your account is suspended.');
      return;
    }
    const salonRow = database.prepare('SELECT * FROM salons WHERE owner_id = ?').get(session.id) as unknown as SalonRow | undefined;
    response.locals.auth = { user: ownerFromRow(session), salon: salonRow ? ownerSalonFromRow(salonRow) : null } satisfies AuthContext;
    next();
  };

  const requireSalonOwner = (_request: Request, response: Response, next: NextFunction) => {
    const auth = response.locals.auth as AuthContext;
    if (auth.user.role !== 'salon_owner') return sendError(response, 403, 'A salon owner account is required for this action.');
    if (!auth.salon) return sendError(response, 404, 'Your salon workspace could not be found.');
    if (auth.salon.status !== 'active') return sendError(response, 403, 'This salon workspace is suspended. Contact platform support.');
    next();
  };

  const requireSuperAdmin = (_request: Request, response: Response, next: NextFunction) => {
    const auth = response.locals.auth as AuthContext;
    if (auth.user.role !== 'super_admin') return sendError(response, 403, 'Super administrator access is required.');
    next();
  };

  const authLimiter = rateLimit(12, 15 * 60 * 1000);
  const bookingLimiter = rateLimit(12, 60 * 1000);

  app.get('/api/health', (_request, response) => sendData(response, { status: 'ok' }));
  app.get('/api/meta', (_request, response) => {
    const settings = getPlatformSettings(database);
    return sendData(response, {
      publicBaseUrl: process.env.PUBLIC_BASE_URL || '',
      publicBaseDomain: process.env.PUBLIC_BASE_DOMAIN || '',
      platformName: settings.platformName,
      supportEmail: settings.supportEmail,
    });
  });

  app.post('/api/auth/register', authLimiter, async (request, response) => {
    if (!ownerRegistrationEnabled(database)) return sendError(response, 403, 'New owner registrations are temporarily closed. Please contact platform support.');
    if (!isRecord(request.body)) return sendError(response, 400, 'Please check the details and try again.');
    if (process.env.NODE_ENV === 'production' && (!hasEmailDeliveryConfig() || !process.env.APP_BASE_URL)) {
      return sendError(response, 503, 'Email verification is not configured yet. Please contact platform support.');
    }
    try {
      const ownerName = cleanText(request.body.name, 'Your name', 80, true);
      const email = normalizeEmail(request.body.email);
      const password = typeof request.body.password === 'string' ? request.body.password : '';
      if (password.length < 8 || Buffer.byteLength(password, 'utf8') > 128) {
        throw new ValidationError('Choose a password between 8 and 128 characters.');
      }
      const salonName = cleanText(request.body.salonName, 'Salon name', 100, true);
      const slug = normalizeSlug(request.body.slug);
      const userId = randomUUID();
      const salonId = randomUUID();
      const createdAt = new Date().toISOString();
      const token = randomBytes(32).toString('hex');
      const verificationUrl = makeVerificationUrl(request, token);
      const config = newSalonConfig(database, salonName);

      database.exec('BEGIN IMMEDIATE');
      try {
        if (database.prepare('SELECT id FROM users WHERE email = ?').get(email)) {
          database.exec('ROLLBACK');
          return sendError(response, 409, 'An account with this email already exists. Sign in instead.');
        }
        if (database.prepare('SELECT id FROM salons WHERE slug = ? OR published_slug = ?').get(slug, slug)) {
          database.exec('ROLLBACK');
          return sendError(response, 409, 'That website address is already in use. Choose another one.');
        }
        database.prepare('INSERT INTO users (id, email, name, password_hash, role, status, email_verified_at, created_at) VALUES (?, ?, ?, ?, \'salon_owner\', \'active\', NULL, ?)')
          .run(userId, email, ownerName, hashPassword(password), createdAt);
        database.prepare(`
          INSERT INTO salons (id, owner_id, slug, config_json, is_published, approval_status, created_at, updated_at)
          VALUES (?, ?, ?, ?, 0, 'onboarding', ?, ?)
        `).run(salonId, userId, slug, JSON.stringify(config), createdAt, createdAt);
        insertFreeSubscription(database, salonId, createdAt);
        database.prepare('INSERT INTO email_verification_tokens (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
          .run(sha256(token), userId, Date.now() + 24 * 60 * 60 * 1000, createdAt);
        database.exec('COMMIT');
      } catch (error) {
        try { database.exec('ROLLBACK'); } catch { /* transaction was already closed */ }
        throw error;
      }

      if (hasEmailDeliveryConfig()) {
        try { await sendVerificationEmail(email, ownerName, verificationUrl); }
        catch (error) {
          console.error('Verification email could not be sent:', error);
          return sendError(response, 503, 'Your account is saved, but the verification email could not be sent. Use Resend verification from sign in.');
        }
      }
      return sendData(response, {
        verificationRequired: true,
        ...(process.env.NODE_ENV === 'production' ? {} : { verificationUrl }),
      }, 202);
    } catch (error) {
      if (error instanceof ValidationError) return sendError(response, 400, error.message);
      if (error instanceof Error && error.message.includes('APP_BASE_URL')) return sendError(response, 503, 'Set a valid HTTPS APP_BASE_URL before enabling account verification.');
      if (String(error).includes('UNIQUE constraint failed')) return sendError(response, 409, 'That email or website address is already in use.');
      console.error('Registration failed:', error);
      return sendError(response, 500, 'We could not create your account just now. Please try again.');
    }
  });

  app.get('/api/auth/verify-email', (request, response) => {
    const token = typeof request.query.token === 'string' ? request.query.token : '';
    if (!/^[a-f0-9]{64}$/.test(token)) return response.redirect(303, '/login?authError=verification-link');
    const tokenHash = sha256(token);
    database.exec('BEGIN IMMEDIATE');
    let user: UserRow | undefined;
    try {
      const row = database.prepare(`SELECT users.* FROM email_verification_tokens
        JOIN users ON users.id = email_verification_tokens.user_id
        WHERE email_verification_tokens.token_hash = ? AND email_verification_tokens.expires_at > ?`)
        .get(tokenHash, Date.now()) as unknown as UserRow | undefined;
      if (!row || row.status !== 'active') {
        database.prepare('DELETE FROM email_verification_tokens WHERE token_hash = ?').run(tokenHash);
        database.exec('COMMIT');
        return response.redirect(303, '/login?authError=verification-link');
      }
      const now = new Date().toISOString();
      const result = database.prepare('UPDATE users SET email_verified_at = COALESCE(email_verified_at, ?) WHERE id = ? AND status = \'active\'')
        .run(now, row.id);
      database.prepare('DELETE FROM email_verification_tokens WHERE user_id = ?').run(row.id);
      if (Number(result.changes) === 0) {
        database.exec('COMMIT');
        return response.redirect(303, '/login?authError=account-suspended');
      }
      database.exec('COMMIT');
      user = database.prepare('SELECT * FROM users WHERE id = ?').get(row.id) as unknown as UserRow | undefined;
    } catch (error) {
      try { database.exec('ROLLBACK'); } catch { /* transaction already closed */ }
      console.error('Email verification failed:', error);
      return response.redirect(303, '/login?authError=verification-link');
    }
    if (!user) return response.redirect(303, '/login?authError=verification-link');
    const sessionToken = randomBytes(32).toString('hex');
    const createdAt = new Date().toISOString();
    database.prepare('INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
      .run(sha256(sessionToken), user.id, Date.now() + SESSION_TTL_MS, createdAt);
    setSessionCookie(response, sessionToken);
    return response.redirect(303, user.role === 'super_admin' ? '/admin?verified=1' : '/dashboard?verified=1');
  });

  app.post('/api/auth/verification/resend', authLimiter, async (request, response) => {
    if (!isRecord(request.body)) return sendError(response, 400, 'Enter the email address for your account.');
    try {
      const email = normalizeEmail(request.body.email);
      const user = database.prepare('SELECT * FROM users WHERE email = ?').get(email) as unknown as UserRow | undefined;
      if (!user || user.status !== 'active' || user.email_verified_at) return sendData(response, { sent: true });
      if (process.env.NODE_ENV === 'production' && (!hasEmailDeliveryConfig() || !process.env.APP_BASE_URL)) {
        return sendError(response, 503, 'Email verification is not configured yet. Please contact platform support.');
      }
      const token = randomBytes(32).toString('hex');
      const now = new Date().toISOString();
      const verificationUrl = makeVerificationUrl(request, token);
      database.exec('BEGIN IMMEDIATE');
      try {
        database.prepare('DELETE FROM email_verification_tokens WHERE user_id = ?').run(user.id);
        database.prepare('INSERT INTO email_verification_tokens (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
          .run(sha256(token), user.id, Date.now() + 24 * 60 * 60 * 1000, now);
        database.exec('COMMIT');
      } catch (error) {
        try { database.exec('ROLLBACK'); } catch { /* transaction already closed */ }
        throw error;
      }
      if (hasEmailDeliveryConfig()) {
        try { await sendVerificationEmail(email, user.name, verificationUrl); }
        catch (error) {
          console.error('Resent verification email could not be sent:', error);
          return sendError(response, 503, 'The verification email could not be sent. Please try again later.');
        }
      }
      return sendData(response, { sent: true, ...(process.env.NODE_ENV === 'production' ? {} : { verificationUrl }) });
    } catch (error) {
      if (error instanceof ValidationError) return sendError(response, 400, error.message);
      if (error instanceof Error && error.message.includes('APP_BASE_URL')) return sendError(response, 503, 'Set a valid HTTPS APP_BASE_URL before enabling account verification.');
      console.error('Verification resend failed:', error);
      return sendError(response, 500, 'The verification email could not be resent.');
    }
  });

  app.post('/api/auth/login', authLimiter, (request, response) => {
    if (!isRecord(request.body)) return sendError(response, 400, 'Enter your email and password.');
    try {
      const email = normalizeEmail(request.body.email);
      const password = typeof request.body.password === 'string' ? request.body.password : '';
      if (password.length > 128) return sendError(response, 400, 'Email or password is incorrect.');
      const user = database.prepare('SELECT * FROM users WHERE email = ?').get(email) as unknown as UserRow | undefined;
      if (!user || !user.password_hash || !verifyPassword(password, user.password_hash)) return sendError(response, 401, 'Email or password is incorrect.');
      if (user.status !== 'active') return sendError(response, 403, 'This account is suspended. Contact platform support.');
      if (!user.email_verified_at) return sendError(response, 403, 'Please verify your email before signing in. Use Resend verification below.');

      const token = randomBytes(32).toString('hex');
      const createdAt = new Date().toISOString();
      database.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(Date.now());
      database.prepare('INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
        .run(sha256(token), user.id, Date.now() + SESSION_TTL_MS, createdAt);
      setSessionCookie(response, token);
      const salon = database.prepare('SELECT * FROM salons WHERE owner_id = ?').get(user.id) as unknown as SalonRow | undefined;
      return sendData(response, { user: ownerFromRow(user), salon: salon ? ownerSalonFromRow(salon) : null });
    } catch (error) {
      if (error instanceof ValidationError) return sendError(response, 400, error.message);
      console.error('Login failed:', error);
      return sendError(response, 500, 'We could not sign you in just now. Please try again.');
    }
  });

  app.get('/api/auth/google/start', authLimiter, (request, response) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    if (!clientId || !process.env.GOOGLE_CLIENT_SECRET || !redirectUri) {
      return response.redirect(303, '/login?authError=google-unavailable');
    }
    try {
      const callback = new URL(redirectUri);
      if (process.env.NODE_ENV === 'production' && callback.protocol !== 'https:') throw new Error('Google callback must use HTTPS in production.');
      const state = randomBytes(32).toString('base64url');
      const nonce = randomBytes(32).toString('base64url');
      const codeVerifier = randomBytes(48).toString('base64url');
      const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');
      const createdAt = new Date().toISOString();
      database.prepare('DELETE FROM oauth_states WHERE expires_at <= ?').run(Date.now());
      database.prepare('INSERT INTO oauth_states (state_hash, nonce, code_verifier, expires_at, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(sha256(state), nonce, codeVerifier, Date.now() + GOOGLE_STATE_TTL_MS, createdAt);
      setGoogleStateCookie(response, state);
      const authorizationUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authorizationUrl.search = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        state,
        nonce,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        prompt: 'select_account',
      }).toString();
      return response.redirect(302, authorizationUrl.toString());
    } catch (error) {
      console.error('Could not start Google sign-in:', error);
      return response.redirect(303, '/login?authError=google-unavailable');
    }
  });

  app.get('/api/auth/google/callback', authLimiter, async (request, response) => {
    const state = typeof request.query.state === 'string' ? request.query.state : '';
    const stateCookie = cookieValue(request, GOOGLE_STATE_COOKIE) || '';
    clearGoogleStateCookie(response);
    if (request.query.error) return response.redirect(303, '/login?authError=google-cancelled');
    if (!state || !stateCookie || !safeEqual(state, stateCookie)) return response.redirect(303, '/login?authError=google');

    const stateHash = sha256(state);
    const savedState = database.prepare('SELECT * FROM oauth_states WHERE state_hash = ? AND expires_at > ?')
      .get(stateHash, Date.now()) as unknown as OAuthStateRow | undefined;
    database.prepare('DELETE FROM oauth_states WHERE state_hash = ?').run(stateHash);
    const code = typeof request.query.code === 'string' ? request.query.code : '';
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    if (!savedState || !code || !clientId || !clientSecret || !redirectUri) return response.redirect(303, '/login?authError=google');

    try {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
          code_verifier: savedState.code_verifier,
        }),
        signal: AbortSignal.timeout(12_000),
      });
      const tokenBody: unknown = await tokenResponse.json().catch(() => null);
      if (!tokenResponse.ok || !isRecord(tokenBody) || typeof tokenBody.id_token !== 'string') {
        throw new Error('Google did not return a valid identity token.');
      }
      const { payload } = await jwtVerify(tokenBody.id_token, GOOGLE_JWKS, {
        issuer: ['https://accounts.google.com', 'accounts.google.com'],
        audience: clientId,
        clockTolerance: 5,
      });
      if (payload.nonce !== savedState.nonce || payload.email_verified !== true || typeof payload.sub !== 'string') {
        throw new Error('Google identity verification failed.');
      }
      const email = normalizeEmail(payload.email);
      const displayName = cleanText(typeof payload.name === 'string' ? payload.name : email.split('@')[0], 'Name', 80, true);
      let userId = '';
      let user: UserRow | undefined;
      const createdAt = new Date().toISOString();

      database.exec('BEGIN IMMEDIATE');
      try {
        user = database.prepare('SELECT * FROM users WHERE google_sub = ?').get(payload.sub) as unknown as UserRow | undefined;
        if (!user) user = database.prepare('SELECT * FROM users WHERE email = ?').get(email) as unknown as UserRow | undefined;
        if (user) {
          if (user.status !== 'active') throw new Error('This account is suspended. Contact platform support.');
          if (user.google_sub && user.google_sub !== payload.sub) throw new Error('This email is already linked to a different Google account.');
          if (user.email !== email) {
            const duplicateEmail = database.prepare('SELECT id FROM users WHERE email = ? AND id <> ?').get(email, user.id);
            if (duplicateEmail) throw new Error('This Google email is already associated with another account.');
            database.prepare('UPDATE users SET email = ?, name = ?, google_sub = ?, email_verified_at = COALESCE(email_verified_at, ?) WHERE id = ?').run(email, displayName, payload.sub, createdAt, user.id);
          } else {
            database.prepare('UPDATE users SET name = ?, google_sub = ?, email_verified_at = COALESCE(email_verified_at, ?) WHERE id = ?').run(displayName, payload.sub, createdAt, user.id);
          }
          userId = user.id;
        } else {
          if (!ownerRegistrationEnabled(database)) {
            database.exec('ROLLBACK');
            return response.redirect(303, '/login?authError=registration-closed');
          }
          userId = randomUUID();
          const salonId = randomUUID();
          const salonName = `${displayName.slice(0, 88)}'s Studio`;
          const slug = slugFromGoogleName(displayName);
          const config = newSalonConfig(database, salonName);
          database.prepare(`INSERT INTO users (id, email, name, password_hash, role, status, google_sub, email_verified_at, created_at)
            VALUES (?, ?, ?, '', 'salon_owner', 'active', ?, ?, ?)`)
            .run(userId, email, displayName, payload.sub, createdAt, createdAt);
          database.prepare(`INSERT INTO salons (id, owner_id, slug, config_json, is_published, approval_status, created_at, updated_at)
            VALUES (?, ?, ?, ?, 0, 'onboarding', ?, ?)`)
            .run(salonId, userId, slug, JSON.stringify(config), createdAt, createdAt);
          insertFreeSubscription(database, salonId, createdAt);
        }
        database.exec('COMMIT');
      } catch (error) {
        try { database.exec('ROLLBACK'); } catch { /* transaction was already closed */ }
        throw error;
      }

      const authenticatedUser = database.prepare('SELECT * FROM users WHERE id = ?').get(userId) as unknown as UserRow | undefined;
      if (!authenticatedUser || authenticatedUser.status !== 'active') throw new Error('This account is unavailable.');
      const sessionToken = randomBytes(32).toString('hex');
      database.prepare('INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
        .run(sha256(sessionToken), userId, Date.now() + SESSION_TTL_MS, createdAt);
      setSessionCookie(response, sessionToken);
      return response.redirect(303, authenticatedUser.role === 'super_admin' ? '/admin' : '/dashboard');
    } catch (error) {
      console.error('Google sign-in failed:', error);
      return response.redirect(303, '/login?authError=google');
    }
  });

  app.post('/api/auth/logout', (request, response) => {
    const token = cookieValue(request, SESSION_COOKIE);
    if (token && /^[a-f0-9]{64}$/.test(token)) {
      database.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256(token));
    }
    clearSessionCookie(response);
    sendData(response, { signedOut: true });
  });

  app.get('/api/auth/me', authenticate, (_request, response) => {
    const auth = response.locals.auth as AuthContext;
    sendData(response, { user: auth.user, salon: auth.salon });
  });

  app.get('/api/admin/overview', authenticate, requireSuperAdmin, (_request, response) => {
    const userCounts = database.prepare(`SELECT COUNT(*) AS total,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active,
      SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) AS suspended FROM users`).get() as { total: number; active: number; suspended: number };
    const salonCounts = database.prepare(`SELECT COUNT(*) AS total,
      SUM(CASE WHEN is_published = 1 AND status = 'active' THEN 1 ELSE 0 END) AS published,
      SUM(CASE WHEN approval_status = 'pending_approval' THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) AS suspended FROM salons`).get() as { total: number; published: number; pending: number; suspended: number };
    const subscriptionCounts = database.prepare(`SELECT
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active,
      SUM(CASE WHEN status = 'past_due' THEN 1 ELSE 0 END) AS past_due FROM subscriptions`).get() as { active: number; past_due: number };
    const plans = database.prepare('SELECT plan, COUNT(*) AS count FROM subscriptions GROUP BY plan').all() as Array<{ plan: SubscriptionPlan; count: number }>;
    const planCounts: AdminOverview['planCounts'] = { free: 0, starter: 0, growth: 0, premium: 0 };
    for (const item of plans) planCounts[item.plan] = item.count;
    const overview: AdminOverview = {
      totalUsers: userCounts.total || 0,
      activeUsers: userCounts.active || 0,
      suspendedUsers: userCounts.suspended || 0,
      totalSalons: salonCounts.total || 0,
      publishedWebsites: salonCounts.published || 0,
      pendingApprovals: salonCounts.pending || 0,
      suspendedSalons: salonCounts.suspended || 0,
      activeSubscriptions: subscriptionCounts.active || 0,
      pastDueSubscriptions: subscriptionCounts.past_due || 0,
      planCounts,
    };
    return sendData(response, overview);
  });

  app.get('/api/admin/reviews', authenticate, requireSuperAdmin, (request, response) => {
    const query = typeof request.query.q === 'string' ? request.query.q.trim().slice(0, 160) : '';
    const limit = Math.max(1, Math.min(Number(request.query.limit) || 25, 100));
    const offset = Math.max(0, Number(request.query.offset) || 0);
    const pattern = `%${query}%`;
    const count = database.prepare(`SELECT COUNT(*) AS total FROM salons JOIN users ON users.id = salons.owner_id
      WHERE salons.approval_status = 'pending_approval' AND (? = '' OR salons.slug LIKE ? OR users.email LIKE ? OR users.name LIKE ?)`)
      .get(query, pattern, pattern, pattern) as { total: number };
    const rows = database.prepare(`SELECT salons.*, users.name AS owner_name, users.email AS owner_email,
      users.status AS owner_status, subscriptions.plan, subscriptions.status AS subscription_status
      FROM salons JOIN users ON users.id = salons.owner_id LEFT JOIN subscriptions ON subscriptions.salon_id = salons.id
      WHERE salons.approval_status = 'pending_approval' AND (? = '' OR salons.slug LIKE ? OR users.email LIKE ? OR users.name LIKE ?)
      ORDER BY salons.submitted_at ASC LIMIT ? OFFSET ?`)
      .all(query, pattern, pattern, pattern, limit, offset) as AdminSalonRow[];
    const page: AdminPage<AdminSalonRecord> = { items: rows.map(adminSalonFromRow), total: count.total, limit, offset };
    return sendData(response, page);
  });

  app.get('/api/admin/salons/:id/review', authenticate, requireSuperAdmin, (request, response) => {
    const row = database.prepare(`SELECT salons.*, users.name AS owner_name, users.email AS owner_email,
      users.status AS owner_status, subscriptions.plan, subscriptions.status AS subscription_status
      FROM salons JOIN users ON users.id = salons.owner_id LEFT JOIN subscriptions ON subscriptions.salon_id = salons.id
      WHERE salons.id = ?`).get(request.params.id) as AdminSalonRow | undefined;
    if (!row) return sendError(response, 404, 'Salon workspace not found.');
    const history = database.prepare(`SELECT salon_reviews.action, salon_reviews.reason, salon_reviews.created_at, users.name AS reviewer_name
      FROM salon_reviews JOIN users ON users.id = salon_reviews.admin_id WHERE salon_reviews.salon_id = ?
      ORDER BY salon_reviews.created_at DESC LIMIT 20`).all(request.params.id) as Array<{
        action: 'approved' | 'rejected' | 'changes_requested'; reason: string; created_at: string; reviewer_name: string;
      }>;
    const result: AdminReviewRecord = {
      salon: adminSalonFromRow(row),
      config: parseSalonConfig(row.config_json),
      history: history.map(item => ({ action: item.action, reason: item.reason, reviewerName: item.reviewer_name, createdAt: item.created_at })),
    };
    return sendData(response, result);
  });

  app.post('/api/admin/salons/:id/review', authenticate, requireSuperAdmin, (request, response) => {
    if (!isRecord(request.body)) return sendError(response, 400, 'Choose an approval action and include a reason if needed.');
    const action = request.body.action;
    if (!['approved', 'rejected', 'changes_requested'].includes(String(action))) return sendError(response, 400, 'Choose approve, reject, or request changes.');
    let reason = '';
    try {
      reason = cleanText(request.body.reason, 'Review note', 1200);
      if (action !== 'approved' && reason.length < 8) throw new ValidationError('Add a clear reason of at least 8 characters.');
    } catch (error) {
      if (error instanceof ValidationError) return sendError(response, 400, error.message);
      throw error;
    }
    const auth = response.locals.auth as AuthContext;
    const reviewedAt = new Date().toISOString();
    database.exec('BEGIN IMMEDIATE');
    try {
      const current = database.prepare('SELECT id, approval_status, config_json FROM salons WHERE id = ?').get(request.params.id) as { id: string; approval_status: ApprovalStatus; config_json: string } | undefined;
      if (!current) {
        database.exec('ROLLBACK');
        return sendError(response, 404, 'Salon workspace not found.');
      }
      if (current.approval_status !== 'pending_approval') {
        database.exec('ROLLBACK');
        return sendError(response, 409, 'Only a website waiting for review can be approved or returned.');
      }
      if (action === 'approved') {
        const missing = reviewMissing(parseSalonConfig(current.config_json));
        if (missing.length) {
          database.exec('ROLLBACK');
          return sendError(response, 422, `This website is not ready to approve: ${missing.join(', ')}.`);
        }
      }
      database.prepare('UPDATE salons SET approval_status = ?, approval_reason = ?, reviewed_at = ?, updated_at = ? WHERE id = ?')
        .run(action, reason, reviewedAt, reviewedAt, current.id);
      database.prepare('INSERT INTO salon_reviews (id, salon_id, admin_id, action, reason, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(randomUUID(), current.id, auth.user.id, action, reason, reviewedAt);
      database.exec('COMMIT');
    } catch (error) {
      try { database.exec('ROLLBACK'); } catch { /* transaction already closed */ }
      console.error('Salon review action failed:', error);
      return sendError(response, 500, 'The website review could not be saved.');
    }
    const updated = database.prepare('SELECT * FROM salons WHERE id = ?').get(request.params.id) as unknown as SalonRow;
    return sendData(response, ownerSalonFromRow(updated));
  });

  app.get('/api/admin/users', authenticate, requireSuperAdmin, (request, response) => {
    const query = typeof request.query.q === 'string' ? request.query.q.trim().slice(0, 160) : '';
    const limit = Math.max(1, Math.min(Number(request.query.limit) || 25, 100));
    const offset = Math.max(0, Number(request.query.offset) || 0);
    const pattern = `%${query}%`;
    const count = database.prepare(`SELECT COUNT(*) AS total FROM users
      WHERE (? = '' OR email LIKE ? OR name LIKE ?)`)
      .get(query, pattern, pattern) as { total: number };
    const rows = database.prepare(`SELECT users.id, users.email, users.name, users.role, users.status, users.email_verified_at, users.created_at,
      salons.id AS salon_id, salons.slug, salons.is_published, salons.status AS salon_status, salons.config_json,
      subscriptions.plan AS subscription_plan, subscriptions.status AS subscription_status
      FROM users LEFT JOIN salons ON salons.owner_id = users.id
      LEFT JOIN subscriptions ON subscriptions.salon_id = salons.id
      WHERE (? = '' OR users.email LIKE ? OR users.name LIKE ?)
      ORDER BY users.created_at DESC LIMIT ? OFFSET ?`)
      .all(query, pattern, pattern, limit, offset) as Array<{
        id: string; email: string; name: string; role: UserRole; status: AccountStatus; email_verified_at: string | null; created_at: string;
        salon_id: string | null; slug: string | null; is_published: number | null; salon_status: 'active' | 'suspended' | null;
        config_json: string | null; subscription_plan: SubscriptionPlan | null; subscription_status: SubscriptionStatus | null;
      }>;
    const page: AdminPage<AdminUserRecord> = {
      items: rows.map(row => ({
        id: row.id, email: row.email, name: row.name, role: row.role, status: row.status, emailVerified: Boolean(row.email_verified_at),
        createdAt: row.created_at, salonId: row.salon_id, salonName: row.config_json ? parseSalonConfig(row.config_json).brand.name : null,
        slug: row.slug, isPublished: Boolean(row.is_published), salonStatus: row.salon_status,
        subscriptionPlan: row.subscription_plan, subscriptionStatus: row.subscription_status,
      })),
      total: count.total, limit, offset,
    };
    return sendData(response, page);
  });

  app.patch('/api/admin/users/:id', authenticate, requireSuperAdmin, (request, response) => {
    if (!isRecord(request.body)) return sendError(response, 400, 'Choose a valid account role and status.');
    if (request.body.role !== undefined && !['super_admin', 'salon_owner'].includes(String(request.body.role))) return sendError(response, 400, 'Choose a valid account role.');
    if (request.body.status !== undefined && !['active', 'suspended'].includes(String(request.body.status))) return sendError(response, 400, 'Choose active or suspended for the account.');
    const auth = response.locals.auth as AuthContext;
    database.exec('BEGIN IMMEDIATE');
    let updatedUserId = '';
    try {
      const current = database.prepare('SELECT * FROM users WHERE id = ?').get(request.params.id) as unknown as UserRow | undefined;
      if (!current) {
        database.exec('ROLLBACK');
        return sendError(response, 404, 'User not found.');
      }
      const role: UserRole = request.body.role === undefined ? current.role : request.body.role as UserRole;
      const status: AccountStatus = request.body.status === undefined ? current.status : request.body.status as AccountStatus;
      if (current.id === auth.user.id && (role !== 'super_admin' || status !== 'active')) {
        database.exec('ROLLBACK');
        return sendError(response, 409, 'You cannot remove or suspend your own active administrator access.');
      }
      if (current.role === 'super_admin' && current.status === 'active' && !(role === 'super_admin' && status === 'active')) {
        const count = database.prepare("SELECT COUNT(*) AS total FROM users WHERE role = 'super_admin' AND status = 'active'").get() as { total: number };
        if (count.total <= 1) {
          database.exec('ROLLBACK');
          return sendError(response, 409, 'At least one active super administrator must remain.');
        }
      }
      database.prepare('UPDATE users SET role = ?, status = ? WHERE id = ?').run(role, status, current.id);
      if (status === 'suspended') database.prepare('DELETE FROM sessions WHERE user_id = ?').run(current.id);
      updatedUserId = current.id;
      database.exec('COMMIT');
    } catch (error) {
      try { database.exec('ROLLBACK'); } catch { /* transaction already closed */ }
      console.error('Admin user update failed:', error);
      return sendError(response, 500, 'The user account could not be updated.');
    }
    const updated = database.prepare('SELECT id, email, name, role, status, created_at FROM users WHERE id = ?').get(updatedUserId) as {
      id: string; email: string; name: string; role: UserRole; status: AccountStatus; created_at: string;
    };
    return sendData(response, { id: updated.id, email: updated.email, name: updated.name, role: updated.role, status: updated.status, createdAt: updated.created_at });
  });

  app.get('/api/admin/salons', authenticate, requireSuperAdmin, (request, response) => {
    const query = typeof request.query.q === 'string' ? request.query.q.trim().slice(0, 160) : '';
    const limit = Math.max(1, Math.min(Number(request.query.limit) || 25, 100));
    const offset = Math.max(0, Number(request.query.offset) || 0);
    const pattern = `%${query}%`;
    const count = database.prepare(`SELECT COUNT(*) AS total FROM salons JOIN users ON users.id = salons.owner_id
      WHERE (? = '' OR salons.slug LIKE ? OR users.email LIKE ? OR users.name LIKE ?)`)
      .get(query, pattern, pattern, pattern) as { total: number };
    const rows = database.prepare(`SELECT salons.*, users.name AS owner_name, users.email AS owner_email,
      users.status AS owner_status, subscriptions.plan, subscriptions.status AS subscription_status
      FROM salons JOIN users ON users.id = salons.owner_id
      LEFT JOIN subscriptions ON subscriptions.salon_id = salons.id
      WHERE (? = '' OR salons.slug LIKE ? OR users.email LIKE ? OR users.name LIKE ?)
      ORDER BY salons.created_at DESC LIMIT ? OFFSET ?`)
      .all(query, pattern, pattern, pattern, limit, offset) as Array<SalonRow & {
        owner_name: string; owner_email: string; owner_status: AccountStatus;
        plan: SubscriptionPlan | null; subscription_status: SubscriptionStatus | null;
      }>;
    const page: AdminPage<AdminSalonRecord> = {
      items: rows.map(row => {
        const config = parseSalonConfig(row.config_json);
        return {
          id: row.id, ownerId: row.owner_id, ownerName: row.owner_name, ownerEmail: row.owner_email,
          name: config.brand.name, slug: row.slug, publishedSlug: row.published_slug,
          isPublished: Boolean(row.is_published) && row.status === 'active' && row.owner_status === 'active',
          status: row.status, approvalStatus: row.approval_status, approvalReason: row.approval_reason,
          submittedAt: row.submitted_at, reviewedAt: row.reviewed_at,
          serviceCount: config.services.filter(service => service.name.trim()).length,
          staffCount: config.staff.filter(member => member.name.trim()).length,
          plan: row.plan || 'free', subscriptionStatus: row.subscription_status || 'active',
          createdAt: row.created_at, updatedAt: row.updated_at,
        };
      }),
      total: count.total, limit, offset,
    };
    return sendData(response, page);
  });

  app.patch('/api/admin/salons/:id', authenticate, requireSuperAdmin, (request, response) => {
    const status = isRecord(request.body) ? request.body.status : undefined;
    if (status !== 'active' && status !== 'suspended') return sendError(response, 400, 'Choose active or suspended for the salon.');
    const result = database.prepare('UPDATE salons SET status = ?, updated_at = ? WHERE id = ?')
      .run(status, new Date().toISOString(), request.params.id);
    if (Number(result.changes) === 0) return sendError(response, 404, 'Salon not found.');
    const row = database.prepare(`SELECT salons.*, users.name AS owner_name, users.email AS owner_email,
      users.status AS owner_status, subscriptions.plan, subscriptions.status AS subscription_status
      FROM salons JOIN users ON users.id = salons.owner_id
      LEFT JOIN subscriptions ON subscriptions.salon_id = salons.id WHERE salons.id = ?`)
      .get(request.params.id) as SalonRow & { owner_name: string; owner_email: string; owner_status: AccountStatus; plan: SubscriptionPlan | null; subscription_status: SubscriptionStatus | null };
    const config = parseSalonConfig(row.config_json);
    const salon: AdminSalonRecord = {
      id: row.id, ownerId: row.owner_id, ownerName: row.owner_name, ownerEmail: row.owner_email,
      name: config.brand.name, slug: row.slug, publishedSlug: row.published_slug,
      isPublished: Boolean(row.is_published) && row.status === 'active' && row.owner_status === 'active',
      status: row.status, approvalStatus: row.approval_status, approvalReason: row.approval_reason,
      submittedAt: row.submitted_at, reviewedAt: row.reviewed_at,
      serviceCount: config.services.filter(service => service.name.trim()).length,
      staffCount: config.staff.filter(member => member.name.trim()).length,
      plan: row.plan || 'free', subscriptionStatus: row.subscription_status || 'active',
      createdAt: row.created_at, updatedAt: row.updated_at,
    };
    return sendData(response, salon);
  });

  app.post('/api/admin/salons/:id/publish', authenticate, requireSuperAdmin, (request, response) => {
    const current = database.prepare(`SELECT salons.* FROM salons JOIN users ON users.id = salons.owner_id
      WHERE salons.id = ? AND salons.status = 'active' AND users.status = 'active'`).get(request.params.id) as unknown as SalonRow | undefined;
    if (!current) return sendError(response, 404, 'An active salon workspace was not found.');
    const config = parseSalonConfig(current.config_json);
    if (current.approval_status !== 'approved') return sendError(response, 403, 'Only an approved website may be published.');
    const missing = reviewMissing(config);
    if (missing.length) return sendError(response, 422, `Complete these website details before publishing: ${missing.join(', ')}.`);
    const collision = database.prepare('SELECT id FROM salons WHERE id <> ? AND published_slug = ?').get(current.id, current.slug);
    if (collision) return sendError(response, 409, 'This website address is already in use.');
    const now = new Date().toISOString();
    try {
      database.prepare('UPDATE salons SET published_slug = ?, published_config_json = config_json, is_published = 1, updated_at = ? WHERE id = ?')
        .run(current.slug, now, current.id);
      const updated = database.prepare('SELECT * FROM salons WHERE id = ?').get(current.id) as unknown as SalonRow;
      return sendData(response, ownerSalonFromRow(updated));
    } catch (error) {
      if (String(error).includes('UNIQUE constraint failed')) return sendError(response, 409, 'This website address is already in use.');
      console.error('Admin publishing action failed:', error);
      return sendError(response, 500, 'The salon website could not be published.');
    }
  });

  app.post('/api/admin/salons/:id/unpublish', authenticate, requireSuperAdmin, (request, response) => {
    const result = database.prepare('UPDATE salons SET is_published = 0, updated_at = ? WHERE id = ?')
      .run(new Date().toISOString(), request.params.id);
    if (Number(result.changes) === 0) return sendError(response, 404, 'Salon not found.');
    return sendData(response, { unpublished: true });
  });

  app.get('/api/admin/subscriptions', authenticate, requireSuperAdmin, (request, response) => {
    const query = typeof request.query.q === 'string' ? request.query.q.trim().slice(0, 160) : '';
    const limit = Math.max(1, Math.min(Number(request.query.limit) || 25, 100));
    const offset = Math.max(0, Number(request.query.offset) || 0);
    const pattern = `%${query}%`;
    const count = database.prepare(`SELECT COUNT(*) AS total FROM subscriptions
      JOIN salons ON salons.id = subscriptions.salon_id JOIN users ON users.id = salons.owner_id
      WHERE (? = '' OR salons.slug LIKE ? OR users.email LIKE ? OR users.name LIKE ?)`)
      .get(query, pattern, pattern, pattern) as { total: number };
    const rows = database.prepare(`SELECT subscriptions.*, salons.slug, users.name AS owner_name, users.email AS owner_email,
      json_extract(salons.config_json, '$.brand.name') AS salon_name
      FROM subscriptions JOIN salons ON salons.id = subscriptions.salon_id JOIN users ON users.id = salons.owner_id
      WHERE (? = '' OR salons.slug LIKE ? OR users.email LIKE ? OR users.name LIKE ?)
      ORDER BY subscriptions.updated_at DESC LIMIT ? OFFSET ?`)
      .all(query, pattern, pattern, pattern, limit, offset) as Array<{
        id: string; salon_id: string; salon_name: string; slug: string; owner_name: string; owner_email: string;
        plan: SubscriptionPlan; status: SubscriptionStatus; starts_at: string; renews_at: string | null; updated_at: string;
      }>;
    const page: AdminPage<AdminSubscriptionRecord> = {
      items: rows.map(row => ({
        id: row.id, salonId: row.salon_id, salonName: row.salon_name || 'Salon workspace', slug: row.slug,
        ownerName: row.owner_name, ownerEmail: row.owner_email, plan: row.plan, status: row.status,
        startsAt: row.starts_at, renewsAt: row.renews_at, updatedAt: row.updated_at,
      })),
      total: count.total, limit, offset,
    };
    return sendData(response, page);
  });

  app.patch('/api/admin/subscriptions/:id', authenticate, requireSuperAdmin, (request, response) => {
    if (!isRecord(request.body)) return sendError(response, 400, 'Subscription changes are invalid.');
    const plan = request.body.plan;
    const status = request.body.status;
    const renewsValue = request.body.renewsAt;
    if (!['free', 'starter', 'growth', 'premium'].includes(String(plan))) return sendError(response, 400, 'Choose a valid subscription plan.');
    if (!['trialing', 'active', 'past_due', 'cancelled', 'suspended'].includes(String(status))) return sendError(response, 400, 'Choose a valid subscription status.');
    let renewsAt: string | null = null;
    if (renewsValue !== null && renewsValue !== '') {
      if (typeof renewsValue !== 'string' || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(renewsValue) || Number.isNaN(new Date(`${renewsValue}T00:00:00.000Z`).getTime())) {
        return sendError(response, 400, 'Use a valid renewal date or leave it blank.');
      }
      renewsAt = renewsValue;
    }
    const updatedAt = new Date().toISOString();
    const result = database.prepare('UPDATE subscriptions SET plan = ?, status = ?, renews_at = ?, updated_at = ? WHERE id = ?')
      .run(plan, status, renewsAt, updatedAt, request.params.id);
    if (Number(result.changes) === 0) return sendError(response, 404, 'Subscription not found.');
    const row = database.prepare(`SELECT subscriptions.*, salons.slug, users.name AS owner_name, users.email AS owner_email,
      json_extract(salons.config_json, '$.brand.name') AS salon_name
      FROM subscriptions JOIN salons ON salons.id = subscriptions.salon_id JOIN users ON users.id = salons.owner_id
      WHERE subscriptions.id = ?`).get(request.params.id) as {
        id: string; salon_id: string; salon_name: string; slug: string; owner_name: string; owner_email: string;
        plan: SubscriptionPlan; status: SubscriptionStatus; starts_at: string; renews_at: string | null; updated_at: string;
      };
    const updated: AdminSubscriptionRecord = {
      id: row.id, salonId: row.salon_id, salonName: row.salon_name || 'Salon workspace', slug: row.slug,
      ownerName: row.owner_name, ownerEmail: row.owner_email, plan: row.plan, status: row.status,
      startsAt: row.starts_at, renewsAt: row.renews_at, updatedAt: row.updated_at,
    };
    return sendData(response, updated);
  });

  app.get('/api/admin/settings', authenticate, requireSuperAdmin, (_request, response) => sendData(response, getPlatformSettings(database)));

  app.put('/api/admin/settings', authenticate, requireSuperAdmin, (request, response) => {
    if (!isRecord(request.body)) return sendError(response, 400, 'Platform settings are invalid.');
    try {
      const platformName = cleanText(request.body.platformName, 'Platform name', 80, true);
      const supportEmail = typeof request.body.supportEmail === 'string' && request.body.supportEmail.trim()
        ? normalizeEmail(request.body.supportEmail) : '';
      const defaultCurrency = cleanText(request.body.defaultCurrency, 'Default currency', 3, true).toUpperCase();
      if (!/^[A-Z]{3}$/.test(defaultCurrency)) throw new ValidationError('Choose a valid three-letter currency code.');
      new Intl.NumberFormat('en', { style: 'currency', currency: defaultCurrency }).format(0);
      if (typeof request.body.allowOwnerRegistration !== 'boolean') throw new ValidationError('Choose whether new salon owners may register.');
      const values: PlatformSettings = { platformName, supportEmail, defaultCurrency, allowOwnerRegistration: request.body.allowOwnerRegistration };
      const now = new Date().toISOString();
      const update = database.prepare(`INSERT INTO platform_settings (key, value, updated_at) VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`);
      database.exec('BEGIN IMMEDIATE');
      try {
        for (const [key, value] of Object.entries(values)) update.run(key, String(value), now);
        database.exec('COMMIT');
      } catch (error) {
        try { database.exec('ROLLBACK'); } catch { /* transaction already closed */ }
        throw error;
      }
      return sendData(response, values);
    } catch (error) {
      if (error instanceof ValidationError || error instanceof RangeError) return sendError(response, 400, error.message);
      console.error('Platform settings update failed:', error);
      return sendError(response, 500, 'Platform settings could not be updated.');
    }
  });

  app.get('/api/public/resolve', (request, response) => {
    const slug = publicSlugFromRequest(request);
    if (!slug) return sendData(response, null);
    const row = database.prepare(`SELECT salons.* FROM salons JOIN users ON users.id = salons.owner_id
      WHERE salons.published_slug = ? AND salons.is_published = 1 AND salons.status = 'active' AND users.status = 'active'`)
      .get(slug) as unknown as SalonRow | undefined;
    return sendData(response, row ? publicSalonFromRow(row) : null);
  });

  app.get('/api/public/salons/:slug', (request, response) => {
    const slug = request.params.slug.toLowerCase();
    const row = database.prepare(`SELECT salons.* FROM salons JOIN users ON users.id = salons.owner_id
      WHERE salons.published_slug = ? AND salons.is_published = 1 AND salons.status = 'active' AND users.status = 'active'`)
      .get(slug) as unknown as SalonRow | undefined;
    if (!row) return sendError(response, 404, 'This salon website is not available.');
    return sendData(response, publicSalonFromRow(row));
  });

  app.get('/api/salons/:id', authenticate, requireSalonOwner, (request, response) => {
    const auth = response.locals.auth as AuthContext & { salon: SalonRecord };
    if (request.params.id !== auth.salon.id) return sendError(response, 404, 'Salon workspace not found.');
    return sendData(response, auth.salon);
  });

  app.put('/api/salons/:id', authenticate, requireSalonOwner, (request, response) => {
    const auth = response.locals.auth as AuthContext & { salon: SalonRecord };
    if (request.params.id !== auth.salon.id) return sendError(response, 404, 'Salon workspace not found.');
    if (!isRecord(request.body)) return sendError(response, 400, 'Website settings are invalid.');
    try {
      const slug = normalizeSlug(request.body.slug);
      const config = normalizeSalonConfig(request.body.config, auth.user.id, auth.salon.config.brand.name);
      const slugCollision = database.prepare('SELECT id FROM salons WHERE id <> ? AND (slug = ? OR published_slug = ?)')
        .get(auth.salon.id, slug, slug);
      if (slugCollision) return sendError(response, 409, 'That website address is already in use. Choose another one.');
      const contentChanged = slug !== auth.salon.slug || JSON.stringify(config) !== JSON.stringify(auth.salon.config);
      const resetApproval = contentChanged || auth.salon.approvalStatus === 'onboarding';
      const approvalStatus = resetApproval ? 'draft' : auth.salon.approvalStatus;
      const approvalReason = resetApproval ? '' : auth.salon.approvalReason;
      const submittedAt = resetApproval ? null : auth.salon.submittedAt;
      const reviewedAt = resetApproval ? null : auth.salon.reviewedAt;
      const updatedAt = new Date().toISOString();
      database.prepare(`UPDATE salons SET slug = ?, config_json = ?, approval_status = ?, approval_reason = ?,
        submitted_at = ?, reviewed_at = ?, updated_at = ? WHERE id = ? AND owner_id = ?`)
        .run(slug, JSON.stringify(config), approvalStatus, approvalReason, submittedAt, reviewedAt, updatedAt, auth.salon.id, auth.user.id);
      const updated = database.prepare('SELECT * FROM salons WHERE id = ?').get(auth.salon.id) as unknown as SalonRow;
      return sendData(response, ownerSalonFromRow(updated));
    } catch (error) {
      if (error instanceof ValidationError) return sendError(response, 400, error.message);
      if (String(error).includes('UNIQUE constraint failed')) return sendError(response, 409, 'That website address is already in use. Choose another one.');
      console.error('Saving salon settings failed:', error);
      return sendError(response, 500, 'We could not save your changes. Please try again.');
    }
  });

  app.post('/api/salons/:id/submit-approval', authenticate, requireSalonOwner, (request, response) => {
    const auth = response.locals.auth as AuthContext & { salon: SalonRecord };
    if (request.params.id !== auth.salon.id) return sendError(response, 404, 'Salon workspace not found.');
    database.exec('BEGIN IMMEDIATE');
    let submittedSalonId = '';
    try {
      const current = database.prepare('SELECT * FROM salons WHERE id = ? AND owner_id = ? AND status = \'active\'')
        .get(auth.salon.id, auth.user.id) as unknown as SalonRow | undefined;
      if (!current) {
        database.exec('ROLLBACK');
        return sendError(response, 404, 'Salon workspace not found.');
      }
      if (current.approval_status === 'pending_approval') {
        database.exec('ROLLBACK');
        return sendError(response, 409, 'This website is already waiting for Super Admin review.');
      }
      const missing = reviewMissing(parseSalonConfig(current.config_json));
      if (missing.length) {
        database.exec('ROLLBACK');
        return sendError(response, 422, `Complete these onboarding details before review: ${missing.join(', ')}.`);
      }
      const submittedAt = new Date().toISOString();
      database.prepare(`UPDATE salons SET approval_status = 'pending_approval', approval_reason = '', submitted_at = ?, reviewed_at = NULL, updated_at = ?
        WHERE id = ? AND owner_id = ? AND status = 'active'`)
        .run(submittedAt, submittedAt, current.id, auth.user.id);
      submittedSalonId = current.id;
      database.exec('COMMIT');
    } catch (error) {
      try { database.exec('ROLLBACK'); } catch { /* transaction already closed */ }
      console.error('Salon submission failed:', error);
      return sendError(response, 500, 'The website could not be submitted for review.');
    }
    const updated = database.prepare('SELECT * FROM salons WHERE id = ?').get(submittedSalonId) as unknown as SalonRow;
    return sendData(response, ownerSalonFromRow(updated));
  });

  app.post('/api/salons/:id/publish', authenticate, requireSalonOwner, (request, response) => {
    const auth = response.locals.auth as AuthContext & { salon: SalonRecord };
    if (request.params.id !== auth.salon.id) return sendError(response, 404, 'Salon workspace not found.');
    const current = database.prepare('SELECT * FROM salons WHERE id = ? AND owner_id = ? AND status = \'active\'')
      .get(auth.salon.id, auth.user.id) as unknown as SalonRow | undefined;
    if (!current) return sendError(response, 404, 'Salon workspace not found.');
    const config = parseSalonConfig(current.config_json);
    if (current.approval_status !== 'approved') return sendError(response, 403, 'A Super Admin must approve this website before it can go live.');
    const missing = reviewMissing(config);
    if (missing.length) return sendError(response, 422, `Complete these website details before publishing: ${missing.join(', ')}.`);
    const slugCollision = database.prepare('SELECT id FROM salons WHERE id <> ? AND published_slug = ?').get(current.id, current.slug);
    if (slugCollision) return sendError(response, 409, 'That live website address is already in use. Choose a different address.');
    const updatedAt = new Date().toISOString();
    try {
      database.prepare(`
        UPDATE salons
        SET published_slug = ?, published_config_json = config_json, is_published = 1, updated_at = ?
        WHERE id = ? AND owner_id = ?
      `).run(current.slug, updatedAt, current.id, auth.user.id);
      const updated = database.prepare('SELECT * FROM salons WHERE id = ?').get(current.id) as unknown as SalonRow;
      return sendData(response, ownerSalonFromRow(updated));
    } catch (error) {
      if (String(error).includes('UNIQUE constraint failed')) return sendError(response, 409, 'That live website address is already in use. Choose a different address.');
      console.error('Publishing salon failed:', error);
      return sendError(response, 500, 'We could not publish your website. Please try again.');
    }
  });

  app.post('/api/salons/:id/unpublish', authenticate, requireSalonOwner, (request, response) => {
    const auth = response.locals.auth as AuthContext & { salon: SalonRecord };
    if (request.params.id !== auth.salon.id) return sendError(response, 404, 'Salon workspace not found.');
    database.prepare('UPDATE salons SET is_published = 0, updated_at = ? WHERE id = ? AND owner_id = ?')
      .run(new Date().toISOString(), auth.salon.id, auth.user.id);
    const updated = database.prepare('SELECT * FROM salons WHERE id = ?').get(auth.salon.id) as unknown as SalonRow;
    return sendData(response, ownerSalonFromRow(updated));
  });

  app.post('/api/uploads', authenticate, requireSalonOwner, (request, response) => {
    const auth = response.locals.auth as AuthContext & { salon: SalonRecord };
    if (!isRecord(request.body) || typeof request.body.dataUrl !== 'string') return sendError(response, 400, 'Choose a supported image file.');
    const match = request.body.dataUrl.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,([a-zA-Z0-9+/=]+)$/);
    if (!match) return sendError(response, 400, 'Use a JPG, PNG, WEBP, or GIF image.');
    const mime = match[1];
    const buffer = Buffer.from(match[2], 'base64');
    if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) return sendError(response, 413, 'Images must be 5 MB or smaller.');
    const hasValidSignature = mime === 'image/jpeg'
      ? buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff
      : mime === 'image/png'
        ? buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
        : mime === 'image/gif'
          ? buffer.length >= 6 && ['GIF87a', 'GIF89a'].includes(buffer.toString('ascii', 0, 6))
          : buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
    if (!hasValidSignature) return sendError(response, 400, 'The selected file is not a valid image of that type.');
    const extensions: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
    };
    const ownerDirectory = path.join(uploadRoot, auth.user.id);
    mkdirSync(ownerDirectory, { recursive: true, mode: 0o700 });
    if (process.platform !== 'win32') chmodSync(ownerDirectory, 0o700);
    const filename = `${randomUUID()}.${extensions[mime]}`;
    writeFileSync(path.join(ownerDirectory, filename), buffer, { flag: 'wx', mode: 0o600 });
    return sendData(response, { url: `/media/${auth.user.id}/${filename}` }, 201);
  });

  app.get('/media/:ownerId/:fileName', (request, response) => {
    if (!/^[a-f0-9-]{16,64}$/i.test(request.params.ownerId) || !/^[a-f0-9-]{16,64}\.(?:jpg|png|webp|gif)$/i.test(request.params.fileName)) {
      return sendError(response, 404, 'Image not found.');
    }
    const filePath = path.join(uploadRoot, request.params.ownerId, request.params.fileName);
    response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return response.sendFile(filePath, error => {
      if (error && !response.headersSent) sendError(response, 404, 'Image not found.');
    });
  });

  app.get('/api/salons/:id/bookings', authenticate, requireSalonOwner, (request, response) => {
    const auth = response.locals.auth as AuthContext & { salon: SalonRecord };
    if (request.params.id !== auth.salon.id) return sendError(response, 404, 'Salon workspace not found.');
    const rows = database.prepare('SELECT * FROM bookings WHERE salon_id = ? ORDER BY appointment_date DESC, created_at DESC')
      .all(auth.salon.id) as unknown as BookingRow[];
    return sendData(response, rows.map(bookingFromRow));
  });

  app.patch('/api/salons/:id/bookings/:bookingId', authenticate, requireSalonOwner, (request, response) => {
    const auth = response.locals.auth as AuthContext & { salon: SalonRecord };
    if (request.params.id !== auth.salon.id) return sendError(response, 404, 'Salon workspace not found.');
    const status = isRecord(request.body) ? request.body.status : undefined;
    if (typeof status !== 'string' || !['Pending', 'Confirmed', 'Completed', 'Rejected'].includes(status)) return sendError(response, 400, 'Choose a valid booking status.');
    const result = database.prepare('UPDATE bookings SET status = ? WHERE id = ? AND salon_id = ?')
      .run(status, request.params.bookingId, auth.salon.id);
    if (Number(result.changes) === 0) return sendError(response, 404, 'Booking not found.');
    const updated = database.prepare('SELECT * FROM bookings WHERE id = ? AND salon_id = ?')
      .get(request.params.bookingId, auth.salon.id) as unknown as BookingRow;
    return sendData(response, bookingFromRow(updated));
  });

  app.post('/api/public/salons/:slug/bookings', bookingLimiter, (request, response) => {
    const slug = request.params.slug.toLowerCase();
    const salonRow = database.prepare(`SELECT salons.* FROM salons JOIN users ON users.id = salons.owner_id
      WHERE salons.published_slug = ? AND salons.is_published = 1 AND salons.status = 'active' AND users.status = 'active'`)
      .get(slug) as unknown as SalonRow | undefined;
    if (!salonRow) return sendError(response, 404, 'This salon is not accepting online booking requests.');
    if (!isRecord(request.body)) return sendError(response, 400, 'Enter your appointment details.');
    try {
      const config = parseSalonConfig(salonRow.published_config_json);
      const serviceId = cleanText(request.body.serviceId, 'Service', 64, true);
      const service = config.services.find(item => item.id === serviceId && item.name.trim());
      if (!service) return sendError(response, 400, 'That service is no longer available. Please refresh the page.');
      const date = cleanText(request.body.date, 'Appointment date', 10, true);
      if (!validDate(date)) throw new ValidationError('Choose a date within the next 12 months.');
      const timeSlot = cleanText(request.body.timeSlot, 'Appointment time', 40, true);
      const customerName = cleanText(request.body.customerName, 'Your name', 100, true);
      const customerEmail = normalizeEmail(request.body.customerEmail);
      const customerPhone = cleanText(request.body.customerPhone, 'Phone number', 60, true);
      if (customerPhone.replace(/\D/g, '').length < 7) throw new ValidationError('Enter a valid phone number.');
      const notes = cleanText(request.body.notes, 'Appointment note', 800);
      const id = `SAL-${randomBytes(3).toString('hex').toUpperCase()}`;
      const createdAt = new Date().toISOString();
      database.prepare(`
        INSERT INTO bookings (
          id, salon_id, service_id, service_name, price, appointment_date, time_slot,
          customer_name, customer_email, customer_phone, notes, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?)
      `).run(id, salonRow.id, service.id, service.name, service.price, date, timeSlot, customerName, customerEmail, customerPhone, notes, createdAt);
      return sendData(response, { id, status: 'Pending', createdAt }, 201);
    } catch (error) {
      if (error instanceof ValidationError) return sendError(response, 400, error.message);
      console.error('Booking request failed:', error);
      return sendError(response, 500, 'We could not send your booking request. Please try again.');
    }
  });

  app.use('/api', (_request, response) => sendError(response, 404, 'API route not found.'));

  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    if (error && typeof error === 'object' && 'type' in error && error.type === 'entity.too.large') {
      return sendError(response, 413, 'This image or request is too large.');
    }
    if (error instanceof SyntaxError) return sendError(response, 400, 'The request body must be valid JSON.');
    console.error('Unhandled server error:', error);
    return sendError(response, 500, 'Something went wrong. Please try again.');
  });

  return app;
}
