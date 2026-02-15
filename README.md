# SINTA Website

Sitio web de SINTA eSports construido con Next.js (App Router), React y TypeScript.

## Requisitos

- Node.js `22.x` (aligned with Vercel project runtime)
- npm

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run test
npm run test:watch
npm run test:db
npm run import:results -- --dry-run
npm run import:results -- --apply
npm run bootstrap:admin
```

## Desarrollo

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Levantar entorno local:
   ```bash
   npm run dev
   ```
3. Abrir `http://localhost:3000`.

## Entorno (DB)

1. Crear `.env` a partir de `.env.example`.
2. Definir `DATABASE_URL` con la cadena de conexion de Supabase (Postgres).
3. Configure admin secrets and flags (`ADMIN_*` variables).

Ejemplo:

```bash
DATABASE_URL=postgresql://postgres.<project-ref>:<url-encoded-password>@aws-0-us-west-2.pooler.supabase.com:<5432-or-6543>/postgres?sslmode=require
DB_POOL_MAX=1
DB_POOL_IDLE_TIMEOUT_MS=5000
DB_POOL_CONNECTION_TIMEOUT_MS=10000
ADMIN_SESSION_SECRET=replace-with-long-random-secret
ADMIN_PASSWORD_PEPPER=replace-with-long-random-pepper
ADMIN_DEV_DRY_RUN=1
ADMIN_ENABLE_IN_DEV=1
ADMIN_BOOTSTRAP_USERNAME=owner
ADMIN_BOOTSTRAP_PASSWORD=replace-with-temporary-password
```

Notas:
- Supabase `session pooler` usa puerto `5432`.
- Supabase `transaction pooler` usa puerto `6543` y suele funcionar mejor en serverless (Vercel).
- Si usas `session pooler`, mantener `DB_POOL_MAX` muy bajo para evitar `max clients reached`.
- Si la password tiene caracteres especiales (`@`, `!`, `:`, `/`, etc), debe ir URL-encoded.

Environment variables reference:
- `DATABASE_URL`: Primary Postgres connection string used by API routes, repository layer, and scripts.
- `DB_POOL_MAX`: Maximum clients per app instance in pg pool (recommended `1` in serverless production).
- `DB_POOL_IDLE_TIMEOUT_MS`: Idle client timeout for pg pool (milliseconds).
- `DB_POOL_CONNECTION_TIMEOUT_MS`: Connection acquisition timeout for pg pool (milliseconds).
- `ADMIN_SESSION_SECRET`: Secret key used to sign and verify admin session cookies.
- `ADMIN_PASSWORD_PEPPER`: Extra server-side secret appended before password hashing/verification.
- `ADMIN_DEV_DRY_RUN`: Development-only write safety flag. `1` means admin writes are preview-only; `0` allows real writes.
- `ADMIN_ENABLE_IN_DEV`: Development-only access flag. `1` enables admin routes/UI outside production; `0` disables admin in dev/test.
- `ADMIN_BOOTSTRAP_USERNAME`: Username used by `npm run bootstrap:admin` to create the first `owner` (`ADMIN_BOOTSTRAP_EMAIL` is still accepted as legacy fallback).
- `ADMIN_BOOTSTRAP_PASSWORD`: Temporary password used by `npm run bootstrap:admin` for the first `owner` (must be changed on first login).

## Health check de DB

- Endpoint: `GET /api/health/db`
- Respuesta esperada:
  - `200` con `{ ok: true, latencyMs, serverTimeIso }` cuando hay conectividad.
  - `503` con `{ ok: false }` cuando falla.

## Tests de DB

- `npm run test`: unit tests (incluye validaciones de entorno).
- `npm run test:db`: integration test de conectividad real usando `.env`.

## Estructura principal

- `app/layout.tsx`: layout global + metadata.
- `app/page.tsx`: home principal.
- `app/results/page.tsx`: results hub with URL filters and pagination.
- `app/drivers/[slug]/page.tsx`: driver profile with stats and history.
- `app/components/navbar.tsx`: navegacion superior.
- `lib/server/db.ts`: pool y health query para Postgres/Supabase.
- `lib/server/env.ts`: validacion tipada de `DATABASE_URL`.
- `pages/api/hello.ts`: endpoint API de ejemplo.
- `db/migrations/001_results_schema.sql`: schema para historial de resultados.
- `db/migrations/002_results_views.sql`: views para agregados y highlights.
- `db/migrations/003_events_date_compat.sql`: nullable `event_date` compatibility column.
- `db/migrations/004_admin_auth_softdelete_audit.sql`: admin users/auth, soft-delete flags, and audit logs.
- `db/migrations/005_results_views_active_filters.sql`: refreshes read views with `is_active` filters.
- `db/migrations/006_users_roles_refactor.sql`: renames admin auth tables to `users`/`audit_logs` and adds lookup table `roles`.
- `scripts/import-results-xlsx.ts`: import manual/idempotente desde `.xlsx`.
- `scripts/bootstrap-admin-owner.ts`: one-time owner bootstrap for admin access.
- `app/api/v1/*`: endpoints de resultados, roster y pilotos.

## Results API (v1)

- `GET /api/v1/results/events`
  - Supports `view=participation` to return grouped event participation cards.
- `GET /api/v1/results/highlights`
- `GET /api/v1/results/stats`
- `GET /api/v1/results/filters`
- `GET /api/v1/results/overview`
- `GET /api/v1/results/current`
- `GET /api/v1/team`
- `GET /api/v1/drivers`
- `GET /api/v1/drivers/:slug`
- `GET /api/v1/drivers/:slug/results`

## Frontend routes

- `/`: home quick overview (dynamic KPIs + recent event participation).
- `/results`: full results hub with year/championship/driver filters.
- `/drivers`: driver roster index with filters.
- `/drivers/:slug`: driver profile with aggregates, trend, and paginated history.
- `/admin/login`: admin login page.
- `/admin`: admin dashboard (private).
- `/admin/championships`: championships CRUD.
- `/admin/events`: events CRUD + inline results grid.
- `/admin/roster`: drivers + aliases CRUD.
- `/admin/users`: admin users/security (owner only).
- `/admin/audit`: audit trail + revert controls (owner only).

## Admin API (v1)

- `POST /api/v1/admin/auth/login`
- `POST /api/v1/admin/auth/logout`
- `GET /api/v1/admin/session`
- `POST /api/v1/admin/auth/change-password`
- `GET/POST /api/v1/admin/users` (owner)
- `PATCH /api/v1/admin/users/:id` (owner)
- `POST /api/v1/admin/users/:id/reset-password` (owner)
- `POST /api/v1/admin/users/:id/active` (owner)
- `GET/POST/PATCH /api/v1/admin/championships`
- `POST /api/v1/admin/championships/:id/active`
- `GET/POST/PATCH /api/v1/admin/events`
- `POST /api/v1/admin/events/:id/active`
- `GET/PUT /api/v1/admin/events/:id/results`
- `GET/POST/PATCH /api/v1/admin/drivers`
- `POST /api/v1/admin/drivers/:id/active`
- `GET/POST /api/v1/admin/drivers/:id/aliases`
- `DELETE /api/v1/admin/aliases/:id`
- `POST /api/v1/admin/revert`
- `GET /api/v1/admin/audit` (owner)

Notes:
- All admin responses use `Cache-Control: no-store`.
- Write endpoints run as `dry-run` by default in development when `ADMIN_DEV_DRY_RUN=1`.
- Temporary passwords are generated server-side and require mandatory change at first login.

## Import workflow

1. Apply SQL files from `db/migrations/` in order.
2. Run dry-run import:
   ```bash
   npm run import:results -- --dry-run
   ```
3. Apply import:
   ```bash
   npm run import:results -- --apply
   ```
4. Verify API:
   - `GET /api/v1/results/filters`
   - `GET /api/v1/results/highlights`

## Admin bootstrap workflow

1. Apply migrations `001` to `006`.
2. Configure admin env vars.
3. Create the first owner:
   ```bash
   npm run bootstrap:admin
   ```
4. Sign in at `/admin/login` with bootstrap credentials.
5. Change password immediately on first login.

## Roadmap notes

- Deferred feature triggers and conditions: `docs/future-features.md`.
