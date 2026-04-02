---
phase: 01-results-contract-ordering-and-championship-metadata
plan: 01
subsystem: database
tags: [postgres, vitest, typescript, results-contract, organizer-metadata]
requires:
  - phase: 01-00
    provides: Wave 0 migration coverage and contract scaffolds for canonical results metadata
provides:
  - Canonical session_kind migration with qs/s/qf/f/p storage support
  - DB-backed verification for enum remap, organizer_name, and points-safe constraints
  - Shared canonical result field contracts and organizer metadata types
affects:
  - 01-02-PLAN.md
  - 01-03-PLAN.md
tech-stack:
  added: []
  patterns:
    - Replacement enum migration verified through isolated schema integration tests
    - Shared canonical result field constants reused across history and admin contracts
key-files:
  created:
    - db/migrations/009_canonical_results_contract.sql
    - .planning/phases/01-results-contract-ordering-and-championship-metadata/01-01-SUMMARY.md
  modified:
    - tests/results-contract-migration.spec.ts
    - lib/server/history/types.ts
    - lib/server/admin/types.ts
    - lib/server/admin/repository.ts
    - lib/server/admin/service.ts
    - lib/server/history/repository.ts
    - tests/home-page.flow.spec.ts
key-decisions:
  - "Use a replacement session_kind_v2 enum migration path so legacy primary/secondary rows remap cleanly to s/f while canonical labels remain exact."
  - "Keep AdminEventResultRow legacy-typed for now and add canonical input aliases separately so Phase 1 contract work does not force premature admin editor rewrites."
  - "Thread organizerName through existing typed mappers immediately so the new contract remains type-safe before repository and route behavior changes land in later plans."
patterns-established:
  - "DB-backed schema tests should precreate schema-local enum types when baseline migrations use global pg_type existence checks."
  - "Constraint catalog assertions should validate semantic intent instead of exact pg_get_constraintdef formatting."
requirements-completed: [DATA-01, DATA-04]
duration: 20min
completed: 2026-04-02
---

# Phase 01 Plan 01: Schema Contract Summary

**Canonical qs/s/qf/f/p storage, championship organizer_name schema support, and shared result field contracts verified against Postgres**

## Performance

- **Duration:** 20 min
- **Started:** 2026-04-02T16:40:24Z
- **Completed:** 2026-04-02T16:59:55Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Added `009_canonical_results_contract.sql` to replace the legacy two-value enum with canonical `qs`, `s`, `qf`, `f`, and `p`, preserve legacy row remaps, and add `championships.organizer_name`.
- Turned the Wave 0 migration scaffold into a real DB-backed integration spec that validates enum labels, row remapping, points-safe numeric constraints, and organizer column presence against a live Postgres schema.
- Published shared canonical result field contracts in history/admin types and threaded `organizerName` through the existing typed championship mappers needed to keep TypeScript green.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create the canonical results migration** - `e8a1418` (feat)
2. **Task 2: Publish shared canonical result and organizer types** - `f1a5b26` (feat)

## Files Created/Modified

- `db/migrations/009_canonical_results_contract.sql` - Replacement enum migration plus `organizer_name` schema addition.
- `tests/results-contract-migration.spec.ts` - Live Postgres verification for enum remap, canonical inserts, and constraint behavior.
- `lib/server/history/types.ts` - Shared canonical field constants/types and organizer metadata on championship-facing public contracts.
- `lib/server/admin/types.ts` - Admin canonical input aliases plus organizer metadata contract.
- `lib/server/admin/repository.ts` - Typed championship mapping now carries `organizerName`.
- `lib/server/admin/service.ts` - Dry-run championship payload now matches the updated admin contract.
- `lib/server/history/repository.ts` - Result filters and current championship summary now expose typed `organizerName`.
- `tests/home-page.flow.spec.ts` - Current championship fixture updated for the organizer-aware contract.

## Decisions Made

- Used a replacement enum migration rather than in-place enum renames so the schema ends with the exact canonical label set while preserving deterministic legacy remapping.
- Kept the current admin read row shape on legacy session kinds and limited canonical widening to shared contracts and input aliases in this plan.
- Extended the existing repository/test mappers for `organizerName` immediately because leaving them behind would break the repo’s typed contract surface before Phase 2/3 behavior work starts.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Isolated migration test was resolving the shared public enum instead of schema-local types**
- **Found during:** Task 1
- **Issue:** The DB-backed migration test created tables in a temporary schema, but the baseline migration's global `pg_type` existence checks caused `event_results.session_kind` to bind to the shared `public` enum, making the replacement-type drop fail during verification.
- **Fix:** Precreated schema-local `result_status` and `session_kind` enums in the test harness before applying the baseline migrations.
- **Files modified:** `tests/results-contract-migration.spec.ts`
- **Verification:** `RUN_DB_INTEGRATION_TESTS=1 node --env-file=.env ./node_modules/vitest/vitest.mjs run tests/results-contract-migration.spec.ts`
- **Committed in:** `e8a1418`

**2. [Rule 1 - Bug] Constraint verification depended on brittle pg_get_constraintdef formatting**
- **Found during:** Task 1
- **Issue:** The migration spec expected exact `pg_get_constraintdef` strings, but Postgres rewrote quoted identifiers and enum casts differently from the literal expectation.
- **Fix:** Normalized constraint definitions and asserted the intended semantic clauses instead of exact text output.
- **Files modified:** `tests/results-contract-migration.spec.ts`
- **Verification:** `RUN_DB_INTEGRATION_TESTS=1 node --env-file=.env ./node_modules/vitest/vitest.mjs run tests/results-contract-migration.spec.ts`
- **Committed in:** `e8a1418`

**3. [Rule 3 - Blocking] Organizer contract changes broke existing typed championship mappers**
- **Found during:** Task 2
- **Issue:** Adding required `organizerName` fields to the shared contracts caused `tsc --noEmit` failures in the current admin/history repositories and one current-championship test fixture.
- **Fix:** Threaded `organizer_name` through the existing repository row mappers, updated the admin dry-run response, and aligned the home-page fixture. Also kept the admin result row type legacy-compatible until the later behavior plans widen it.
- **Files modified:** `lib/server/admin/repository.ts`, `lib/server/admin/service.ts`, `lib/server/admin/types.ts`, `lib/server/history/repository.ts`, `tests/home-page.flow.spec.ts`
- **Verification:** `npm run typecheck`
- **Committed in:** `f1a5b26`

---

**Total deviations:** 3 auto-fixed (1 bug, 2 blocking)
**Impact on plan:** All deviations were direct correctness or execution blockers caused by the planned schema/type work. No scope creep beyond keeping the contract testable and type-safe.

## Issues Encountered

- The configured database was initially unreachable inside the sandbox, so DB-backed verification had to be rerun with network access to the Supabase host.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 1 now has a live schema target and shared canonical field contracts for admin/history work.
- Plan 01-02 can widen admin persistence using the committed canonical field aliases and organizer-aware championship contracts.
- Parser/import widening remains intentionally deferred until a committed canonical workbook fixture exists.

## Self-Check: PASSED

- Found `.planning/phases/01-results-contract-ordering-and-championship-metadata/01-01-SUMMARY.md`.
- Found task commits `e8a1418` and `f1a5b26` in `git log --oneline --all`.

---
*Phase: 01-results-contract-ordering-and-championship-metadata*
*Completed: 2026-04-02*
