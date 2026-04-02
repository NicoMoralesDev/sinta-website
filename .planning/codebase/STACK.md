# Technology Stack

**Analysis Date:** 2026-04-02

## Languages

**Primary:**
- TypeScript 5.9.3 - Application code, API routes, server modules, tests, and scripts in `app/`, `lib/server/`, `tests/`, and `scripts/import-results-xlsx.ts`.

**Secondary:**
- SQL - Schema and migration source in `db/migrations/001_results_schema.sql`, `db/migrations/007_events_live_stream.sql`, and `db/migrations/008_live_broadcast_config.sql`.
- CSS - Global styling and design tokens in `app/globals.css`.
- JavaScript (ESM/CommonJS config) - Tooling config in `next.config.js`, `postcss.config.js`, `eslint.config.mjs`, and `scripts/run-db-test.mjs`.

## Runtime

**Environment:**
- Node.js 22.x - enforced by `package.json`, `.nvmrc`, and `.node-version`.
- Next.js route handlers explicitly opt into the Node runtime in `app/api/health/db/route.ts` and the `app/api/v1/**/route.ts` tree.

**Package Manager:**
- npm - primary workflow documented in `README.md` and backed by `package-lock.json`.
- pnpm - `pnpm-lock.yaml` is committed, but no pnpm-specific scripts or docs are present.
- Lockfile: present (`package-lock.json`, `pnpm-lock.yaml`)

## Frameworks

**Core:**
- Next.js 16.1.6 - App Router UI, route handlers, metadata, and server rendering in `app/layout.tsx`, `app/page.tsx`, and `app/api/v1/**/route.ts`.
- React 19.2.4 - component model for public pages and admin UI in `app/components/` and `app/admin/_components/`.
- Tailwind CSS 4.1.18 - utility styling loaded through `@import "tailwindcss"` in `app/globals.css` and PostCSS in `postcss.config.js`.

**Testing:**
- Vitest 3.2.4 - unit and flow-style tests configured in `vitest.config.ts` and stored under `tests/*.spec.ts`.

**Build/Dev:**
- Next CLI - local dev, production build, and start commands in `package.json`.
- ESLint 9.39.2 with `eslint-config-next` 16.1.6 - linting in `eslint.config.mjs`.
- TypeScript compiler (`tsc --noEmit`) - static type checking via the `typecheck` script in `package.json`.
- PostCSS 8.5.6 with `@tailwindcss/postcss` 4.1.18 - CSS processing in `postcss.config.js`.
- Prettier - formatting conventions defined in `.prettierrc.json`.

## Key Dependencies

**Critical:**
- `next` 16.1.6 - application framework and server runtime boundary for `app/` and `app/api/`.
- `react` 19.2.4 and `react-dom` 19.2.4 - rendering and server-side markup in components and tests such as `tests/home-page.flow.spec.ts`.
- `pg` ^8.16.3 - direct PostgreSQL access in `lib/server/db.ts`, `lib/server/history/repository.ts`, `lib/server/admin/repository.ts`, and `scripts/import-results-xlsx.ts`.

**Infrastructure:**
- `tailwindcss` 4.1.18 and `@tailwindcss/postcss` 4.1.18 - styling pipeline in `app/globals.css` and `postcss.config.js`.
- `lucide-react` 0.554.0 - icon set used throughout `app/components/` and `app/admin/_components/`.
- `flag-icons` 7.5.0 - country flag CSS imported in `app/globals.css`.
- `@types/pg` ^8.15.6, `@types/node` 25.2.3, `@types/react` 19.2.14, `@types/react-dom` 19.2.3 - type support for the runtime stack.

## Configuration

**Environment:**
- Runtime env access is centralized for the database in `lib/server/env.ts` and `lib/server/db.ts`.
- Admin runtime flags and secrets are read in `lib/server/admin/auth.ts`.
- Bootstrap/import scripts rely on env-backed configuration in `scripts/bootstrap-admin-owner.ts`, `scripts/run-db-test.mjs`, and `package.json` scripts using `node --env-file=.env`.
- `.env.example` is present for local setup, and `README.md` documents the required variables without embedding them into code.

**Build:**
- `next.config.js` enables `reactStrictMode`.
- `tsconfig.json` uses strict mode, `moduleResolution: "bundler"`, and the `@/*` path alias.
- `eslint.config.mjs`, `vitest.config.ts`, `postcss.config.js`, and `.prettierrc.json` define local tooling behavior.

## Platform Requirements

**Development:**
- Node.js 22.x with npm installed, as documented in `README.md`.
- A reachable PostgreSQL-compatible database for API routes and scripts, validated by `lib/server/env.ts` and exercised by `app/api/health/db/route.ts`.
- SQL migrations in `db/migrations/` must be applied before using history or admin features, per `README.md`.

**Production:**
- A Node-capable Next.js hosting target. The repo is aligned to Vercel-style deployment in `README.md`, and route handlers use `runtime = "nodejs"` in `app/api/health/db/route.ts` and `app/api/v1/**/route.ts`.
- PostgreSQL access with conservative pooling for serverless-style environments, configured in `lib/server/db.ts`.

---

*Stack analysis: 2026-04-02*
