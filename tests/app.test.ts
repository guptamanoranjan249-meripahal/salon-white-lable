import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createServer } from 'node:http';
import { after, before, test } from 'node:test';
import type { AddressInfo } from 'node:net';
import { createApp } from '../server/app';
import { createDatabase } from '../server/database';

const temporaryDirectory = mkdtempSync(path.join(tmpdir(), 'nexora-test-'));
process.env.UPLOADS_DIR = path.join(temporaryDirectory, 'uploads');
const database = createDatabase(':memory:');
const server = createServer(createApp(database));
let baseUrl = '';

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

test('owners have isolated drafts, published sites, and booking data', async () => {
  const registration = await request<{ user: { id: string }; salon: { id: string; config: { services: unknown[]; staff: unknown[] } } }>('/api/auth/register', {
    method: 'POST',
    body: { name: 'Mira Owner', email: 'mira@example.com', password: 'a-secure-test-password', salonName: 'Mira Studio', slug: 'mira-studio' },
  });
  assert.equal(registration.response.status, 201);
  assert.deepEqual(registration.payload.data?.salon.config.services, []);
  assert.deepEqual(registration.payload.data?.salon.config.staff, []);
  const firstCookie = registration.response.headers.get('set-cookie')?.split(';')[0];
  assert.ok(firstCookie);
  const salonId = registration.payload.data!.salon.id;
  const uploadedImage = await request<{ url: string }>('/api/uploads', {
    method: 'POST', cookie: firstCookie,
    body: { dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/9M8AAAAASUVORK5CYII=' },
  });
  assert.equal(uploadedImage.response.status, 201);
  const imageResponse = await fetch(`${baseUrl}${uploadedImage.payload.data!.url}`);
  assert.equal(imageResponse.status, 200);
  assert.match(imageResponse.headers.get('content-type') || '', /image\/png/);

  const content = {
    brand: {
      name: 'Mira Studio', category: 'Hair salon', tagline: 'Care, with a little intention.', logoUrl: '', heroImageUrl: '',
      heroBadge: 'IN YOUR NEIGHBORHOOD', heroTitle: 'A better hair day starts here.', heroSubtitle: 'Thoughtful appointments, made around you.',
      heroNote: 'GOOD THINGS, MADE PERSONAL', marqueeText: 'CARE, WITH A LITTLE INTENTION.',
      aboutTitle: 'Made with care', aboutText: 'A little space for good hair and slower moments.', servicesTitle: 'The menu', servicesIntro: 'Find something that feels right for you.',
      teamTitle: 'Meet the team', teamIntro: 'The people who make every visit feel special.', contactTitle: 'Come by', contactIntro: 'Reach out and make a little time for a visit.', bookingButton: 'Request a visit', footerText: 'See you soon.', currency: 'INR',
    },
    contact: { address: 'Ajmer, Rajasthan', phone: '+91 98765 43210', email: 'hello@example.com', instagram: '', facebook: '', hours: '' },
    theme: { accent: '#D4AF37', background: '#090908', surface: '#151410', text: '#F5F1E9', muted: '#B8B2A8' },
    services: [{ id: 'cut-style', name: 'Cut & style', category: 'Hair', price: 1200, duration: 60, description: 'A considered cut and finish.', imageUrl: '' }],
    staff: [],
  };

  const saved = await request<{ config: typeof content; isPublished: boolean }>('/api/salons/' + salonId, {
    method: 'PUT', cookie: firstCookie, body: { slug: 'mira-studio', config: content },
  });
  assert.equal(saved.response.status, 200);
  assert.equal(saved.payload.data?.isPublished, false);
  const unpublishedLookup = await request('/api/public/resolve?slug=mira-studio');
  assert.equal(unpublishedLookup.payload.data, null);

  const published = await request<{ publishedSlug: string; isPublished: boolean }>('/api/salons/' + salonId + '/publish', {
    method: 'POST', cookie: firstCookie, body: {},
  });
  assert.equal(published.response.status, 200);
  assert.equal(published.payload.data?.isPublished, true);
  assert.equal(published.payload.data?.publishedSlug, 'mira-studio');

  const publicSite = await request<{ slug: string; config: typeof content }>('/api/public/resolve?slug=mira-studio');
  assert.equal(publicSite.response.status, 200);
  assert.equal(publicSite.payload.data?.config.brand.name, 'Mira Studio');
  assert.equal(publicSite.payload.data?.config.services[0].price, 1200);

  const editedDraft = structuredClone(content);
  editedDraft.brand.heroTitle = 'Draft edits remain private.';
  await request('/api/salons/' + salonId, { method: 'PUT', cookie: firstCookie, body: { slug: 'mira-studio', config: editedDraft } });
  const liveAfterDraftSave = await request<{ config: typeof content }>('/api/public/resolve?slug=mira-studio');
  assert.equal(liveAfterDraftSave.payload.data?.config.brand.heroTitle, content.brand.heroTitle);

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

  const secondRegistration = await request<{ user: { id: string }; salon: { id: string } }>('/api/auth/register', {
    method: 'POST',
    body: { name: 'Another Owner', email: 'another@example.com', password: 'another-secure-password', salonName: 'Another Studio', slug: 'another-studio' },
  });
  const secondCookie = secondRegistration.response.headers.get('set-cookie')?.split(';')[0];
  assert.ok(secondCookie);
  const crossTenantRead = await request(`/api/salons/${salonId}/bookings`, { cookie: secondCookie });
  assert.equal(crossTenantRead.response.status, 404);
  const crossTenantWrite = await request(`/api/salons/${salonId}`, {
    method: 'PUT', cookie: secondCookie, body: { slug: 'mira-studio', config: content },
  });
  assert.equal(crossTenantWrite.response.status, 404);

  await request('/api/salons/' + salonId + '/unpublish', { method: 'POST', cookie: firstCookie, body: {} });
  const privateSite = await request('/api/public/resolve?slug=mira-studio');
  assert.equal(privateSite.payload.data, null);
});
