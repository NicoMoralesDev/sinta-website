# External Integrations

**Analysis Date:** 2026-04-02

## APIs & External Services

**Database / Backend Service:**
- PostgreSQL via Supabase-managed connection string - primary application data store for race history, admin users, audit logs, and live broadcast config.
  - SDK/Client: `pg`
  - Auth: `DATABASE_URL`
  - Evidence: `lib/server/db.ts`, `lib/server/env.ts`, `README.md`, `db/migrations/001_results_schema.sql`

**Video / Streaming:**
- YouTube public watch and embed URLs - live stream hero content is configured by admins and rendered as an iframe/watch link.
  - SDK/Client: none; URL-based integration only
  - Auth: none
  - Evidence: `lib/server/admin/service.ts`, `app/components/hero.tsx`, `app/admin/_components/live-broadcast-manager.tsx`, `db/migrations/007_events_live_stream.sql`, `db/migrations/008_live_broadcast_config.sql`

**Social:**
- Instagram profile link - used as a static outbound CTA from the public site.
  - SDK/Client: none; URL-based integration only
  - Auth: none
  - Evidence: `app/content/site-content.ts`, `app/components/contact.tsx`, `app/components/navbar.tsx`

**Fonts / Asset Delivery:**
- Google Fonts through Next.js font optimization - `Rajdhani` and `Orbitron` are loaded at build/runtime through the Next font system.
  - SDK/Client: `next/font/google`
  - Auth: none
  - Evidence: `app/layout.tsx`

## Data Storage

**Databases:**
- PostgreSQL, with Supabase documented as the expected provider.
  - Connection: `DATABASE_URL`
  - Client: `pg` with a shared `Pool` from `lib/server/db.ts`
  - Schema source: raw SQL migrations in `db/migrations/001_results_schema.sql` through `db/migrations/008_live_broadcast_config.sql`

**File Storage:**
- Local filesystem only for import inputs and static assets.
  - Import workflow reads `.xlsx` files from disk in `scripts/import-results-xlsx.ts`.
  - Static assets are served from `public/`.
  - No remote object storage client is detected.

**Caching:**
- None detected.
  - API responses are generated through route handlers in `app/api/v1/**/route.ts`.
  - Admin responses explicitly disable caching in `app/api/v1/admin/_utils.ts`.

## Authentication & Identity

**Auth Provider:**
- Custom admin authentication.
  - Implementation: password hashing and verification with Node `crypto.scrypt`, signed session tokens with HMAC, and cookie-based sessions in `lib/server/admin/auth.ts`.
  - Session/cookie plumbing: `app/api/v1/admin/_utils.ts`, `app/admin/_lib.ts`, `app/api/v1/admin/auth/login/route.ts`
  - Backing storage: `users`, `roles`, and `audit_logs` tables introduced by `db/migrations/004_admin_auth_softdelete_audit.sql` and `db/migrations/006_users_roles_refactor.sql`

## Monitoring & Observability

**Error Tracking:**
- None detected.
  - No Sentry, Datadog, New Relic, or OpenTelemetry application integration is referenced in `app/`, `lib/`, `pages/`, or `scripts/`.

**Logs:**
- Process stdout/stderr only.
  - CLI scripts emit summaries and debug lines with `console.log` / `console.error` in `scripts/import-results-xlsx.ts` and `scripts/bootstrap-admin-owner.ts`.
  - No centralized logging transport is configured.

## CI/CD & Deployment

**Hosting:**
- Vercel-style Next.js deployment is implied, not codified in repo config.
  - Evidence: `README.md` aligns Node 22 with the Vercel runtime and recommends Supabase transaction pooling for serverless usage.
  - No `vercel.json`, `netlify.toml`, `Dockerfile`, or GitHub Actions workflow is present in the repository root.

**CI Pipeline:**
- None detected in-repo.
  - Testing/lint/build entrypoints exist in `package.json`, but no workflow definitions are committed under `.github/workflows/`.

## Environment Configuration

**Required env vars:**
- `DATABASE_URL` - required by `lib/server/env.ts` and used by `lib/server/db.ts`.
- `DB_POOL_MAX` - optional pool sizing in `lib/server/db.ts`; operationally important for serverless production.
- `DB_POOL_IDLE_TIMEOUT_MS` - optional pool idle timeout in `lib/server/db.ts`.
- `DB_POOL_CONNECTION_TIMEOUT_MS` - optional pool connection timeout in `lib/server/db.ts`.
- `ADMIN_SESSION_SECRET` - required in production by `lib/server/admin/auth.ts`.
- `ADMIN_PASSWORD_PEPPER` - required in production and for bootstrap hashing in `lib/server/admin/auth.ts` and `scripts/bootstrap-admin-owner.ts`.
- `ADMIN_DEV_DRY_RUN` - development write safety flag in `lib/server/admin/auth.ts` and `app/api/v1/admin/session/route.ts`.
- `ADMIN_ENABLE_IN_DEV` - dev/test admin access gate in `lib/server/admin/auth.ts`.
- `ADMIN_SESSION_TTL_SECONDS` - optional admin session TTL in `lib/server/admin/auth.ts`.
- `ADMIN_MAX_FAILED_ATTEMPTS` - optional lockout threshold in `lib/server/admin/auth.ts`.
- `ADMIN_LOCK_MINUTES` - optional lock window in `lib/server/admin/auth.ts`.
- `ADMIN_BOOTSTRAP_USERNAME` - first-owner bootstrap input in `scripts/bootstrap-admin-owner.ts`.
- `ADMIN_BOOTSTRAP_EMAIL` - legacy bootstrap fallback in `scripts/bootstrap-admin-owner.ts`.
- `ADMIN_BOOTSTRAP_PASSWORD` - first-owner bootstrap password in `scripts/bootstrap-admin-owner.ts`.
- `RUN_DB_INTEGRATION_TESTS` - test-only flag injected by `scripts/run-db-test.mjs` for `tests/db.integration.spec.ts`.

**Secrets location:**
- Local development uses `.env` derived from `.env.example`, as documented in `README.md`.
- Production secret storage is not defined in repo config; the code expects standard environment variables at runtime.

## Webhooks & Callbacks

**Incoming:**
- None.
  - All route handlers in `app/api/` are first-party application endpoints; no third-party webhook receiver is implemented.

**Outgoing:**
- None as authenticated callbacks.
  - The app emits browser navigations to Instagram and embeds/links to YouTube in `app/components/contact.tsx` and `app/components/hero.tsx`.
  - No outbound webhook sender, email provider, analytics collector, or third-party API client is detected.

---

*Integration audit: 2026-04-02*
