---
phase: 03-public-results-organizer-display-and-driver-stats-correctness
plan: 02
subsystem: ui
tags: [nextjs, react, vitest, driver-stats, svg]
requires:
  - phase: 01-results-contract-ordering-and-championship-metadata
    provides: canonical session kinds and race-only repository aggregates
  - phase: 02-admin-results-and-championship-editing
    provides: canonical public data exercised by the driver profile page
provides:
  - final-race-only driver trend and heatmap inputs on the public driver profile page
  - mixed-session regression coverage for driver chart derivation
  - direct sparkline SVG orientation coverage
affects: [phase-04-share-image, phase-05-documentation, driver-profile]
tech-stack:
  added: []
  patterns:
    - page-local final-race selection for chart inputs
    - server-rendered SVG assertions with renderToStaticMarkup
key-files:
  created:
    - tests/driver-visualizations.spec.ts
  modified:
    - app/drivers/[slug]/page.tsx
    - tests/driver-profile-page.flow.spec.ts
key-decisions:
  - Keep race-only chart shaping page-local and accept both `f` and legacy `secondary` as final-race aliases.
  - Verify sparkline direction by parsing rendered SVG polyline coordinates instead of changing the existing component.
patterns-established:
  - "Driver chart inputs should select one final-race result per event before deriving positions or heatmap cells."
  - "Visualization regression tests can assert server-rendered SVG markup directly."
requirements-completed: [STAT-01, STAT-02]
duration: 4min
completed: 2026-04-02
---

# Phase 03 Plan 02: Driver Stats Correctness Summary

**Driver profile charts now derive one final-race result per event, with SVG sparkline orientation enforced by direct Vitest coverage**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-02T19:32:28Z
- **Completed:** 2026-04-02T19:36:10Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Filtered driver trend and heatmap inputs to `f` and legacy `secondary` results only, without touching repository aggregates or the visible history table.
- Added mixed-session driver-page coverage proving `qs`, `s`, `qf`, and `p` rows no longer create fake chart points or heatmap values.
- Added a focused visualization spec that parses sparkline SVG points and locks the empty-state copy.

## Task Commits

Each task was committed atomically:

1. **Task 1: Restrict driver trend and heatmap derivation to final-race results** - `1c3846b` (fix)
2. **Task 2: Add explicit sparkline-orientation coverage** - `ff93ed7` (test)

## Files Created/Modified
- `app/drivers/[slug]/page.tsx` - Added a page-local final-race selector and routed trend/heatmap derivation through it.
- `tests/driver-profile-page.flow.spec.ts` - Added mixed-session regression coverage and isolated per-test mocks.
- `tests/driver-visualizations.spec.ts` - Added direct sparkline polyline and empty-state assertions.

## Decisions Made
- Kept the final-race selector local to the driver page because this plan only needed chart input shaping in one consumer.
- Preserved `secondary` as a legacy final-race alias so mixed or older fixtures still populate the charts correctly.
- Treated sparkline direction as a verification problem, not a rendering rewrite, because the existing SVG math was already correct.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Reset hoisted service mocks between driver-page tests**
- **Found during:** Task 1 (Restrict driver trend and heatmap derivation to final-race results)
- **Issue:** An unused `mockResolvedValueOnce` from an earlier test leaked into the new mixed-session case and masked the real regression.
- **Fix:** Added a `beforeEach()` reset for the service mocks in the driver profile flow spec.
- **Files modified:** `tests/driver-profile-page.flow.spec.ts`
- **Verification:** The red run failed on the page logic after the reset, then the task verification passed.
- **Committed in:** `1c3846b` (part of task commit)

**2. [Rule 3 - Blocking] Avoid JSX in the new `.spec.ts` visualization test**
- **Found during:** Task 2 (Add explicit sparkline-orientation coverage)
- **Issue:** Vitest/esbuild in this repo treats `.spec.ts` as plain TypeScript, so JSX caused a transform failure.
- **Fix:** Rewrote the test render calls with `createElement()` while keeping the planned file path and assertions.
- **Files modified:** `tests/driver-visualizations.spec.ts`
- **Verification:** `npx vitest run tests/driver-visualizations.spec.ts`
- **Committed in:** `ff93ed7` (part of task commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes were test-harness blockers only. Scope and shipped behavior stayed aligned with the plan.

## Issues Encountered
None beyond the auto-fixed test blockers above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 3 now has explicit coverage for both remaining driver-stat correctness requirements.
- The next phase can consume the stabilized public driver/result semantics without reopening chart derivation logic.

## Self-Check
PASSED

- Found `.planning/phases/03-public-results-organizer-display-and-driver-stats-correctness/03-02-SUMMARY.md`
- Found task commit `1c3846b`
- Found task commit `ff93ed7`

---
*Phase: 03-public-results-organizer-display-and-driver-stats-correctness*
*Completed: 2026-04-02*
