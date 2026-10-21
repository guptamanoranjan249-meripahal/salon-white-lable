import assert from 'node:assert/strict';
import BetterSqlite3 from 'better-sqlite3';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServer } from 'node:http';
import { after, before, test } from 'node:test';
import type { AddressInfo } from 'node:net';
import { createApp } from '../server/app';
import { createDatabase } from '../server/database';
import type { SalonConfig } from '../src/types';

const temporaryDirectory = mkdtempSync(path.join(tmpdir(), 'nexora-test-'));
process.env.UPLOADS_DIR = path.join(temporaryDirectory, 'uploads');
const database = createDatabase(':memory:');
const server = createServer(createApp(database));
let baseUrl = '';
const adminId = randomUUID();
const adminSessionToken = randomBytes(32).toString('hex');
const adminCookie = `salon_session=${adminSessionToken}`;

// Seed the first administrator through the same persistent role/session fields used by production auth.
const seededAt = new Date().toISOString();
database.prepare(`INSERT INTO users (id, email, name, password_hash, role, status, email_verified_at, created_at)
  VALUES (?, ?, ?, '', 'super_admin', 'active', ?, ?)`).run(adminId, 'admin@nexora.test', 'Platform Admin', seededAt, seededAt);
database.prepare('INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)')
  .run(createHash('sha256').update(adminSessionToken).digest('hex'), adminId, Date.now() + 60 * 60 * 1000, seededAt);

before(async () => {
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  database.close();
  rmSync(temporaryDirectory, { recursive: true, force: true });
});

async function request<T>(route: string, options: { method?: string; body?: unknown; cookie?: string } = {}) {
  const response = await fetch(`${baseUrl}${route}`, {
    method: options.method || 'GET',
    headers: {
      ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(options.cookie ? { Cookie: options.cookie } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const payload = await response.json() as { data?: T; error?: string };
  return { response, payload };
}

async function verifyLink(url: string): Promise<{ status: number; location: string | null; cookie: string | undefined }> {
  const parsed = new URL(url, baseUrl);
  const response = await fetch(`${baseUrl}${parsed.pathname}${parsed.search}`, { redirect: 'manual' });
  return { status: response.status, location: response.headers.get('location'), cookie: response.headers.get('set-cookie')?.split(';')[0] };
}

test('verification, isolated owner workflows, approval gates, and super-admin controls', async () => {
  const registration = await request<{ verificationRequired: boolean; verificationUrl: string }>('/api/auth/register', {
    method: 'POST',
    body: { name: 'Mira Owner', email: 'mira@example.com', password: 'a-secure-test-password', salonName: 'Mira Studio', slug: 'mira-studio' },
  });
  assert.equal(registration.response.status, 202);
  assert.equal(registration.payload.data?.verificationRequired, true);
  assert.ok(registration.payload.data?.verificationUrl);
  assert.equal(registration.response.headers.get('set-cookie'), null, 'registration must not create an authenticated session');
  const unverifiedUser = database.prepare('SELECT email_verified_at FROM users WHERE email = ?').get('mira@example.com') as { email_verified_at: string | null };
  assert.equal(unverifiedUser.email_verified_at, null);

  const unverifiedLogin = await request('/api/auth/login', { method: 'POST', body: { email: 'mira@example.com', password: 'a-secure-test-password' } });
  assert.equal(unverifiedLogin.response.status, 403);
  assert.match(unverifiedLogin.payload.error || '', /verify your email/i);
  const anonymousOwnerApi = await request('/api/auth/me');
  assert.equal(anonymousOwnerApi.response.status, 401);

  const verified = await verifyLink(registration.payload.data!.verificationUrl);
  assert.equal(verified.status, 303);
  assert.equal(verified.location, '/dashboard?verified=1');
  assert.ok(verified.cookie);
  const firstCookie = verified.cookie!;
  const replayedVerification = await verifyLink(registration.payload.data!.verificationUrl);
  assert.equal(replayedVerification.status, 303);
  assert.match(replayedVerification.location || '', /authError=verification-link/);
  const ownerSession = await request<{ user: { id: string; emailVerified: boolean; role: string }; salon: { id: string; approvalStatus: string; config: SalonConfig } }>('/api/auth/me', { cookie: firstCookie });
  assert.equal(ownerSession.response.status, 200);
  assert.equal(ownerSession.payload.data?.user.emailVerified, true);
  assert.equal(ownerSession.payload.data?.user.role, 'salon_owner');
  assert.equal(ownerSession.payload.data?.salon.approvalStatus, 'onboarding');
  const salonId = ownerSession.payload.data!.salon.id;
  const incompleteSubmission = await request('/api/salons/' + salonId + '/submit-approval', { method: 'POST', cookie: firstCookie, body: {} });
  assert.equal(incompleteSubmission.response.status, 422, 'incomplete onboarding cannot enter the review queue');
  const ownerAdminDenied = await request('/api/admin/overview', { cookie: firstCookie });
  assert.equal(ownerAdminDenied.response.status, 403);

  const uploadedImage = await request<{ url: string }>('/api/uploads', {
    method: 'POST', cookie: firstCookie,
    body: { dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/9M8AAAAASUVORK5CYII=' },
  });
  assert.equal(uploadedImage.response.status, 201);
  const imageResponse = await fetch(`${baseUrl}${uploadedImage.payload.data!.url}`);
  assert.equal(imageResponse.status, 200);
  assert.match(imageResponse.headers.get('content-type') || '', /image\/png/);

  const content: SalonConfig = {
    brand: {
      name: 'Mira Studio', category: 'Hair salon', tagline: 'Care, with a little intention.', logoUrl: uploadedImage.payload.data!.url, heroImageUrl: uploadedImage.payload.data!.url,
      heroBadge: 'IN YOUR NEIGHBORHOOD', heroTitle: 'A better hair day starts here.', heroSubtitle: 'Thoughtful appointments, made around you.',
      heroNote: 'GOOD THINGS, MADE PERSONAL', marqueeText: 'CARE, WITH A LITTLE INTENTION.',
      aboutTitle: 'Made with care', aboutText: 'A little space for good hair and slower moments.', servicesTitle: 'The menu', servicesIntro: 'Find something that feels right for you.',
      teamTitle: 'Meet the team', teamIntro: 'The people who make every visit feel special.', contactTitle: 'Come by', contactIntro: 'Reach out and make a little time for a visit.', bookingButton: 'Request a visit', footerText: 'See you soon.', currency: 'INR', template: 'atelier',
    },
    contact: { address: '12 Rose Lane, Ajmer, Rajasthan 305001', locationUrl: 'https://maps.google.com/?q=Ajmer+Rajasthan', phone: '+91 98765 43210', email: 'hello@example.com', instagram: 'https://instagram.com/mirastudio', facebook: '', hours: 'Monday – Saturday · 9am–6pm\nSunday · Closed' },
    theme: { accent: '#D4AF37', background: '#090908', surface: '#151410', text: '#F5F1E9', muted: '#B8B2A8' },
    services: [{ id: 'cut-style', name: 'Cut & style', category: 'Hair', price: 1200, duration: 60, description: 'A considered cut and finish.', imageUrl: '' }],
    staff: [{ id: 'mira-verma', name: 'Mira Verma', role: 'Owner & stylist', bio: 'Thoughtful cuts for everyday life.', specialties: 'Cutting · styling', imageUrl: '' }],
  };

  const invalidMapConfig = structuredClone(content);
  invalidMapConfig.contact.locationUrl = 'http://maps.example.com/mira';
  const invalidMap = await request(`/api/salons/${salonId}`, { method: 'PUT', cookie: firstCookie, body: { slug: 'mira-studio', config: invalidMapConfig } });
  assert.equal(invalidMap.response.status, 400, 'map links must be HTTPS');

  const saved = await request<{ config: SalonConfig; isPublished: boolean; approvalStatus: string }>('/api/salons/' + salonId, {
    method: 'PUT', cookie: firstCookie, body: { slug: 'mira-studio', config: content },
  });
  assert.equal(saved.response.status, 200);
  assert.equal(saved.payload.data?.isPublished, false);
  assert.equal(saved.payload.data?.approvalStatus, 'draft');
  assert.equal(saved.payload.data?.config.brand.template, 'atelier');
  const unpublishedLookup = await request('/api/public/resolve?slug=mira-studio');
  assert.equal(unpublishedLookup.payload.data, null);

  const prematurePublish = await request(`/api/salons/${salonId}/publish`, { method: 'POST', cookie: firstCookie, body: {} });
  assert.equal(prematurePublish.response.status, 403);
  const submitted = await request<{ approvalStatus: string; submittedAt: string }>('/api/salons/' + salonId + '/submit-approval', { method: 'POST', cookie: firstCookie, body: {} });
  assert.equal(submitted.response.status, 200);
  assert.equal(submitted.payload.data?.approvalStatus, 'pending_approval');
  assert.ok(submitted.payload.data?.submittedAt);
  const ownerCannotReview = await request('/api/admin/reviews', { cookie: firstCookie });
  assert.equal(ownerCannotReview.response.status, 403);

  const overview = await request<{ pendingApprovals: number }>('/api/admin/overview', { cookie: adminCookie });
  assert.equal(overview.response.status, 200);
  assert.equal(overview.payload.data?.pendingApprovals, 1);
  const reviewQueue = await request<{ items: Array<{ id: string; approvalStatus: string }>; total: number }>('/api/admin/reviews?q=mira', { cookie: adminCookie });
  assert.equal(reviewQueue.response.status, 200);
  assert.equal(reviewQueue.payload.data?.total, 1);
  assert.equal(reviewQueue.payload.data?.items[0].id, salonId);
  assert.equal(reviewQueue.payload.data?.items[0].approvalStatus, 'pending_approval');
  const reviewDetails = await request<{ config: SalonConfig; history: unknown[] }>('/api/admin/salons/' + salonId + '/review', { cookie: adminCookie });
  assert.equal(reviewDetails.response.status, 200);
  assert.equal(reviewDetails.payload.data?.config.brand.name, 'Mira Studio');
  assert.equal(reviewDetails.payload.data?.config.contact.locationUrl, content.contact.locationUrl);

  const reasonRequired = await request('/api/admin/salons/' + salonId + '/review', {
    method: 'POST', cookie: adminCookie, body: { action: 'changes_requested', reason: 'No' },
  });
  assert.equal(reasonRequired.response.status, 400, 'a rejection/change request must include a useful reason');
  const adminReview = await request('/api/admin/salons/' + salonId + '/review', {
    method: 'POST', cookie: adminCookie, body: { action: 'changes_requested', reason: 'Please add a little more detail about the studio story before publishing.' },
  });
  assert.equal(adminReview.response.status, 200);
  const ownerFeedback = await request<{ salon: { approvalStatus: string; approvalReason: string } }>('/api/auth/me', { cookie: firstCookie });
  assert.equal(ownerFeedback.payload.data?.salon.approvalStatus, 'changes_requested');
  assert.match(ownerFeedback.payload.data?.salon.approvalReason || '', /studio story/);
  const deniedWhileChangesRequested = await request(`/api/salons/${salonId}/publish`, { method: 'POST', cookie: firstCookie, body: {} });
  assert.equal(deniedWhileChangesRequested.response.status, 403);
  const reviewHistory = await request<{ history: Array<{ action: string; reason: string }> }>('/api/admin/salons/' + salonId + '/review', { cookie: adminCookie });
  assert.equal(reviewHistory.payload.data?.history.length, 1);
  assert.equal(reviewHistory.payload.data?.history[0].action, 'changes_requested');

  const revisedContent = structuredClone(content);
  revisedContent.brand.aboutText = 'A neighborhood studio in Ajmer for considered cuts, easy styling, and time to feel at home.';
  const revised = await request<{ approvalStatus: string; approvalReason: string }>('/api/salons/' + salonId, {
    method: 'PUT', cookie: firstCookie, body: { slug: 'mira-studio', config: revisedContent },
  });
  assert.equal(revised.payload.data?.approvalStatus, 'draft');
  assert.equal(revised.payload.data?.approvalReason, '');
  const resubmitted = await request<{ approvalStatus: string }>('/api/salons/' + salonId + '/submit-approval', { method: 'POST', cookie: firstCookie, body: {} });
  assert.equal(resubmitted.payload.data?.approvalStatus, 'pending_approval');
  const approved = await request('/api/admin/salons/' + salonId + '/review', {
    method: 'POST', cookie: adminCookie, body: { action: 'approved', reason: 'The updated salon details are complete.' },
  });
  assert.equal(approved.response.status, 200);
  const approvedOwner = await request<{ salon: { approvalStatus: string } }>('/api/auth/me', { cookie: firstCookie });
  assert.equal(approvedOwner.payload.data?.salon.approvalStatus, 'approved');

  const published = await request<{ publishedSlug: string; isPublished: boolean }>('/api/salons/' + salonId + '/publish', {
    method: 'POST', cookie: firstCookie, body: {},
  });
  assert.equal(published.response.status, 200);
  assert.equal(published.payload.data?.isPublished, true);
  assert.equal(published.payload.data?.publishedSlug, 'mira-studio');
  const publicSite = await request<{ slug: string; config: SalonConfig }>('/api/public/resolve?slug=mira-studio');
  assert.equal(publicSite.response.status, 200);
  assert.equal(publicSite.payload.data?.config.brand.name, 'Mira Studio');
  assert.equal(publicSite.payload.data?.config.services[0].price, 1200);
  assert.equal(publicSite.payload.data?.config.brand.aboutText, revisedContent.brand.aboutText);

  const editedDraft = structuredClone(revisedContent);
  editedDraft.brand.heroTitle = 'Draft edits stay private until reviewed.';
  const changedLive = await request<{ approvalStatus: string; isPublished: boolean }>('/api/salons/' + salonId, {
    method: 'PUT', cookie: firstCookie, body: { slug: 'mira-studio', config: editedDraft },
  });
  assert.equal(changedLive.payload.data?.approvalStatus, 'draft', 'any saved live content change must require renewed approval');
  assert.equal(changedLive.payload.data?.isPublished, true, 'the previously approved snapshot can remain live while an update is reviewed');
  const oldLiveSnapshot = await request<{ config: SalonConfig }>('/api/public/resolve?slug=mira-studio');
  assert.equal(oldLiveSnapshot.payload.data?.config.brand.heroTitle, revisedContent.brand.heroTitle);
  const publishUnapprovedUpdate = await request(`/api/salons/${salonId}/publish`, { method: 'POST', cookie: firstCookie, body: {} });
  assert.equal(publishUnapprovedUpdate.response.status, 403);
  const updateSubmission = await request('/api/salons/' + salonId + '/submit-approval', { method: 'POST', cookie: firstCookie, body: {} });
  assert.equal(updateSubmission.response.status, 200);
  const approveUpdate = await request('/api/admin/salons/' + salonId + '/review', {
    method: 'POST', cookie: adminCookie, body: { action: 'approved', reason: '' },
  });
  assert.equal(approveUpdate.response.status, 200);
  const republished = await request('/api/salons/' + salonId + '/publish', { method: 'POST', cookie: firstCookie, body: {} });
  assert.equal(republished.response.status, 200);
  const updatedPublic = await request<{ config: SalonConfig }>('/api/public/salons/mira-studio');
  assert.equal(updatedPublic.payload.data?.config.brand.heroTitle, editedDraft.brand.heroTitle);

  const appointmentDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const booking = await request<{ id: string; status: string }>('/api/public/salons/mira-studio/bookings', {
    method: 'POST',
    body: { serviceId: 'cut-style', date: appointmentDate, timeSlot: '10:00 AM', customerName: 'Sam Client', customerEmail: 'sam@example.com', customerPhone: '+91 99887 76655', notes: '' },
  });
  assert.equal(booking.response.status, 201);
  assert.equal(booking.payload.data?.status, 'Pending');
  const ownerBookings = await request<Array<{ id: string; salonId: string; price: number }>>('/api/salons/' + salonId + '/bookings', { cookie: firstCookie });
  assert.equal(ownerBookings.payload.data?.length, 1);
  assert.equal(ownerBookings.payload.data?.[0].salonId, salonId);
  assert.equal(ownerBookings.payload.data?.[0].price, 1200);

  const duplicateSlug = await request('/api/auth/register', {
    method: 'POST', body: { name: 'Other Owner', email: 'slug-collision@example.com', password: 'a-secure-test-password', salonName: 'Collision', slug: 'mira-studio' },
  });
  assert.equal(duplicateSlug.response.status, 409);
  const secondRegistration = await request<{ verificationUrl: string }>('/api/auth/register', {
    method: 'POST',
    body: { name: 'Another Owner', email: 'another@example.com', password: 'another-secure-password', salonName: 'Another Studio', slug: 'another-studio' },
  });
  assert.equal(secondRegistration.response.status, 202);
  assert.equal(secondRegistration.response.headers.get('set-cookie'), null);
  const resentVerification = await request<{ verificationUrl: string }>('/api/auth/verification/resend', {
    method: 'POST', body: { email: 'another@example.com' },
  });
  assert.equal(resentVerification.response.status, 200);
  assert.ok(resentVerification.payload.data?.verificationUrl);
  const staleLink = await verifyLink(secondRegistration.payload.data!.verificationUrl);
  assert.match(staleLink.location || '', /authError=verification-link/);
  const secondVerified = await verifyLink(resentVerification.payload.data!.verificationUrl);
  assert.equal(secondVerified.status, 303);
  assert.ok(secondVerified.cookie);
  const secondCookie = secondVerified.cookie!;
  const secondSession = await request<{ salon: { id: string; config: SalonConfig } }>('/api/auth/me', { cookie: secondCookie });
  const secondSalonId = secondSession.payload.data!.salon.id;
  const crossTenantRead = await request(`/api/salons/${salonId}/bookings`, { cookie: secondCookie });
  assert.equal(crossTenantRead.response.status, 404);
  const crossTenantWrite = await request(`/api/salons/${salonId}`, {
    method: 'PUT', cookie: secondCookie, body: { slug: 'mira-studio', config: content },
  });
  assert.equal(crossTenantWrite.response.status, 404);
  const crossTenantSlugClaim = await request(`/api/salons/${secondSalonId}`, {
    method: 'PUT', cookie: secondCookie, body: { slug: 'mira-studio', config: secondSession.payload.data!.salon.config },
  });
  assert.equal(crossTenantSlugClaim.response.status, 409, 'website paths must be unique across tenants');

  const adminUsers = await request<{ items: Array<{ id: string; emailVerified: boolean }> }>('/api/admin/users?q=mira', { cookie: adminCookie });
  assert.equal(adminUsers.response.status, 200);
  assert.equal(adminUsers.payload.data?.items[0].emailVerified, true);
  const selfDemotion = await request(`/api/admin/users/${adminId}`, { method: 'PATCH', cookie: adminCookie, body: { role: 'salon_owner', status: 'active' } });
  assert.equal(selfDemotion.response.status, 409, 'the final administrator cannot remove their own access');

  const adminUnpublish = await request(`/api/admin/salons/${salonId}/unpublish`, { method: 'POST', cookie: adminCookie, body: {} });
  assert.equal(adminUnpublish.response.status, 200);
  const privateSite = await request('/api/public/resolve?slug=mira-studio');
  assert.equal(privateSite.payload.data, null);
  const adminRepublish = await request(`/api/admin/salons/${salonId}/publish`, { method: 'POST', cookie: adminCookie, body: {} });
  assert.equal(adminRepublish.response.status, 200, 'a super admin may publish an approved website');
  const savedDomain = process.env.PUBLIC_BASE_DOMAIN;
  const savedTrustProxy = process.env.TRUST_PROXY;
  process.env.PUBLIC_BASE_DOMAIN = 'salons.example.test';
  process.env.TRUST_PROXY = 'false';
  try {
    const forwardedHostSpoof = await fetch(`${baseUrl}/api/public/resolve`, { headers: { 'x-forwarded-host': 'mira-studio.salons.example.test' } });
    assert.equal((await forwardedHostSpoof.json() as { data: unknown }).data, null, 'untrusted forwarded-host headers must not resolve salon sites');
  } finally {
    if (savedDomain === undefined) delete process.env.PUBLIC_BASE_DOMAIN; else process.env.PUBLIC_BASE_DOMAIN = savedDomain;
    if (savedTrustProxy === undefined) delete process.env.TRUST_PROXY; else process.env.TRUST_PROXY = savedTrustProxy;
  }
  const suspendedSalon = await request(`/api/admin/salons/${salonId}`, { method: 'PATCH', cookie: adminCookie, body: { status: 'suspended' } });
  assert.equal(suspendedSalon.response.status, 200);
  const suspendedPublicSite = await request('/api/public/resolve?slug=mira-studio');
  assert.equal(suspendedPublicSite.payload.data, null, 'suspended salon sites are hidden from public visitors');
  const reactivatedSalon = await request(`/api/admin/salons/${salonId}`, { method: 'PATCH', cookie: adminCookie, body: { status: 'active' } });
  assert.equal(reactivatedSalon.response.status, 200);
  const restoredPublicSite = await request('/api/public/resolve?slug=mira-studio');
  assert.equal(restoredPublicSite.response.status, 200);

  const suspendOwner = await request(`/api/admin/users/${ownerSession.payload.data!.user.id}`, {
    method: 'PATCH', cookie: adminCookie, body: { status: 'suspended' },
  });
  assert.equal(suspendOwner.response.status, 200);
  const suspendedOwnerSite = await request('/api/public/resolve?slug=mira-studio');
  assert.equal(suspendedOwnerSite.payload.data, null, 'suspending the account also removes its public website');
  const revokedOwnerSession = await request('/api/auth/me', { cookie: firstCookie });
  assert.equal(revokedOwnerSession.response.status, 401, 'admin suspension revokes existing sessions');
  const reactivateOwner = await request(`/api/admin/users/${ownerSession.payload.data!.user.id}`, {
    method: 'PATCH', cookie: adminCookie, body: { status: 'active' },
  });
  assert.equal(reactivateOwner.response.status, 200);
  const freshOwnerLogin = await request('/api/auth/login', { method: 'POST', body: { email: 'mira@example.com', password: 'a-secure-test-password' } });
  assert.equal(freshOwnerLogin.response.status, 200);

  const settings = await request<{ platformName: string; supportEmail: string; defaultCurrency: string; allowOwnerRegistration: boolean }>('/api/admin/settings', { cookie: adminCookie });
  assert.equal(settings.response.status, 200);
  const closedRegistration = await request('/api/admin/settings', {
    method: 'PUT', cookie: adminCookie,
    body: { ...settings.payload.data, allowOwnerRegistration: false, defaultCurrency: 'USD', platformName: 'Salon Platform', supportEmail: 'support@example.com' },
  });
  assert.equal(closedRegistration.response.status, 200);
  const publicMeta = await request<{ platformName: string; supportEmail: string }>('/api/meta');
  assert.equal(publicMeta.payload.data?.platformName, 'Salon Platform');
  assert.equal(publicMeta.payload.data?.supportEmail, 'support@example.com');
  const registrationBlocked = await request('/api/auth/register', {
    method: 'POST', body: { name: 'Blocked Owner', email: 'blocked@example.com', password: 'a-secure-test-password', salonName: 'Blocked Studio', slug: 'blocked-studio' },
  });
  assert.equal(registrationBlocked.response.status, 403);
  const reopenedRegistration = await request('/api/admin/settings', {
    method: 'PUT', cookie: adminCookie,
    body: { ...settings.payload.data, allowOwnerRegistration: true, defaultCurrency: 'USD' },
  });
  assert.equal(reopenedRegistration.response.status, 200);
  const settingAwareRegistration = await request('/api/auth/register', {
    method: 'POST', body: { name: 'Currency Owner', email: 'currency@example.com', password: 'a-secure-test-password', salonName: 'Currency Studio', slug: 'currency-studio' },
  });
  assert.equal(settingAwareRegistration.response.status, 202);
  const newSalonConfig = database.prepare(`SELECT salons.config_json FROM salons JOIN users ON users.id = salons.owner_id WHERE users.email = ?`)
    .get('currency@example.com') as { config_json: string };
  assert.equal(JSON.parse(newSalonConfig.config_json).brand.currency, 'USD', 'new salon drafts respect the Super Admin default currency');
});

test('database upgrades preserve existing users and published salon snapshots', () => {
  const legacyPath = path.join(temporaryDirectory, 'legacy.sqlite');
  const legacy = new BetterSqlite3(legacyPath);
  legacy.exec(`
    CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, password_hash TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL);
    CREATE TABLE salons (
      id TEXT PRIMARY KEY, owner_id TEXT NOT NULL UNIQUE REFERENCES users(id), slug TEXT NOT NULL UNIQUE,
      published_slug TEXT UNIQUE, config_json TEXT NOT NULL, published_config_json TEXT, is_published INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
  `);
  const createdAt = '2025-01-02T03:04:05.000Z';
  legacy.prepare('INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)')
    .run('legacy-user', 'legacy@example.com', 'Legacy Owner', 'scrypt$hash', createdAt);
  legacy.prepare(`INSERT INTO salons (id, owner_id, slug, published_slug, config_json, published_config_json, is_published, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`)
    .run('legacy-salon', 'legacy-user', 'legacy-studio', 'legacy-studio', '{}', '{}', createdAt, createdAt);
  legacy.close();

  const upgraded = createDatabase(legacyPath);
  const user = upgraded.prepare('SELECT role, status, email_verified_at FROM users WHERE id = ?').get('legacy-user') as {
    role: string; status: string; email_verified_at: string | null;
  };
  const salon = upgraded.prepare('SELECT approval_status, is_published FROM salons WHERE id = ?').get('legacy-salon') as {
    approval_status: string; is_published: number;
  };
  assert.equal(user.role, 'salon_owner');
  assert.equal(user.status, 'active');
  assert.equal(user.email_verified_at, createdAt);
  assert.equal(salon.approval_status, 'approved');
  assert.equal(salon.is_published, 1);
  upgraded.close();
});
