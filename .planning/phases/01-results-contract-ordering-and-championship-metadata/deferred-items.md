# Deferred Items

## 2026-04-02

- `npm run typecheck` currently fails in the admin results/championship path (`lib/server/admin/service.ts`, `lib/server/admin/types.ts`, `tests/admin-event-results-contract.spec.ts`, `tests/admin-event-results-preserve.spec.ts`, `tests/championship-organizer.spec.ts`).
- These failures are out of scope for `01-03` because they belong to the unfinished admin plan `01-02`. The public-read verification for `01-03` is green.
