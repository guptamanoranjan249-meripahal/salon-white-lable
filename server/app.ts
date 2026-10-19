import { randomBytes, randomUUID, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { chmodSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import type { SalonConfig, SalonOwner, SalonRecord } from '../src/types';
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
  created_at: string;
  updated_at: string;
}

interface AuthContext {
  user: SalonOwner;
  salon: SalonRecord;
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
  response.setHeader('Set-Cookie', `${SESSION_COOKIE}=${token}; ${COOKIE_OPTIONS}; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}${secure}`);
}

function clearSessionCookie(response: Response): void {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  response.setHeader('Set-Cookie', `${SESSION_COOKIE}=; ${COOKIE_OPTIONS}; Max-Age=0${secure}`);
}

function parseSalonConfig(json: string | null, fallback = ''): SalonConfig {
  if (!json) return defaultSalonConfig(fallback);
  try {
    return JSON.parse(json) as SalonConfig;
  } catch {
    return defaultSalonConfig(fallback);
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
  return { id: row.id, email: row.email, name: row.name };
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
    const forwardedHost = request.get('x-forwarded-host')?.split(',')[0]?.trim();
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
  const forwardedHost = request.get('x-forwarded-host')?.split(',')[0]?.trim();
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
      SELECT users.id, users.email, users.name, users.password_hash, users.created_at
      FROM sessions JOIN users ON users.id = sessions.user_id
      WHERE sessions.token_hash = ? AND sessions.expires_at > ?
    `).get(sha256(token), Date.now()) as unknown as UserRow | undefined;
    if (!session) {
      sendError(response, 401, 'Your session has expired. Please sign in again.');
      return;
    }
    const salonRow = database.prepare('SELECT * FROM salons WHERE owner_id = ?').get(session.id) as unknown as SalonRow | undefined;
    if (!salonRow) {
      sendError(response, 404, 'Your salon workspace could not be found.');
      return;
    }
    response.locals.auth = { user: ownerFromRow(session), salon: ownerSalonFromRow(salonRow) } satisfies AuthContext;
    next();
  };

  const authLimiter = rateLimit(12, 15 * 60 * 1000);
  const bookingLimiter = rateLimit(12, 60 * 1000);

  app.get('/api/health', (_request, response) => sendData(response, { status: 'ok' }));
  app.get('/api/meta', (_request, response) => sendData(response, {
    publicBaseUrl: process.env.PUBLIC_BASE_URL || '',
    publicBaseDomain: process.env.PUBLIC_BASE_DOMAIN || '',
  }));

  app.post('/api/auth/register', authLimiter, (request, response) => {
    if (!isRecord(request.body)) return sendError(response, 400, 'Please check the details and try again.');
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
      const config = defaultSalonConfig(salonName);

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
        database.prepare('INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)')
          .run(userId, email, ownerName, hashPassword(password), createdAt);
        database.prepare(`
          INSERT INTO salons (id, owner_id, slug, config_json, is_published, created_at, updated_at)
          VALUES (?, ?, ?, ?, 0, ?, ?)
        `).run(salonId, userId, slug, JSON.stringify(config), createdAt, createdAt);
        database.exec('COMMIT');
      } catch (error) {
        try { database.exec('ROLLBACK'); } catch { /* transaction was already closed */ }
        throw error;
      }

      const token = randomBytes(32).toString('hex');
      database.prepare('INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
        .run(sha256(token), userId, Date.now() + SESSION_TTL_MS, createdAt);
      setSessionCookie(response, token);
      const salon = database.prepare('SELECT * FROM salons WHERE id = ?').get(salonId) as unknown as SalonRow;
      return sendData(response, { user: { id: userId, email, name: ownerName }, salon: ownerSalonFromRow(salon) }, 201);
    } catch (error) {
      if (error instanceof ValidationError) return sendError(response, 400, error.message);
      if (String(error).includes('UNIQUE constraint failed')) return sendError(response, 409, 'That email or website address is already in use.');
      console.error('Registration failed:', error);
      return sendError(response, 500, 'We could not create your account just now. Please try again.');
    }
  });

  app.post('/api/auth/login', authLimiter, (request, response) => {
    if (!isRecord(request.body)) return sendError(response, 400, 'Enter your email and password.');
    try {
      const email = normalizeEmail(request.body.email);
      const password = typeof request.body.password === 'string' ? request.body.password : '';
      if (password.length > 128) return sendError(response, 400, 'Email or password is incorrect.');
      const user = database.prepare('SELECT * FROM users WHERE email = ?').get(email) as unknown as UserRow | undefined;
      if (!user || !verifyPassword(password, user.password_hash)) return sendError(response, 401, 'Email or password is incorrect.');

      const token = randomBytes(32).toString('hex');
      const createdAt = new Date().toISOString();
      database.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(Date.now());
      database.prepare('INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
        .run(sha256(token), user.id, Date.now() + SESSION_TTL_MS, createdAt);
      setSessionCookie(response, token);
      const salon = database.prepare('SELECT * FROM salons WHERE owner_id = ?').get(user.id) as unknown as SalonRow | undefined;
      if (!salon) return sendError(response, 404, 'Your salon workspace could not be found.');
      return sendData(response, { user: ownerFromRow(user), salon: ownerSalonFromRow(salon) });
    } catch (error) {
      if (error instanceof ValidationError) return sendError(response, 400, error.message);
      console.error('Login failed:', error);
      return sendError(response, 500, 'We could not sign you in just now. Please try again.');
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

  app.get('/api/public/resolve', (request, response) => {
    const slug = publicSlugFromRequest(request);
    if (!slug) return sendData(response, null);
    const row = database.prepare('SELECT * FROM salons WHERE published_slug = ? AND is_published = 1').get(slug) as unknown as SalonRow | undefined;
    return sendData(response, row ? publicSalonFromRow(row) : null);
  });

  app.get('/api/public/salons/:slug', (request, response) => {
    const slug = request.params.slug.toLowerCase();
    const row = database.prepare('SELECT * FROM salons WHERE published_slug = ? AND is_published = 1').get(slug) as unknown as SalonRow | undefined;
    if (!row) return sendError(response, 404, 'This salon website is not available.');
    return sendData(response, publicSalonFromRow(row));
  });

  app.get('/api/salons/:id', authenticate, (request, response) => {
    const auth = response.locals.auth as AuthContext;
    if (request.params.id !== auth.salon.id) return sendError(response, 404, 'Salon workspace not found.');
    return sendData(response, auth.salon);
  });

  app.put('/api/salons/:id', authenticate, (request, response) => {
    const auth = response.locals.auth as AuthContext;
    if (request.params.id !== auth.salon.id) return sendError(response, 404, 'Salon workspace not found.');
    if (!isRecord(request.body)) return sendError(response, 400, 'Website settings are invalid.');
    try {
      const slug = normalizeSlug(request.body.slug);
      const config = normalizeSalonConfig(request.body.config, auth.user.id, auth.salon.config.brand.name);
      const slugCollision = database.prepare('SELECT id FROM salons WHERE id <> ? AND (slug = ? OR published_slug = ?)')
        .get(auth.salon.id, slug, slug);
      if (slugCollision) return sendError(response, 409, 'That website address is already in use. Choose another one.');
      const updatedAt = new Date().toISOString();
      database.prepare('UPDATE salons SET slug = ?, config_json = ?, updated_at = ? WHERE id = ? AND owner_id = ?')
        .run(slug, JSON.stringify(config), updatedAt, auth.salon.id, auth.user.id);
      const updated = database.prepare('SELECT * FROM salons WHERE id = ?').get(auth.salon.id) as unknown as SalonRow;
      return sendData(response, ownerSalonFromRow(updated));
    } catch (error) {
      if (error instanceof ValidationError) return sendError(response, 400, error.message);
      if (String(error).includes('UNIQUE constraint failed')) return sendError(response, 409, 'That website address is already in use. Choose another one.');
      console.error('Saving salon settings failed:', error);
      return sendError(response, 500, 'We could not save your changes. Please try again.');
    }
  });

  app.post('/api/salons/:id/publish', authenticate, (request, response) => {
    const auth = response.locals.auth as AuthContext;
    if (request.params.id !== auth.salon.id) return sendError(response, 404, 'Salon workspace not found.');
    const current = database.prepare('SELECT * FROM salons WHERE id = ? AND owner_id = ?').get(auth.salon.id, auth.user.id) as unknown as SalonRow | undefined;
    if (!current) return sendError(response, 404, 'Salon workspace not found.');
    const config = parseSalonConfig(current.config_json);
    const ready = Boolean(config.brand.name.trim() && config.brand.heroTitle.trim() && config.services.some(service => service.name.trim() && service.price >= 0));
    if (!ready) return sendError(response, 422, 'Before publishing, add a website name, a hero heading, and at least one named service.');
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

  app.post('/api/salons/:id/unpublish', authenticate, (request, response) => {
    const auth = response.locals.auth as AuthContext;
    if (request.params.id !== auth.salon.id) return sendError(response, 404, 'Salon workspace not found.');
    database.prepare('UPDATE salons SET is_published = 0, updated_at = ? WHERE id = ? AND owner_id = ?')
      .run(new Date().toISOString(), auth.salon.id, auth.user.id);
    const updated = database.prepare('SELECT * FROM salons WHERE id = ?').get(auth.salon.id) as unknown as SalonRow;
    return sendData(response, ownerSalonFromRow(updated));
  });

  app.post('/api/uploads', authenticate, (request, response) => {
    const auth = response.locals.auth as AuthContext;
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

  app.get('/api/salons/:id/bookings', authenticate, (request, response) => {
    const auth = response.locals.auth as AuthContext;
    if (request.params.id !== auth.salon.id) return sendError(response, 404, 'Salon workspace not found.');
    const rows = database.prepare('SELECT * FROM bookings WHERE salon_id = ? ORDER BY appointment_date DESC, created_at DESC')
      .all(auth.salon.id) as unknown as BookingRow[];
    return sendData(response, rows.map(bookingFromRow));
  });

  app.patch('/api/salons/:id/bookings/:bookingId', authenticate, (request, response) => {
    const auth = response.locals.auth as AuthContext;
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
    const salonRow = database.prepare('SELECT * FROM salons WHERE published_slug = ? AND is_published = 1').get(slug) as unknown as SalonRow | undefined;
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
