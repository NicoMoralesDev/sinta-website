---
phase: 01-results-contract-ordering-and-championship-metadata
plan: 03
subsystem: api
tags: [postgres, vitest, nextjs, results-contract, public-read]
requires:
  - phase: 01-00
    provides: Wave 0 public-read scaffolds for canonical ordering and organizer payload coverage
  - phase: 01-01
    provides: Canonical session_kind storage and organizer-aware history contracts
provides:
  - Canonical public result mapping with `qs/s/qf/f/p` session labels and order
  - Points-first participant ordering with final-race fallback for legacy rows
  - Race-only aggregate filters for public history stats and leaderboard reads
affects:
  - 01-02-PLAN.md
  - Phase 3 public organizer display
  - Phase 4 event share image DTOs
tech-stack:
  added: []
  patterns:
    - History repository owns participant ordering and race-only aggregate semantics
    - Public results consumer derives visible columns from stored session data only
key-files:
  created:
    - .planning/phases/01-results-contract-ordering-and-championship-metadata/01-03-SUMMARY.md
    - .planning/phases/01-results-contract-ordering-and-championship-metadata/deferred-items.md
  modified:
    - lib/server/history/repository.ts
    - lib/server/history/types.ts
    - app/components/event-participation-list.tsx
    - tests/history-repository.spec.ts
    - tests/history-api.spec.ts
    - tests/history-api-v2.spec.ts
    - tests/results-page.flow.spec.ts
key-decisions:
  - "Sort public participants by points first, then fall back to final-race position and driver name for legacy rows without points."
  - "Keep organizerName DTO-compatible on public payloads in this plan, but leave display polish to the later public-surface phase."
  - "Preserve compatibility with lingering legacy primary/secondary values by treating them as aliases for s/f ordering on the public consumer path."
patterns-established:
  - "Canonical session ordering is defined explicitly instead of relying on lexical sort."
  - "Public race aggregates must filter to `session_kind = 'f'` before counting positions or averages."
requirements-completed: [DATA-03, DATA-04]
duration: 6min
completed: 2026-04-02
---

# Phase 01 Plan 03: Public Read Contract Summary

**Canonical public results now read `qs/s/qf/f/p` safely, rank participants by points first, and keep race-only stats scoped to final-race rows**

## Performance

- **Duration:** 6 min
- **Started:** 2026-04-02T17:17:49Z
- **Completed:** 2026-04-02T17:23:58Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Updated the history repository to expose canonical session labels/order, rank event participants by points with a final-race fallback, and keep public race aggregates filtered to `session_kind = 'f'`.
- Turned the Wave 0 repository, route, and page-flow scaffolds into real regression coverage for points-first ordering, canonical payload exposure, sparse historical omission, and `organizerName` compatibility.
- Adjusted the existing public results consumer with the minimal change needed to render canonical `qs/s/qf/f/p` columns while continuing to omit columns that were never stored for historical events.

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement canonical public result mapping and points-first ordering** - `c975d79` (test)
2. **Task 1: Implement canonical public result mapping and points-first ordering** - `b430dfe` (feat)
3. **Task 2: Align the public route and page consumer with canonical column order** - `c0e195b` (test)
4. **Task 2: Align the public route and page consumer with canonical column order** - `a2f8420` (feat)

_Note: This plan used TDD commits for both tasks (test → feat)._

## Files Created/Modified

- `.planning/phases/01-results-contract-ordering-and-championship-metadata/deferred-items.md` - Logged the out-of-scope admin typecheck failures discovered during close-out.
- `lib/server/history/repository.ts` - Canonical session label/order mapping, points-first participant sorting, and explicit race-only aggregate filters.
- `lib/server/history/types.ts` - Extended public session typing to accept canonical kinds while remaining compatible with legacy aliases.
- `app/components/event-participation-list.tsx` - Canonical `qs/s/qf/f/p` column ordering for the existing public results table.
- `tests/history-repository.spec.ts` - Real coverage for points ordering, final-race fallback, race-only aggregate filtering, and organizer metadata mapping.
- `tests/history-api.spec.ts` - Public route coverage for canonical result payloads and sparse historical participation payloads.
- `tests/history-api-v2.spec.ts` - Current championship route coverage for `organizerName`.
- `tests/results-page.flow.spec.ts` - Rendered public-flow coverage for canonical column order, sparse omission, and organizer-aware DTO compatibility.

## Decisions Made

- Centralized points-first ordering in the repository instead of leaving ranking to page-level inference.
- Kept organizer metadata flowing through public payloads now, but deferred any page copy or display changes to the later public presentation phase.
- Supported legacy `primary`/`secondary` aliases in ordering helpers so public consumers remain stable while Phase 1 admin work is still in progress.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `npm run typecheck` currently fails in the admin results/championship path, which is outside `01-03` scope and aligns with the still-incomplete `01-02` work. The failures were logged in `.planning/phases/01-results-contract-ordering-and-championship-metadata/deferred-items.md`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Public results reads now match the widened canonical contract and can be consumed consistently by later UI polish and share-image work.
- The remaining Phase 1 gap is the admin-side `01-02` work, which also owns the current out-of-scope typecheck failures.

## Self-Check: PASSED

- Found `.planning/phases/01-results-contract-ordering-and-championship-metadata/01-03-SUMMARY.md`.
- Found task commits `c975d79`, `b430dfe`, `c0e195b`, and `a2f8420` in `git log --oneline --all`.

---
*Phase: 01-results-contract-ordering-and-championship-metadata*
*Completed: 2026-04-02*
