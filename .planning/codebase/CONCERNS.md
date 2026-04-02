# Codebase Concerns

**Analysis Date:** 2026-04-02

## Tech Debt

**Admin domain is concentrated in a few oversized modules:**
- Issue: The admin backend concentrates validation, orchestration, persistence, revert logic, and audit behavior inside `lib/server/admin/service.ts` and `lib/server/admin/repository.ts`, while the admin UI repeats similar fetch/error/state code in `app/admin/_components/events-manager.tsx`, `app/admin/_components/roster-manager.tsx`, and `app/admin/_components/users-manager.tsx`.
- Files: `lib/server/admin/service.ts`, `lib/server/admin/repository.ts`, `app/admin/_components/events-manager.tsx`, `app/admin/_components/roster-manager.tsx`, `app/admin/_components/users-manager.tsx`
- Impact: Small changes in admin behavior have a large blast radius, review cost is high, and the UI can drift into inconsistent request/error handling.
- Fix approach: Split admin code by subdomain (`users`, `championships`, `events`, `live-broadcast`, `audit`), add shared request helpers for client components, and move reusable validation into smaller modules.

**Runtime schema-compatibility branches are carrying old migrations in application code:**
- Issue: The app detects missing event stream columns and the missing `live_broadcast_config` table at runtime instead of assuming a single current schema.
- Files: `lib/server/admin/repository.ts`, `lib/server/admin/service.ts`, `lib/server/history/repository.ts`, `db/migrations/007_events_live_stream.sql`, `db/migrations/008_live_broadcast_config.sql`
- Impact: Query behavior changes depending on database history, which makes incidents harder to reason about and increases the chance of environment-specific bugs.
- Fix approach: Standardize on the latest schema, add a startup/schema check, and remove compatibility fallbacks once all environments are migrated.

**The import workflow uses code seeds as operational source of truth:**
- Issue: `scripts/import-results-xlsx.ts` validates aliases against `lib/server/history/seeds.ts` before touching the database, and `seedDriversAndAliases()` force-upserts driver metadata and aliases on every apply run.
- Files: `scripts/import-results-xlsx.ts`, `lib/server/history/seeds.ts`, `app/admin/_components/roster-manager.tsx`
- Impact: Admin-maintained aliases or driver metadata in the database can be overwritten by code seeds, and a valid DB alias can still be rejected during dry-run/apply if it is not also present in `DRIVER_SEEDS`.
- Fix approach: Make the database the source of truth for aliases, separate seed/bootstrap data from ongoing imports, and stop forcing driver metadata updates during every import.

**Package management is ambiguous:**
- Issue: The repo contains both `package-lock.json` and `pnpm-lock.yaml`, while `README.md` documents `npm` commands and `package.json` does not declare a `packageManager`.
- Files: `package.json`, `package-lock.json`, `pnpm-lock.yaml`, `README.md`
- Impact: Dependency resolution can diverge across machines and CI, which makes builds and debugging less deterministic.
- Fix approach: Choose one package manager, remove the unused lockfile, and declare the intended manager in `package.json` and `README.md`.

## Known Bugs

**`active=false` does not return inactive drivers or team members:**
- Symptoms: Driver and team endpoints still behave as active-only even when the query string sets `active=false`.
- Files: `lib/server/history/service.ts`, `lib/server/history/repository.ts`, `app/api/v1/drivers/route.ts`, `app/api/v1/team/route.ts`
- Trigger: Call `GET /api/v1/drivers?active=false` or `GET /api/v1/team?active=false`; `getTeamMembers(activeOnly)` discards the flag with `void activeOnly;` and hardcodes `where is_active = true`.
- Workaround: None in the current app; the only way to expose inactive entries is to change `lib/server/history/repository.ts`.

**The default test run fails on a clean checkout:**
- Symptoms: `npm test` exits with a failure in `tests/history-parser.spec.ts`.
- Files: `tests/history-parser.spec.ts`, `scripts/import-results-xlsx.ts`
- Trigger: Run `npm test` without a local `data-source/Historia The New Project.xlsx` workbook. The test reads that path directly, and the `data-source/` directory is not present in the repository.
- Workaround: Provide the workbook manually or replace the test with a committed fixture/synthetic buffer.

**Import validation ignores aliases that exist only in the database:**
- Symptoms: The import dry-run/apply path can report unknown aliases even when the admin UI has already stored matching aliases in `driver_aliases`.
- Files: `scripts/import-results-xlsx.ts`, `lib/server/history/seeds.ts`, `app/admin/_components/roster-manager.tsx`
- Trigger: Add an alias through the admin roster UI, leave `DRIVER_SEEDS` unchanged, then run `npm run import:results`.
- Workaround: Mirror the alias in `lib/server/history/seeds.ts` before importing.

## Security Considerations

**Database TLS verification is disabled:**
- Risk: `pg` connections accept any certificate because `ssl.rejectUnauthorized` is hardcoded to `false`.
- Files: `lib/server/db.ts`
- Current mitigation: Connection strings still require Postgres URLs, and Supabase commonly uses TLS.
- Recommendations: Make certificate verification configurable, default it to strict verification in production, and document the exception only for local development.

**Admin write endpoints rely on cookies without CSRF/origin checks:**
- Risk: State-changing admin routes accept the session cookie and do not verify `Origin`, `Referer`, or a CSRF token.
- Files: `app/api/v1/admin/_utils.ts`, `app/api/v1/admin/auth/change-password/route.ts`, `app/api/v1/admin/users/route.ts`, `app/api/v1/admin/events/route.ts`, `app/api/v1/admin/revert/route.ts`
- Current mitigation: The cookie is `HttpOnly` and `SameSite=lax` in `app/api/v1/admin/_utils.ts`, which helps but does not replace explicit CSRF validation for authenticated mutations.
- Recommendations: Add CSRF protection for admin mutations, or at minimum reject unsafe methods when the `Origin` header is missing or unexpected.

**Predictable fallback secrets are accepted outside production:**
- Risk: Missing `ADMIN_SESSION_SECRET` or `ADMIN_PASSWORD_PEPPER` falls back to fixed development strings whenever `NODE_ENV !== "production"`.
- Files: `lib/server/admin/auth.ts`
- Current mitigation: Production throws when secrets are missing.
- Recommendations: Require explicit secrets in every deployed environment and reserve insecure fallbacks for isolated local development only.

## Performance Bottlenecks

**Workbook import does per-row writes inside a single long transaction:**
- Problem: `upsertChampionships()`, `upsertEvents()`, and especially `upsertResults()` execute many sequential queries, while `runApplyImport()` keeps the whole import in one transaction with a `120s` statement timeout.
- Files: `scripts/import-results-xlsx.ts`
- Cause: The import path favors simple control flow over batching or bulk insert/upsert operations.
- Improvement path: Batch inserts with `unnest`/temporary tables, reduce per-row round trips, and add resumable import reporting.

**The parser reads and expands the whole XLSX in memory:**
- Problem: `parseHistoryWorkbookFromBuffer()` loads the workbook as a single buffer, walks ZIP structures manually, inflates entries synchronously, and parses XML with regex-driven passes.
- Files: `lib/server/history/parser.ts`, `scripts/import-results-xlsx.ts`
- Cause: The parser is implemented as a custom in-memory ZIP/XML reader rather than a streaming or library-backed importer.
- Improvement path: Switch to a maintained XLSX parser or introduce a streaming/bounded-memory parsing strategy with committed fixtures to validate the behavior.

## Fragile Areas

**The handwritten XLSX parser is tightly coupled to one workbook shape:**
- Files: `lib/server/history/parser.ts`, `tests/history-parser.spec.ts`
- Why fragile: Small workbook format changes can break the regex/XML assumptions, and the only end-to-end parser test depends on a file that is not in the repo.
- Safe modification: Treat parser changes as high-risk, add fixture-based regression coverage first, and avoid editing parsing rules without representative sample files.
- Test coverage: Coverage exists for one workbook path, but it is not portable enough to protect CI or fresh clones.

**Admin writes and audit logging are not atomic together:**
- Files: `lib/server/admin/service.ts`, `lib/server/admin/repository.ts`
- Why fragile: Many service methods write the primary record first and insert the audit log second. If the audit insert fails after the mutation succeeds, the system state changes without the matching audit trail.
- Safe modification: Wrap mutation plus audit insert in the same transaction boundary for each admin write flow.
- Test coverage: There are no tests exercising partial-failure behavior around audit logging.

**Public pages silently degrade when data access fails:**
- Files: `app/page.tsx`, `app/results/page.tsx`, `app/drivers/page.tsx`, `app/drivers/[slug]/page.tsx`
- Why fragile: These pages catch data errors and substitute `null` or `[]`, which keeps rendering alive but hides backend outages and produces partially empty content with no operator signal.
- Safe modification: Distinguish between “no data” and “data fetch failed”, log failures server-side, and render explicit degraded-state messaging where appropriate.
- Test coverage: Existing page-flow tests mostly cover mocked happy paths in `tests/home-page.flow.spec.ts`, `tests/results-page.flow.spec.ts`, `tests/drivers-page.flow.spec.ts`, and `tests/driver-profile-page.flow.spec.ts`.

## Scaling Limits

**The import pipeline scales poorly with workbook size:**
- Current capacity: Current parser expectations are around one workbook with `89` events and `504` results, as asserted in `tests/history-parser.spec.ts`.
- Limit: Larger workbooks increase memory use and import duration linearly because parsing is fully in-memory and writes are row-by-row.
- Scaling path: Introduce chunked/bulk writes, stream parsing where possible, and profile import duration against larger historical datasets.

**Read traffic is coupled directly to Postgres with shallow caching:**
- Current capacity: Public pages revalidate every `120` seconds in `app/page.tsx`, `app/results/page.tsx`, `app/drivers/page.tsx`, and `app/drivers/[slug]/page.tsx`, and API routes call repository functions directly.
- Limit: Higher traffic or slower database response times will surface directly in page generation and API latency because there is no secondary cache or precomputed materialization layer in app code.
- Scaling path: Add cache layers for stable result/filter payloads, precompute expensive read models where necessary, and monitor query timings before traffic grows.

## Dependencies at Risk

**Operational scripts depend on Node experimental flags:**
- Risk: Import and bootstrap scripts rely on `--experimental-strip-types` and `--experimental-specifier-resolution=node`.
- Impact: Future Node upgrades can break script execution semantics even when the application code still builds.
- Migration plan: Replace experimental execution with compiled scripts, `tsx`, or another stable TypeScript runner and keep runtime assumptions explicit in `package.json`.

## Missing Critical Features

**There is no automated migration runner or schema drift gate:**
- Problem: Database changes are tracked as raw SQL files under `db/migrations/`, but applying them is a manual operational step documented in `README.md`.
- Blocks: Clean environment setup, repeatable deploys, and automatic detection that an environment is missing required migrations such as `007` or `008`.

**Server-side observability is minimal:**
- Problem: Public and admin API utilities return generic `500` responses without structured logging, and the DB health route suppresses the underlying error entirely.
- Blocks: Fast production debugging for failed requests, migration mismatches, and data outages.

## Test Coverage Gaps

**Admin mutation flows are largely untested:**
- What's not tested: CRUD/revert behavior for `users`, `championships`, `events`, `drivers`, aliases, audit listing, and live broadcast configuration.
- Files: `app/api/v1/admin/**/*.ts`, `lib/server/admin/service.ts`, `lib/server/admin/repository.ts`
- Risk: Regressions in authorization, dry-run behavior, audit integrity, and payload validation can ship unnoticed.
- Priority: High

**Operational scripts have no direct tests:**
- What's not tested: `npm run import:results`, `npm run bootstrap:admin`, rollback behavior, and seed/import interactions.
- Files: `scripts/import-results-xlsx.ts`, `scripts/bootstrap-admin-owner.ts`, `scripts/run-db-test.mjs`
- Risk: The most operationally sensitive flows are validated manually and can break only when needed in production or during data imports.
- Priority: High

**Negative-path UI behavior is weakly covered:**
- What's not tested: Error rendering for partial page failures, network failures in admin client components, and the inactive-driver filter path that is currently broken.
- Files: `app/page.tsx`, `app/results/page.tsx`, `app/drivers/page.tsx`, `app/drivers/[slug]/page.tsx`, `app/admin/_components/events-manager.tsx`, `app/admin/_components/roster-manager.tsx`, `app/admin/_components/users-manager.tsx`
- Risk: Outage handling and broken filters can remain invisible until a real user hits them.
- Priority: Medium

---

*Concerns audit: 2026-04-02*
