---
phase: 02-admin-results-and-championship-editing
plan: 01
subsystem: api
tags: [admin, results, nextjs, vitest, postgres]
requires:
  - phase: 01-results-contract-ordering-and-championship-metadata
    provides: canonical result fields, legacy alias normalization, preserve-on-save groundwork
provides:
  - Canonical admin results-grid metadata with ordered `qs`, `s`, `qf`, `f`, and `p` cells
  - Dirty result patch writes with explicit clear tombstones and points-safe validation
affects: [02-02-PLAN.md, admin UI, public results consumers]
tech-stack:
  added: []
  patterns: [metadata-driven admin grid contracts, explicit clear tombstones, merge-before-replace result writes]
key-files:
  created: []
  modified:
    - lib/server/admin/types.ts
    - lib/server/admin/repository.ts
    - lib/server/admin/service.ts
    - tests/admin-event-results-contract.spec.ts
    - tests/admin-event-results-preserve.spec.ts
key-decisions:
  - "Expose canonical admin result columns through fieldOrder and fieldLabels so the next UI plan can render five columns without local guesses."
  - "Model user clears as inactive empty tombstones in the service layer, then delete rows omitted from the merged snapshot during repository replacement."
patterns-established:
  - "Admin results GET returns canonical metadata plus sparse per-driver result maps keyed by canonical field."
  - "Admin results PUT preserves untouched rows by merging persisted data first and removes only rows explicitly cleared by the user."
requirements-completed: [ADMIN-01, ADMIN-02]
duration: 7min
completed: 2026-04-02
---

# Phase 2 Plan 01: Admin Results Contract Summary

**Canonical admin results grid metadata and clear-aware dirty cell writes for `QS`, `S`, `QF`, `F`, and `P`**

## Performance

- **Duration:** 7 min
- **Started:** 2026-04-02T18:25:06Z
- **Completed:** 2026-04-02T18:31:36Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Widened the admin results GET contract to return canonical field order, friendly labels, and sparse per-driver canonical result maps.
- Kept dirty save semantics safe by merging sparse patches with persisted rows and treating explicit clear tombstones as deletions.
- Added regression coverage for widened GET payloads, preserved untouched rows, explicit clears, and points-only validation rules.

## Task Commits

Each task was committed atomically:

1. **Task 1: Publish a canonical admin results-grid contract** - `6788425` (test), `5dbbc7c` (feat)
2. **Task 2: Support dirty cell patches and explicit clears safely** - `0cf2e3b` (test), `c26ccdc` (feat)

**Plan metadata:** Pending until the final docs commit is created.

## Files Created/Modified
- `lib/server/admin/types.ts` - Added canonical grid metadata and sparse per-driver results map types.
- `lib/server/admin/repository.ts` - Loaded canonical grid fields and labels, and made row replacement delete stale event result rows.
- `lib/server/admin/service.ts` - Validated clear tombstones, enforced points semantics, and removed cleared rows during merge.
- `tests/admin-event-results-contract.spec.ts` - Covered GET contract metadata, route clear tombstones, and points validation failures.
- `tests/admin-event-results-preserve.spec.ts` - Covered preserve-on-omit behavior and explicit canonical row removal.

## Decisions Made

- Use repository-provided `fieldOrder` and `fieldLabels` as the single source of truth for the upcoming five-column admin editor.
- Keep save safety in the service layer by merging sparse patches with persisted rows before replacement, instead of trusting partial PUT payloads as full snapshots.
- Keep points validation distinct from race-session validation so `p` accepts integer values `>= 0` only and never accepts status tokens.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan `02-02` can consume `fieldOrder`, `fieldLabels`, and sparse canonical `results` directly when widening the admin UI.
- The backend now distinguishes unchanged, changed, and cleared cells cleanly, so the next UI plan can submit only intentional edits.

## Self-Check: PASSED

- Found `.planning/phases/02-admin-results-and-championship-editing/02-01-SUMMARY.md`
- Verified task commits `6788425`, `5dbbc7c`, `0cf2e3b`, and `c26ccdc` in `git log --oneline --all`
