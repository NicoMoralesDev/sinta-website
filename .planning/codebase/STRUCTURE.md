# Codebase Structure

**Analysis Date:** 2026-04-02

## Directory Layout

```text
sinta-website/
├── app/                  # App Router pages, route handlers, UI components, and content
├── db/                   # SQL migrations for the Postgres schema
├── docs/                 # Developer-facing operational documentation
├── lib/                  # Server-only application modules and infrastructure
├── pages/                # Residual Pages Router endpoint (`pages/api/hello.ts`)
├── public/               # Static assets served by Next.js
├── scripts/              # CLI tooling for import, bootstrap, and DB test execution
├── tests/                # Vitest suites for pages, services, repositories, and DB integration
├── .skills/              # Repository-local agent skills and process guidance
├── .planning/codebase/   # Generated mapping documents for future planning
├── eslint.config.mjs     # ESLint flat config
├── next.config.js        # Next.js config
├── package.json          # Scripts and dependency manifest
└── tsconfig.json         # TypeScript config and path alias setup
```

## Directory Purposes

**`app/`:**
- Purpose: Main application tree for the Next.js App Router.
- Contains: Public pages, admin pages, API routes, reusable React components, global CSS, and static copy.
- Key files: `app/layout.tsx`, `app/page.tsx`, `app/results/page.tsx`, `app/drivers/[slug]/page.tsx`, `app/api/v1/_utils.ts`, `app/admin/_lib.ts`.

**`app/components/`:**
- Purpose: Shared public-facing UI components.
- Contains: Section components such as `app/components/hero.tsx`, `app/components/team.tsx`, and data-display components such as `app/components/event-participation-list.tsx`.
- Key files: `app/components/navbar.tsx`, `app/components/results.tsx`, `app/components/visualizations.tsx`.

**`app/content/`:**
- Purpose: Public site copy and presentation data.
- Contains: The bilingual `siteCopy` object and content-related types.
- Key files: `app/content/site-content.ts`.

**`app/admin/`:**
- Purpose: Private admin UI area.
- Contains: Route pages for dashboard, users, roster, championships, events, live stream, and audit; shared auth helpers; admin-only client components.
- Key files: `app/admin/_lib.ts`, `app/admin/page.tsx`, `app/admin/login/page.tsx`, `app/admin/events/page.tsx`.

**`app/admin/_components/`:**
- Purpose: Admin interaction components with local state and `fetch()`-based mutation flows.
- Contains: CRUD managers, auth controls, the admin shell, and small admin-only helpers.
- Key files: `app/admin/_components/admin-shell.tsx`, `app/admin/_components/events-manager.tsx`, `app/admin/_components/live-broadcast-manager.tsx`, `app/admin/_components/users-manager.tsx`.

**`app/api/`:**
- Purpose: App Router HTTP endpoints.
- Contains: Public `/api/v1` routes, admin `/api/v1/admin` routes, and the health endpoint in `app/api/health/db/route.ts`.
- Key files: `app/api/v1/results/events/route.ts`, `app/api/v1/admin/events/route.ts`, `app/api/v1/admin/_utils.ts`, `app/api/health/db/route.ts`.

**`lib/server/`:**
- Purpose: Server-only application logic and infrastructure.
- Contains: Database pooling, environment parsing, and domain modules split into `admin` and `history`.
- Key files: `lib/server/db.ts`, `lib/server/env.ts`, `lib/server/history/service.ts`, `lib/server/admin/service.ts`.

**`lib/server/history/`:**
- Purpose: Public read-model domain.
- Contains: Types, domain errors, workbook parser, import seeds, service-level query parsing, and repository SQL.
- Key files: `lib/server/history/types.ts`, `lib/server/history/parser.ts`, `lib/server/history/service.ts`, `lib/server/history/repository.ts`.

**`lib/server/admin/`:**
- Purpose: Admin auth and write-model domain.
- Contains: Session/token logic, admin-specific errors and DTOs, business rules, and transactional SQL.
- Key files: `lib/server/admin/auth.ts`, `lib/server/admin/types.ts`, `lib/server/admin/service.ts`, `lib/server/admin/repository.ts`.

**`db/migrations/`:**
- Purpose: Ordered SQL schema evolution.
- Contains: Base results schema, views, admin auth tables, role refactor, event stream columns, and live broadcast config.
- Key files: `db/migrations/001_results_schema.sql`, `db/migrations/004_admin_auth_softdelete_audit.sql`, `db/migrations/006_users_roles_refactor.sql`, `db/migrations/008_live_broadcast_config.sql`.

**`scripts/`:**
- Purpose: Node entry points for operational workflows outside HTTP requests.
- Contains: Historical XLSX import, owner bootstrap, and DB integration test launcher.
- Key files: `scripts/import-results-xlsx.ts`, `scripts/bootstrap-admin-owner.ts`, `scripts/run-db-test.mjs`.

**`tests/`:**
- Purpose: Automated verification for rendering flows, service parsing, repositories, auth, and DB integration.
- Contains: Vitest specs named by feature or layer.
- Key files: `tests/home-page.flow.spec.ts`, `tests/history-service-v2.spec.ts`, `tests/history-repository.spec.ts`, `tests/db.integration.spec.ts`.

**`docs/`:**
- Purpose: Supplementary human-written operational notes.
- Contains: Admin dashboard guidance, import guide, and deferred roadmap notes.
- Key files: `docs/admin-dashboard.md`, `docs/data-import.md`, `docs/future-features.md`.

**`pages/`:**
- Purpose: Legacy Pages Router residue.
- Contains: Only the example endpoint `pages/api/hello.ts`.
- Key files: `pages/api/hello.ts`.

## Key File Locations

**Entry Points:**
- `app/layout.tsx`: Root layout for all App Router pages.
- `app/page.tsx`: Home route entry point.
- `app/results/page.tsx`: Results hub route entry point.
- `app/drivers/page.tsx`: Driver index route entry point.
- `app/drivers/[slug]/page.tsx`: Driver profile route entry point.
- `app/admin/page.tsx`: Admin dashboard entry point.
- `app/admin/login/page.tsx`: Admin login entry point.
- `app/api/v1/**/route.ts`: HTTP entry points for public and admin APIs.
- `scripts/import-results-xlsx.ts`: CLI entry point for historical data import.
- `scripts/bootstrap-admin-owner.ts`: CLI entry point for first-owner bootstrap.

**Configuration:**
- `package.json`: Runtime scripts and dependency manifest.
- `tsconfig.json`: TS strictness, path alias (`@/*`), and App Router include set.
- `next.config.js`: Minimal Next.js runtime config.
- `eslint.config.mjs`: Shared lint config.

**Core Logic:**
- `lib/server/history/service.ts`: Public read-use-case orchestration and query parsing.
- `lib/server/history/repository.ts`: Public SQL and row mapping.
- `lib/server/admin/service.ts`: Admin validation, authorization, dry-run rules, and orchestration.
- `lib/server/admin/repository.ts`: Admin SQL, transactions, and audit persistence.
- `lib/server/db.ts`: Shared pg pool singleton.
- `lib/server/env.ts`: Environment validation for `DATABASE_URL`.

**Testing:**
- `tests/*.spec.ts`: Main automated test suite.
- `scripts/run-db-test.mjs`: Wrapper for the DB integration test only.

## Naming Conventions

**Files:**
- Route files follow Next.js conventions: `page.tsx`, `layout.tsx`, and `route.ts`.
- Shared domain modules use stable role-based names: `service.ts`, `repository.ts`, `types.ts`, `errors.ts`, `auth.ts`.
- Public components use lowercase hyphenated filenames such as `app/components/event-participation-list.tsx`.
- Admin component filenames are also lowercase hyphenated, for example `app/admin/_components/live-broadcast-manager.tsx`.
- Scripts use hyphenated CLI-oriented names such as `scripts/import-results-xlsx.ts`.
- SQL migrations use ordered numeric prefixes: `db/migrations/001_results_schema.sql` through `db/migrations/008_live_broadcast_config.sql`.

**Directories:**
- Route segment directories mirror URLs, for example `app/results/`, `app/drivers/[slug]/`, and `app/api/v1/admin/events/`.
- Internal-only route helpers use underscore-prefixed folders or files: `app/admin/_components/`, `app/admin/_lib.ts`, `app/api/v1/_utils.ts`, `app/api/v1/admin/_utils.ts`.
- Server domain directories live under `lib/server/<domain>/`, currently `lib/server/history/` and `lib/server/admin/`.

## Where to Add New Code

**New public page or route:**
- Primary code: Add a new route segment under `app/`, for example `app/<route>/page.tsx` or `app/<route>/<child>/page.tsx`.
- Tests: Add a rendering or flow spec under `tests/`, following the existing naming style such as `tests/<feature>-page.flow.spec.ts`.
- Notes: Keep data loading in the server page and call `lib/server/history/service.ts` directly if the page is server-rendered.

**New public API endpoint:**
- Implementation: Add `app/api/v1/<resource>/route.ts` or a nested route directory.
- Shared helpers: Reuse `app/api/v1/_utils.ts` for JSON success/error responses.
- Domain logic: Add or extend logic in `lib/server/history/service.ts` and `lib/server/history/repository.ts` instead of placing SQL inside the route handler.

**New admin page:**
- Page file: Add `app/admin/<feature>/page.tsx`.
- Shared guard logic: Reuse `app/admin/_lib.ts`.
- Interactive UI: Place client-side managers in `app/admin/_components/`.
- Mutation endpoints: Add `app/api/v1/admin/<resource>/route.ts` or a nested route under that tree.

**New admin mutation or admin API resource:**
- Route adapter: `app/api/v1/admin/<resource>/route.ts`.
- Authorization and validation: `lib/server/admin/service.ts`.
- Persistence and transactions: `lib/server/admin/repository.ts`.
- Types: `lib/server/admin/types.ts`.
- Notes: Follow the existing split where route handlers stay thin and all role checks happen in service code.

**New shared public UI component:**
- Implementation: `app/components/<component-name>.tsx`.
- Content dependencies: Read strings from `app/content/site-content.ts` when the component is part of the public bilingual experience.
- Notes: Keep client-only behavior opt-in with `"use client"` only when hooks or browser APIs are required.

**New admin UI component:**
- Implementation: `app/admin/_components/<component-name>.tsx`.
- Notes: Use `"use client"` for interactive managers that call `fetch()` and `router.refresh()`. Keep page files in `app/admin/**/page.tsx` server-rendered.

**New server-side read logic for the public site:**
- Validation/orchestration: `lib/server/history/service.ts`.
- Query SQL: `lib/server/history/repository.ts`.
- DTOs: `lib/server/history/types.ts`.
- Errors: `lib/server/history/errors.ts` if a new domain error class is justified.

**New server-side write or auth logic for admin:**
- Validation/orchestration: `lib/server/admin/service.ts`.
- Auth/session work: `lib/server/admin/auth.ts`.
- Query SQL and transactions: `lib/server/admin/repository.ts`.
- DTOs: `lib/server/admin/types.ts`.

**Database schema changes:**
- Migration: Add the next numbered SQL file under `db/migrations/`.
- Code updates: Reflect schema changes in both repository modules if they touch shared entities.
- Verification: Extend `tests/history-repository.spec.ts`, `tests/db.integration.spec.ts`, or the relevant admin/history specs.

**Operational scripts:**
- Implementation: `scripts/<task>.ts` or `scripts/<task>.mjs`.
- Shared reuse: Import existing parser, DB, and domain helpers from `lib/server/**` rather than duplicating connection logic.

## Special Directories

**`public/`:**
- Purpose: Static files exposed directly by Next.js.
- Generated: No.
- Committed: Yes.

**`db/migrations/`:**
- Purpose: Source-of-truth schema changes for Postgres.
- Generated: No.
- Committed: Yes.

**`tests/`:**
- Purpose: Automated checks used by `npm run test` and `npm run test:db`.
- Generated: No.
- Committed: Yes.

**`.planning/codebase/`:**
- Purpose: Generated repository maps for planning workflows.
- Generated: Yes.
- Committed: Typically yes if the workflow expects persistent planning context.

**`.skills/`:**
- Purpose: Repository-local agent instructions referenced by `AGENTS.md`.
- Generated: No.
- Committed: Yes.

**`pages/`:**
- Purpose: Legacy compatibility area from the Pages Router.
- Generated: No.
- Committed: Yes.
- Notes: Do not add new APIs here unless maintaining the existing `pages/api/hello.ts` pattern is explicitly required; prefer `app/api/**`.

## Structure Rules For Future Work

- Keep route concerns in `app/**` and keep business logic out of page and route files.
- Put new SQL in repository modules under `lib/server/**/repository.ts`, not in components or route handlers.
- Add public read features to the `history` domain unless the feature is admin-only.
- Add write features, audit behavior, or auth-sensitive features to the `admin` domain.
- Keep bilingual site text centralized in `app/content/site-content.ts` rather than scattering literals across public components.
- Preserve the underscore convention for route-local helpers: `app/admin/_components/`, `app/admin/_lib.ts`, and `app/api/v1/_utils.ts`.
- Treat `pages/api/hello.ts` as legacy residue, not the default place for new endpoints.

---

*Structure analysis: 2026-04-02*
