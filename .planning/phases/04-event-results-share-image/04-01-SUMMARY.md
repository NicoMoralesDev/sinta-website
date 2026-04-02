---
phase: 04-event-results-share-image
plan: 01
subsystem: api
tags: [nextjs, image-response, vitest, react, postgres]
requires:
  - phase: 03-public-results-organizer-display-and-driver-stats-correctness
    provides: public event participation cards with canonical ordering and organizer-safe results rendering
provides:
  - shared event participation helpers for page and image parity
  - one-event public history lookup by event id
  - cacheable ImageResponse route for public event share images
affects: [04-02-PLAN.md, results page sharing UI, documentation]
tech-stack:
  added: []
  patterns: [shared presentation helpers, one-event DTO reuse, nodejs ImageResponse route]
key-files:
  created:
    - app/components/event-participation-helpers.ts
    - app/api/v1/results/events/[id]/image/route.ts
    - tests/history-share-image-route.spec.ts
  modified:
    - app/components/event-participation-list.tsx
    - lib/server/history/service.ts
    - lib/server/history/repository.ts
    - tests/results-page.flow.spec.ts
key-decisions:
  - "Reuse the existing EventParticipationCard mapping path for by-id reads instead of introducing a second event-results DTO."
  - "Keep the share image renderer route-local with inline styles and createElement calls so route.ts stays compatible with the current Next.js 16.1.6 toolchain."
patterns-established:
  - "Shared helper modules should own canonical event-result column discovery and display formatting when multiple surfaces need parity."
  - "Public image generation should call the history service directly and keep explicit cache headers at the route boundary."
requirements-completed: [SHARE-02]
duration: 7min
completed: 2026-04-02
---

# Phase 4 Plan 1: Event Results Share Image Summary

**Shared event-participation helpers plus a cacheable one-event ImageResponse route that preserves canonical columns and points-based ordering**

## Performance

- **Duration:** 7 min
- **Started:** 2026-04-02T20:33:36Z
- **Completed:** 2026-04-02T20:40:48Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Extracted the public event-participation formatting contract into a pure helper module and reused it from the existing results list.
- Added a validated one-event history lookup that reuses the existing repository-to-card mapping path.
- Built a public `ImageResponse` route with explicit cache headers and dense-table height growth, then locked it with targeted coverage.

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract the public event-participation helper contract for page and image reuse** - `2c2475b` (test), `deab61f` (feat), `1be124b` (test)
2. **Task 2: Add the one-event public image route on top of the existing history domain** - `157a8a4` (test), `169a6be` (feat)

**Plan metadata:** recorded in the accompanying docs commit for this summary/state update.

## Files Created/Modified

- `app/components/event-participation-helpers.ts` - Pure shared helper contract for session ordering, labels, and formatted values.
- `app/components/event-participation-list.tsx` - Reused the helper module and added an optional event-header action slot.
- `lib/server/history/repository.ts` - Added one-event active public lookup that feeds the existing event-results mapping pipeline.
- `lib/server/history/service.ts` - Added validated `getResultsEventParticipationById(...)` service access.
- `app/api/v1/results/events/[id]/image/route.ts` - Node-runtime image route with inline-styled `ImageResponse` rendering and public cache headers.
- `tests/history-share-image-route.spec.ts` - Route coverage for 200/400/404 flows, helper parity, order preservation, and dense height growth.
- `tests/results-page.flow.spec.ts` - Task-1 RED coverage plus typed helper fixture assertions.

## Decisions Made

- Reused `toEventResultItems(...)` plus `toParticipationCards(...)` for the by-id read so page and image surfaces stay on the same data path.
- Kept image composition route-local and inline-styled instead of importing page JSX or Tailwind classes, matching the planned `ImageResponse` constraints.
- Left `/results` share-trigger wiring for plan `04-02`; this plan only adds the reusable helper contract and backend route foundation.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Replaced JSX with createElement in the image route**
- **Found during:** Task 2 (Add the one-event public image route on top of the existing history domain)
- **Issue:** `route.ts` failed to compile because the repo uses `.ts` route files and the initial `ImageResponse` JSX tree was not valid in that file.
- **Fix:** Rewrote the route-local image renderer with `createElement(...)` while keeping the same inline-style composition and cache behavior.
- **Files modified:** `app/api/v1/results/events/[id]/image/route.ts`
- **Verification:** `npx vitest run tests/history-share-image-route.spec.ts`
- **Committed in:** `169a6be`

**2. [Rule 1 - Bug] Tightened the Task 1 helper fixture typing after extraction**
- **Found during:** Final verification
- **Issue:** `npm run typecheck` failed because the new helper fixture in `tests/results-page.flow.spec.ts` inferred `sessionKind` as `string` instead of `SessionKind`.
- **Fix:** Typed the fixture as `EventParticipationCard` so the test reflects the real public contract.
- **Files modified:** `tests/results-page.flow.spec.ts`
- **Verification:** `npx vitest run tests/results-page.flow.spec.ts tests/history-share-image-route.spec.ts tests/history-api.spec.ts tests/history-api-v2.spec.ts && npm run typecheck`
- **Committed in:** `1be124b`

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes were required for correctness and toolchain compatibility. Scope stayed within the planned files and verification path.

## Issues Encountered

- The route handler needed `createElement(...)` instead of JSX because the planned file path is `route.ts`, not `route.tsx`.
- Final `tsc` validation surfaced a fixture typing issue after the helper extraction; no production code changes were required.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `04-02` can add the `/results` share trigger by consuming the new helper-backed event action slot and the stable `/api/v1/results/events/{id}/image` route.
- The share image foundation is verified for canonical columns, sparse history handling, cache headers, and dense row height.

## Self-Check: PASSED

- FOUND: `.planning/phases/04-event-results-share-image/04-01-SUMMARY.md`
- FOUND: `2c2475b`
- FOUND: `deab61f`
- FOUND: `157a8a4`
- FOUND: `169a6be`
- FOUND: `1be124b`

---
*Phase: 04-event-results-share-image*
*Completed: 2026-04-02*
