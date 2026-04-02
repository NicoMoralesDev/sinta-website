# Architecture

**Analysis Date:** 2026-04-02

## Pattern Overview

**Overall:** Server-first Next.js App Router application with a thin API layer and two database-backed domain modules.

**Key Characteristics:**
- Route handlers in `app/api/v1/**/route.ts` stay thin and delegate validation and business rules to `lib/server/history/service.ts` or `lib/server/admin/service.ts`.
- Server-rendered pages in `app/page.tsx`, `app/results/page.tsx`, `app/drivers/page.tsx`, and `app/drivers/[slug]/page.tsx` call server services directly instead of fetching their own internal APIs.
- Database access is centralized in `lib/server/db.ts`, while SQL and transaction boundaries live in repository modules: `lib/server/history/repository.ts` and `lib/server/admin/repository.ts`.

## Layers

**Routing and page composition:**
- Purpose: Define URL entry points, compose page sections, and load server data for rendering.
- Location: `app/layout.tsx`, `app/page.tsx`, `app/results/page.tsx`, `app/drivers/page.tsx`, `app/drivers/[slug]/page.tsx`, `app/admin/**/page.tsx`, `pages/api/hello.ts`.
- Contains: App Router layouts, public pages, admin pages, and one leftover Pages Router API route in `pages/api/hello.ts`.
- Depends on: `app/components/**`, `app/admin/_components/**`, `app/content/site-content.ts`, `app/admin/_lib.ts`, `lib/server/history/service.ts`, `lib/server/admin/service.ts`.
- Used by: Next.js runtime.

**UI components:**
- Purpose: Render reusable public and admin interface pieces.
- Location: `app/components/*.tsx`, `app/admin/_components/*.tsx`.
- Contains: Public sections such as `app/components/hero.tsx` and `app/components/results.tsx`, plus admin client components such as `app/admin/_components/events-manager.tsx` and `app/admin/_components/users-manager.tsx`.
- Depends on: Props supplied by pages, `next/navigation` for admin refresh flows, and admin API routes for mutations.
- Used by: Page files under `app/**/page.tsx`.

**Content and presentation data:**
- Purpose: Hold bilingual copy and language resolution logic for the public site.
- Location: `app/content/site-content.ts`.
- Contains: Type definitions for UI copy, `siteCopy`, and `resolveLanguage`.
- Depends on: No application services.
- Used by: `app/page.tsx`, `app/results/page.tsx`, `app/drivers/page.tsx`, `app/drivers/[slug]/page.tsx`, and multiple public components under `app/components/`.

**API adapters:**
- Purpose: Convert HTTP requests into service calls and normalize HTTP responses.
- Location: `app/api/v1/_utils.ts`, `app/api/v1/admin/_utils.ts`, `app/api/v1/**/route.ts`, `app/api/health/db/route.ts`.
- Contains: Response helpers, request parsing helpers, admin cookie/session handling, and route handlers.
- Depends on: `next/server`, `lib/server/history/service.ts`, `lib/server/admin/service.ts`, `lib/server/admin/auth.ts`.
- Used by: Browser fetches from admin client components and external consumers of `/api/v1/**`.

**History domain service layer:**
- Purpose: Validate public query parameters, map search params to typed queries, and expose public read use cases.
- Location: `lib/server/history/service.ts`.
- Contains: Query parsing, cursor encoding/decoding, language mapping, and orchestration for results, drivers, team, and home-page live broadcast data.
- Depends on: `lib/server/history/repository.ts`, `lib/server/history/errors.ts`, `lib/server/history/types.ts`.
- Used by: Public pages and public API routes.

**History domain repository layer:**
- Purpose: Execute read queries against Postgres and map rows into application types.
- Location: `lib/server/history/repository.ts`.
- Contains: SQL for filters, driver stats, results pagination, current championship summaries, and home live broadcast candidate resolution.
- Depends on: `lib/server/db.ts`, `lib/server/history/types.ts`.
- Used by: `lib/server/history/service.ts`.

**Admin domain service layer:**
- Purpose: Enforce admin authorization, validate write payloads, implement dry-run behavior, and record audit actions.
- Location: `lib/server/admin/service.ts`.
- Contains: Authentication flows, CRUD rules for users/championships/events/drivers/aliases, live broadcast rules, results editing, and revert logic.
- Depends on: `lib/server/admin/auth.ts`, `lib/server/admin/errors.ts`, `lib/server/admin/repository.ts`, `lib/server/admin/types.ts`.
- Used by: `app/admin/_lib.ts` and admin API routes under `app/api/v1/admin/**`.

**Admin domain repository layer:**
- Purpose: Perform admin reads and writes, including multi-step transactional mutations.
- Location: `lib/server/admin/repository.ts`.
- Contains: SQL for `users`, `roles`, `audit_logs`, championships, events, drivers, aliases, live broadcast config, event results, and revert snapshots.
- Depends on: `lib/server/db.ts`, `lib/server/admin/types.ts`.
- Used by: `lib/server/admin/service.ts`.

**Platform and infrastructure:**
- Purpose: Encapsulate environment parsing and database pool lifecycle.
- Location: `lib/server/env.ts`, `lib/server/db.ts`.
- Contains: `DATABASE_URL` validation, pg `Pool` singleton creation, pool timeout tuning, and DB health query support.
- Depends on: `pg`, `process.env`.
- Used by: Both repository modules, scripts, and `app/api/health/db/route.ts`.

**Data import and bootstrap tooling:**
- Purpose: Load historical results and provision the first admin owner outside the web request lifecycle.
- Location: `scripts/import-results-xlsx.ts`, `scripts/bootstrap-admin-owner.ts`, `scripts/run-db-test.mjs`.
- Contains: Workbook parsing, seed upserts, admin bootstrap, and DB test launcher.
- Depends on: `lib/server/db.ts`, `lib/server/history/parser.ts`, `lib/server/history/seeds.ts`.
- Used by: Package scripts in `package.json`.

## Data Flow

**Public page render flow:**

1. A server page such as `app/page.tsx` or `app/results/page.tsx` receives `searchParams`.
2. The page resolves language with `app/content/site-content.ts` and builds `URLSearchParams` as needed.
3. The page calls read methods from `lib/server/history/service.ts`.
4. `lib/server/history/service.ts` validates query input, applies defaults, and delegates to `lib/server/history/repository.ts`.
5. `lib/server/history/repository.ts` queries Postgres through `lib/server/db.ts` and maps rows into typed DTOs.
6. The page renders server components and passes typed props into presentational components in `app/components/*.tsx`.

**Public API flow:**

1. A route such as `app/api/v1/results/events/route.ts` receives the HTTP request.
2. The route extracts query params and calls a history service method.
3. The history service throws `HistoryValidationError` or `HistoryNotFoundError` when input or data is invalid.
4. `app/api/v1/_utils.ts` converts service output into a JSON response with cache headers or converts domain errors into HTTP status codes.

**Admin page flow:**

1. A page such as `app/admin/events/page.tsx` calls `requireAdminPageActor` from `app/admin/_lib.ts`.
2. `app/admin/_lib.ts` reads the signed cookie via `next/headers`, parses it with `lib/server/admin/auth.ts`, and resolves the actor through `lib/server/admin/service.ts`.
3. The page loads initial datasets from `lib/server/admin/service.ts` and renders admin client components from `app/admin/_components/*.tsx`.
4. Client components submit mutations with `fetch()` to `app/api/v1/admin/**/route.ts`.
5. Admin API utilities in `app/api/v1/admin/_utils.ts` re-check authentication and role permissions, then call `lib/server/admin/service.ts`.
6. The admin service validates payloads, optionally returns dry-run output, and persists through `lib/server/admin/repository.ts`, which writes audit records inside transactions.
7. The client component calls `router.refresh()` so the server page re-renders with fresh data.

**Import flow:**

1. `scripts/import-results-xlsx.ts` reads the workbook file from disk.
2. The script parses rows with `lib/server/history/parser.ts` and matches aliases against `lib/server/history/seeds.ts`.
3. The script upserts championships, events, drivers, aliases, and event results via SQL against the shared `pg` pool.
4. Imported data becomes visible through the same read path used by pages and APIs.

**State Management:**
- Public pages are stateless server renders with short revalidation windows (`revalidate = 120` in `app/page.tsx`, `app/results/page.tsx`, `app/drivers/page.tsx`, and `app/drivers/[slug]/page.tsx`).
- Admin pages are explicitly dynamic (`dynamic = "force-dynamic"` in `app/admin/page.tsx` and sibling admin pages).
- Client-side state is local component state only, concentrated in `app/components/navbar.tsx` and `app/admin/_components/*.tsx`.
- There is no global client store and no separate frontend data access layer.

## Key Abstractions

**Route helper modules:**
- Purpose: Keep route handlers small and consistent.
- Examples: `app/api/v1/_utils.ts`, `app/api/v1/admin/_utils.ts`.
- Pattern: Shared HTTP response and request helper modules imported by many route files.

**Service and repository pairing:**
- Purpose: Separate input validation/business rules from SQL and persistence.
- Examples: `lib/server/history/service.ts` + `lib/server/history/repository.ts`, `lib/server/admin/service.ts` + `lib/server/admin/repository.ts`.
- Pattern: Service functions accept typed inputs or `URLSearchParams`, repository functions accept normalized primitives and return DTOs.

**Domain type modules:**
- Purpose: Define DTO contracts shared across pages, APIs, and repositories.
- Examples: `lib/server/history/types.ts`, `lib/server/admin/types.ts`.
- Pattern: Centralized type-only modules imported throughout their domain.

**Admin actor resolution:**
- Purpose: Normalize current-user lookup and permission context for both pages and APIs.
- Examples: `app/admin/_lib.ts`, `app/api/v1/admin/_utils.ts`, `lib/server/admin/service.ts`.
- Pattern: Cookie parsing and signature verification happen once per request path, then services work with an `AdminActor`.

**Bilingual copy registry:**
- Purpose: Keep public labels and section text centralized rather than scattered through components.
- Examples: `app/content/site-content.ts`.
- Pattern: Static `siteCopy` object keyed by language plus a small `resolveLanguage` helper.

## Entry Points

**Root layout:**
- Location: `app/layout.tsx`
- Triggers: Every App Router request.
- Responsibilities: Register fonts, metadata, viewport, global CSS, and root HTML shell.

**Home page:**
- Location: `app/page.tsx`
- Triggers: `GET /`
- Responsibilities: Compose the landing page and aggregate home data in parallel from `lib/server/history/service.ts`.

**Results hub:**
- Location: `app/results/page.tsx`
- Triggers: `GET /results`
- Responsibilities: Translate URL filters into history queries, render ranking and event participation, and build language-aware filter URLs.

**Driver pages:**
- Location: `app/drivers/page.tsx`, `app/drivers/[slug]/page.tsx`
- Triggers: `GET /drivers`, `GET /drivers/:slug`
- Responsibilities: Render roster and driver history views over the history service.

**Admin shell and overview:**
- Location: `app/admin/layout.tsx`, `app/admin/page.tsx`
- Triggers: `GET /admin` and nested admin routes.
- Responsibilities: Guard access, render the admin chrome, and expose operational metrics.

**Public API surface:**
- Location: `app/api/v1/**/route.ts`
- Triggers: External or internal HTTP calls.
- Responsibilities: Expose public read models for results, drivers, team, and filters.

**Admin API surface:**
- Location: `app/api/v1/admin/**/route.ts`
- Triggers: Browser mutations from admin client components.
- Responsibilities: Authenticate, authorize, validate JSON bodies, and call admin services.

**Operational health endpoint:**
- Location: `app/api/health/db/route.ts`
- Triggers: `GET /api/health/db`
- Responsibilities: Verify Postgres connectivity and return a simple availability payload.

**CLI data tooling:**
- Location: `scripts/import-results-xlsx.ts`, `scripts/bootstrap-admin-owner.ts`
- Triggers: `npm run import:results`, `npm run bootstrap:admin`
- Responsibilities: Maintain database content outside the request path.

## Error Handling

**Strategy:** Domain-specific errors are thrown in services and translated near the HTTP boundary. Server pages usually catch read failures locally and degrade to empty states or `null`.

**Patterns:**
- Public domain uses `HistoryValidationError` and `HistoryNotFoundError` from `lib/server/history/errors.ts`, mapped in `app/api/v1/_utils.ts`.
- Admin domain uses `AdminValidationError`, `AdminAuthError`, `AdminForbiddenError`, and `AdminNotFoundError` from `lib/server/admin/errors.ts`, mapped in `app/api/v1/admin/_utils.ts`.
- Public pages such as `app/page.tsx` and `app/results/page.tsx` frequently wrap service calls in `.catch(() => null)` or `.catch(() => [])` to keep pages rendering.
- Admin API routes consistently wrap each handler in `try/catch` and return JSON error payloads rather than throwing framework errors.
- Repository modules contain compatibility fallbacks for partially migrated schemas, for example the live stream columns and `live_broadcast_config` checks in `lib/server/history/repository.ts` and `lib/server/admin/repository.ts`.

## Cross-Cutting Concerns

**Logging:** No dedicated logging framework is present. Scripts such as `scripts/import-results-xlsx.ts` log to stdout only when `--debug` is enabled.

**Validation:** Input validation is service-centric. Public validation lives in `lib/server/history/service.ts`; admin validation lives in `lib/server/admin/service.ts`; environment validation lives in `lib/server/env.ts` and `lib/server/admin/auth.ts`.

**Authentication:** Admin authentication is cookie-based and custom. Session creation and verification live in `lib/server/admin/auth.ts`, while request-level enforcement lives in `app/admin/_lib.ts` and `app/api/v1/admin/_utils.ts`.

**Authorization:** Role checks are service-driven, typically through `assertRole` in `lib/server/admin/service.ts`, with page-level route guarding in `app/admin/_lib.ts`.

**Caching:** Public API responses use `Cache-Control` defaults from `app/api/v1/_utils.ts`, and public pages use ISR-style `revalidate = 120`. Admin responses are always `no-store` in `app/api/v1/admin/_utils.ts`.

**Persistence:** All persistent state flows through Postgres. Schema evolution is tracked in `db/migrations/*.sql`, and both repository modules use the shared pool from `lib/server/db.ts`.

---

*Architecture analysis: 2026-04-02*
