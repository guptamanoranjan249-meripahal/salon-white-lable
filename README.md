# Nexora Salon Studio

A multi-tenant, white-label salon website platform. Salon owners get private workspaces to build and edit their own public websites; visitors can browse published salons without an account. The platform starts with no seeded tenants, services, team members, customers, or bookings.

## Platform capabilities

### Salon owners

- Register with email and password, verify their email, and sign in with an HTTP-only session; Google sign-in is also supported.
- Complete an onboarding workspace for salon identity, unique website address, logo and photography, contact and map details, opening hours, services/prices, staff, page copy, brand colors, and one of three responsive templates.
- Save private drafts and preview the exact current draft before submitting it for review.
- Track approval status and read the Super Admin's rejection or change-request reason; update the draft and resubmit it.
- Publish only after approval. Any saved change to an approved version requires another review before those updates can be published. If a previously approved site is already live, its last approved snapshot stays public while edits are being reviewed.
- Manage booking requests submitted on that salon's public website. Salon and booking data are scoped to that owner.

### Super Admin

- Review platform accounts, roles, email-verification state, salon tenants, website publication, approval submissions/history, subscriptions, and platform settings.
- Approve, reject, or request changes for submitted websites. A reason is required for rejection or change requests and is shown to the owner.
- Suspend/reactivate users and salons, unpublish a website, and publish an approved website.
- Change subscription metadata and registration availability. Billing/payment processing is not connected.
- Bootstrap the first Super Admin through the local server command described below; Super Admin access cannot be selected during public registration.

## Requirements

- Node.js **22 or newer**.
- npm 10 or newer.

## Run locally

```bash
cp .env.example .env
npm install
npm run dev
```

Open <http://localhost:3000>. New email/password accounts must be verified before sign-in. In development, when SMTP is not configured, the registration screen provides a local one-time verification link. Google sign-in is shown but will redirect to an explanatory message until OAuth credentials are configured.

Useful commands:

```bash
npm run lint       # Type-check browser and server code
npm test           # API integration tests (SQLite in-memory)
npm run build      # Build browser application and production server bundle
npm start          # Serve the production build and API
npm run preview     # Build and run the production server
npm run promote-admin -- admin@example.com  # Grant Super Admin to a verified active account
```

The development server serves the Vite frontend and API from the same origin, so browser API calls and session cookies remain same-origin.

## First Super Admin

1. Register the intended admin email as a normal account (email/password or Google) and verify the email.
2. On the server, with the same `DATABASE_PATH` used by the application, run:

   ```bash
   npm run promote-admin -- admin@example.com
   ```

3. Sign in at `/admin`.

The command only promotes an existing verified, active account; it does not create users or accept a password. Additional Super Admins can be promoted from **Users & roles**. The API prevents the current admin from removing their own final active Super Admin access.

## Production configuration

Copy `.env.example` into the deployment environment and set at least:

- `NODE_ENV=production`
- `PORT` to the port supplied by the host
- `DATABASE_PATH` to a writable, persistent SQLite file
- `UPLOADS_DIR` to writable, persistent image storage
- `APP_BASE_URL=https://yourdomain.com` for trusted absolute email-verification links
- SMTP settings (`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`) for verification delivery
- `PUBLIC_BASE_URL=https://yourdomain.com` for path-based salon URLs, **or** `PUBLIC_BASE_DOMAIN=yourdomain.com` for wildcard salon subdomains
- `TRUST_PROXY=true` only when the app is behind a reverse proxy you control

Email/password registration fails closed in production if `APP_BASE_URL` or SMTP delivery is not configured. Use a valid, public HTTPS origin for `APP_BASE_URL`; do not build verification links from an untrusted host header.

### Google OAuth

Create a Google OAuth **Web application** client. Configure the authorized redirect URI to exactly match `GOOGLE_REDIRECT_URI`, for example:

```text
https://yourdomain.com/api/auth/google/callback
```

Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI` in the deployment environment. The server uses state, nonce, PKCE, and Google ID-token signature/issuer/audience/email-verification checks. OAuth credentials must never be committed to the repository.

### Public domains

Path-based public addresses use `/{published-slug}`. For wildcard subdomains, point `*.yourdomain.com` to the application, provision wildcard TLS, set `PUBLIC_BASE_DOMAIN=yourdomain.com`, and route those hosts to the same service. The server resolves only first-level published salon subdomains. Database uniqueness checks prevent duplicate salon paths and published addresses.

Build and start with `npm run build` and `npm start`. The server binds to `0.0.0.0`.

## Storage, backups, and deployment limits

SQLite and uploaded images are durable only when `DATABASE_PATH` and `UPLOADS_DIR` use persistent storage. Back up the database and uploads together. This setup is intended for a single application instance on shared persistent local storage; do not scale horizontally with separate disks. Before adding replicas, migrate salon/session/booking storage to a shared managed database and uploads to shared object storage. Booking emails and payment collection are not integrated; booking requests are stored in each owner's workspace.

## Security and tenancy

- Passwords use salted scrypt hashes. Random session and verification tokens are stored only as hashes. Session cookies are `HttpOnly`, `SameSite=Lax`, and `Secure` in production.
- Email verification is required before email/password sign-in. Google identities are accepted only after Google signature and verified-email checks.
- Role checks, account/salon suspension, owner scoping, publish approval, slug uniqueness, and input normalization are enforced by the API—not only by the browser.
- Public responses expose the published snapshot only; they do not expose draft settings, owner contact email, bookings, sessions, or review records. Public salon websites and their booking forms do not require visitor login.
- Image uploads are validated and owner-scoped. HTTPS image URLs are accepted; salon map/directions links must use HTTPS.
- Mutating browser API requests reject cross-origin requests. Authentication and public booking endpoints have per-process rate limits. Use HTTPS and review reverse-proxy trust settings before production deployment.

## Existing installation migration

Database initialization adds role, email-verification, approval, and subscription metadata without deleting salon content. Existing owner accounts are marked verified to avoid locking out users from pre-verification installations, and previously published salons are marked approved so their current websites remain available. New accounts and salons must follow verification and approval before publishing.
