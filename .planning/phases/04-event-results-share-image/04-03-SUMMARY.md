---
phase: 04-event-results-share-image
plan: 03
subsystem: ui
tags: [nextjs, react, vitest, results, sharing]
requires:
  - phase: 04-event-results-share-image
    provides: "Single-event share-image route and deterministic `/results` share links from 04-01 and 04-02"
provides:
  - "Driver-aware share-image route contract for filtered `/results` tables"
  - "Filtered-driver parity coverage across the results page and image route"
  - "Phase 4 sharing requirements marked complete after verification"
affects: [results-page, share-image, requirements-traceability]
tech-stack:
  added: []
  patterns:
    [
      "Optional share-image driver slugs are validated in the history service before repository lookup",
      "Results-page share hrefs preserve active driver state while staying eventId-driven and language-aware",
    ]
key-files:
  created: [.planning/phases/04-event-results-share-image/04-03-SUMMARY.md]
  modified:
    [
      app/api/v1/results/events/[id]/image/route.ts,
      app/results/page.tsx,
      lib/server/history/repository.ts,
      lib/server/history/service.ts,
      tests/history-share-image-route.spec.ts,
      tests/results-page.flow.spec.ts,
      .planning/REQUIREMENTS.md,
    ]
key-decisions:
  - "Widen the existing image route with one optional validated `driver` slug instead of adding a second DTO or suppressing sharing."
  - "Treat filtered by-id lookups with zero participant rows as not-found so mismatched manual URLs fail safely with 404."
  - "Preserve the eventId-based route contract and thread only the active driver slug plus existing language flag through `/results` share links."
patterns-established:
  - "By-id share-image reads reuse `fetchResultsForEvents([eventId], driverSlug)` so filtered and unfiltered event tables share one mapping path."
  - "Static markup flow assertions lock filtered `/results` share-link parity without introducing browser-only coverage."
requirements-completed: [SHARE-01, SHARE-02]
duration: 4min
completed: 2026-04-02
---

# Phase 04 Plan 03: Event Results Share Image Summary

**Driver-filtered `/results` tables now generate share-image URLs that preserve the selected driver slug, and the image route renders the same participant set or returns 404 for mismatched manual filters.**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-02T19:19:19-03:00
- **Completed:** 2026-04-02T19:22:46-03:00
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments

- Extended the share-image route contract with an optional validated `driver` slug and reused the filtered history repository path for by-id lookups.
- Threaded the active `/results` driver filter into per-event share links while keeping canonical event-id routing and existing `lang` behavior.
- Updated Phase 4 requirement traceability so `SHARE-01` and `SHARE-02` both reflect the now-verified implementation.

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend the by-id share-image contract to preserve the optional driver filter** - `9b9c3e1` (test), `55cab25` (feat)
2. **Task 2: Thread the active driver filter into `/results` share links and lock page-to-route parity** - `a6f8ee4` (test), `55aeb31` (feat)
3. **Task 3: Correct Phase 4 requirement traceability after the parity gap is closed** - `1c0181b` (chore)

_Note: Task 1 and Task 2 followed TDD with failing test commits before implementation. A follow-up type-safety fix landed in `60b6d3a` during final verification._

## Files Created/Modified

- `app/api/v1/results/events/[id]/image/route.ts` - Reads the optional `driver` query param and forwards it to the share-image service lookup.
- `app/results/page.tsx` - Preserves the active driver slug in share-image hrefs while keeping the existing English and Spanish query behavior.
- `lib/server/history/repository.ts` - Reuses the filtered public results query for by-id event participation lookups and returns `null` for mismatched filtered events.
- `lib/server/history/service.ts` - Validates the optional driver slug with the existing slug parser before delegating to the repository.
- `tests/history-share-image-route.spec.ts` - Covers driver forwarding, filtered-driver markup parity, mismatched-driver 404s, and the final tuple typing fix.
- `tests/results-page.flow.spec.ts` - Asserts filtered English share links preserve `driver=<slug>&lang=en` while keeping pagination parity locked.
- `.planning/REQUIREMENTS.md` - Marks `SHARE-01` and `SHARE-02` complete in the checklist and traceability table.

## Decisions Made

- Reused the existing `EventParticipationCard` path for filtered by-id reads instead of adding a second share-specific DTO or route.
- Kept the share-link contract eventId-driven and appended only the active driver slug when present so filters remain server-driven and deterministic.
- Preserved existing cache headers, column helpers, ordering, and language defaults to keep the gap closure low-risk.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected the new route-spec tuple cast for typecheck**
- **Found during:** Final verification
- **Issue:** The new filtered-driver route assertion cast the `ImageResponse` mock call to a one-element tuple, which failed `npm run typecheck`.
- **Fix:** Updated the test to cast the mocked call to the actual two-element tuple shape.
- **Files modified:** `tests/history-share-image-route.spec.ts`
- **Verification:** `npx vitest run tests/history-share-image-route.spec.ts tests/results-page.flow.spec.ts`; `npm run typecheck`
- **Committed in:** `60b6d3a`

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** The auto-fix was limited to test typing and did not change runtime behavior or scope.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 4 sharing now preserves driver-filter parity between `/results` and the generated image route.
- Phase 5 documentation can describe the completed sharing behavior without the earlier parity exception.

## Self-Check: PASSED

- Verified `.planning/phases/04-event-results-share-image/04-03-SUMMARY.md` exists.
- Verified commits `9b9c3e1`, `55cab25`, `a6f8ee4`, `55aeb31`, `1c0181b`, and `60b6d3a` exist in git history.

---
*Phase: 04-event-results-share-image*
*Completed: 2026-04-02*
