# SINTA Website

## Runtime

- Node.js `22.x`
- npm
- Next.js `16.1.6`
- React `19.2.4`
- Public pages and public APIs use 120-second caching via `revalidate = 120` or `Cache-Control: public, s-maxage=120, stale-while-revalidate=600`
- Admin APIs always return `Cache-Control: no-store`

## Local setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env` from `.env.example`.
3. Configure `DATABASE_URL` and the required `ADMIN_*` variables.
4. Start the local app:
   ```bash
   npm run dev
   ```

Required environment variables:

```bash
DATABASE_URL=postgresql://postgres.<project-ref>:<url-encoded-password>@aws-0-us-west-2.pooler.supabase.com:<5432-or-6543>/postgres?sslmode=require
ADMIN_SESSION_SECRET=replace-with-long-random-secret
ADMIN_PASSWORD_PEPPER=replace-with-long-random-pepper
ADMIN_DEV_DRY_RUN=1
ADMIN_ENABLE_IN_DEV=1
ADMIN_BOOTSTRAP_USERNAME=owner
ADMIN_BOOTSTRAP_PASSWORD=replace-with-temporary-password
```

Primary scripts:

```bash
npm run dev
npm run build
npm run start
npm run import:results
npm run bootstrap:admin
```

## Verification

Run the default maintainers' checks:

```bash
npm run lint
npm run typecheck
npx vitest run tests/admin-events-manager.flow.spec.ts tests/admin-championships-manager.flow.spec.ts tests/results-page.flow.spec.ts tests/history-share-image-route.spec.ts tests/championship-organizer.spec.ts tests/history-repository.spec.ts
```

`npm run test` is not a clean fresh-checkout gate because `tests/history-parser.spec.ts` depends on `data-source/Historia The New Project.xlsx`, which is not committed to the repository.

## Workflow docs

- [Results model](docs/results-model.md)
- [Admin dashboard](docs/admin-dashboard.md)
- [Data import](docs/data-import.md)

## Operational notes

- Apply database migrations in order through `db/migrations/009_canonical_results_contract.sql` before running admin or history workflows.
- Public `/results` sharing uses the `/api/v1/results/events/:eventId/image` route family, including optional `driver=<slug>` and `lang=en` query parameters.
- In development, admin write flows default to dry-run mode when `ADMIN_DEV_DRY_RUN=1`; keep that enabled until you intend to persist changes.
