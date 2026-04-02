---
phase: 04-event-results-share-image
verified: 2026-04-02T22:28:33Z
status: human_needed
score: 3/3 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 2/3
  gaps_closed:
    - "The generated image includes every driver shown in the selected event table and faithfully represents that table."
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Compare a driver-filtered `/results` event card with its generated image"
    expected: "The generated image keeps the same selected driver subset, canonical columns, and ordering as the visible event table."
    why_human: "Automated tests prove the route contract and rendered markup, but not full visual parity from the running app."
  - test: "Open dense and sparse share-image URLs and inspect readability"
    expected: "Dense events show every participant row without clipping, and sparse historical events omit absent columns while staying readable."
    why_human: "The suite verifies height calculation and helper semantics, but not actual image legibility at user-facing sizes."
---

# Phase 4: Event Results Share Image Verification Report

**Phase Goal:** Visitors can generate a shareable image that faithfully represents a specific public event results table.
**Verified:** 2026-04-02T22:28:33Z
**Status:** human_needed
**Re-verification:** Yes - after gap closure

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
| --- | --- | --- | --- |
| 1 | Visitor can trigger generation of a shareable image for a specific event results table from the public results experience. | ✓ VERIFIED | `/results` builds share-image hrefs in `app/results/page.tsx:95-112` and renders them through `renderEventActions` in `app/results/page.tsx:381-392`. Flow tests lock unfiltered and filtered share links in `tests/results-page.flow.spec.ts:191-238` and `tests/results-page.flow.spec.ts:240-286`. |
| 2 | The generated image includes every driver shown in the selected event table. | ✓ VERIFIED | The page now preserves the active driver slug in the share-image contract in `app/results/page.tsx:95-112` and `app/results/page.tsx:385-387`. The image route forwards `driver` to the service in `app/api/v1/results/events/[id]/image/route.ts:321-328`, the service validates it in `lib/server/history/service.ts:205-216`, and the repository reuses `fetchResultsForEvents([eventId], driverSlug)` in `lib/server/history/repository.ts:607-620`. Route tests prove the selected driver only is rendered and mismatched filters return `404` in `tests/history-share-image-route.spec.ts:105-145` and `tests/history-share-image-route.spec.ts:244-266`. |
| 3 | The generated image matches the visible result columns and points-based ranking shown for that event. | ✓ VERIFIED | Both the page and the image route use the shared helper contract in `app/components/event-participation-list.tsx:8-15` and `app/api/v1/results/events/[id]/image/route.ts:5-15`. Canonical ordering and sparse-column behavior come from `app/components/event-participation-helpers.ts:11-55`, while participant ordering still comes from the shared repository path in `lib/server/history/repository.ts:582-620`. Tests cover canonical `QS/S/QF/F/P`, sparse omission, participant order, cache behavior, and dense-height growth in `tests/history-share-image-route.spec.ts:52-97` and `tests/history-share-image-route.spec.ts:147-281`. |

**Score:** 3/3 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
| --- | --- | --- | --- |
| `app/components/event-participation-helpers.ts` | Shared helper contract for canonical visible columns, labels, and cell values | ✓ VERIFIED | Pure helper module exists and is reused by both public surfaces. |
| `app/components/event-participation-list.tsx` | Public event table using shared helpers and exposing header actions | ✓ VERIFIED | Imports helper exports and renders `renderEventActions` beside the event date. |
| `app/results/page.tsx` | `/results` share trigger wiring with language-aware, driver-aware href generation | ✓ VERIFIED | Builds deterministic image hrefs from `eventId`, optional `driver`, and `lang`, then wires them through `EventParticipationList`. |
| `app/api/v1/results/events/[id]/image/route.ts` | Node-runtime share-image route with explicit caching and filtered-driver support | ✓ VERIFIED | Reads `driver` and `lang`, uses `ImageResponse`, applies cache headers, and grows height for dense tables. |
| `lib/server/history/service.ts` | Validated by-id public event-participation read with optional driver slug | ✓ VERIFIED | Validates UUID and slug inputs before repository lookup and throws not-found when no matching public event table exists. |
| `lib/server/history/repository.ts` | One-event public lookup reusing the existing filtered results mapping path | ✓ VERIFIED | Calls `fetchResultsForEvents([eventId], driverSlug)` and returns `null` for filtered mismatches instead of widening to a full event. |
| `tests/results-page.flow.spec.ts` | Flow coverage for share-link rendering, language behavior, pagination, and driver-filter parity | ✓ VERIFIED | Covers canonical event-id routing, English and Spanish links, cursor preservation, and filtered-driver hrefs. |
| `tests/history-share-image-route.spec.ts` | Route coverage for filtered-driver parity, cache headers, ordering, sparse columns, and dense tables | ✓ VERIFIED | Covers 200/400/404 flows, filtered-driver output, cache headers, canonical columns, and height growth. |
| `.planning/REQUIREMENTS.md` | Phase 4 sharing requirements marked complete after the gap closure | ✓ VERIFIED | `SHARE-01` and `SHARE-02` are both marked complete in the checklist and traceability table. |

### Key Link Verification

| From | To | Via | Status | Details |
| --- | --- | --- | --- | --- |
| `app/components/event-participation-list.tsx` | `app/components/event-participation-helpers.ts` | Shared helper imports for session columns and value formatting | WIRED | The list imports and uses the shared helper exports directly. |
| `app/results/page.tsx` | `app/components/event-participation-list.tsx` | `renderEventActions` share-link injection | WIRED | `/results` passes the share action renderer into `EventParticipationList`. |
| `app/results/page.tsx` | `app/api/v1/results/events/[id]/image/route.ts` | `buildResultsShareImageHref(eventId, lang, driver)` | WIRED | The page builds deterministic image-route links from canonical `eventId`, optional `driver`, and current `lang`. |
| `app/api/v1/results/events/[id]/image/route.ts` | `lib/server/history/service.ts` | `getResultsEventParticipationById(id, driver ?? undefined)` | WIRED | The route forwards the optional driver slug before rendering the image. |
| `lib/server/history/service.ts` | `lib/server/history/repository.ts` | Validated `eventId` + optional normalized `driverSlug` lookup | WIRED | The service validates both values, then delegates to `getEventParticipationCardById(normalizedEventId, normalizedDriverSlug)`. |
| `tests/results-page.flow.spec.ts` | `app/results/page.tsx` | Static-markup assertions for unfiltered and filtered share hrefs | WIRED | Tests assert `/api/v1/results/events/event-1/image?lang=en` and `/api/v1/results/events/event-1/image?driver=kevin-fontana&amp;lang=en`. |
| `tests/history-share-image-route.spec.ts` | `app/api/v1/results/events/[id]/image/route.ts` | Route assertions for driver forwarding, filtered output, cache headers, and not-found handling | WIRED | Tests exercise the route with and without `driver`, then inspect the rendered markup and HTTP responses. |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| --- | --- | --- | --- | --- |
| `SHARE-01` | `04-02-PLAN.md`, `04-03-PLAN.md` | Visitor can generate a shareable image for a specific event results table from the public results experience | ✓ SATISFIED | `/results` renders per-event share links in both languages and preserves the active driver filter when present. Coverage exists in `tests/results-page.flow.spec.ts`, and `.planning/REQUIREMENTS.md:30` plus `.planning/REQUIREMENTS.md:83` mark the requirement complete. |
| `SHARE-02` | `04-01-PLAN.md`, `04-02-PLAN.md`, `04-03-PLAN.md` | Generated share image includes all drivers in the selected event table and preserves the canonical column order and points-based ranking shown to the visitor | ✓ SATISFIED | Helper parity is shared between page and route, filtered-driver lookups stay on the same participant set, and route tests prove canonical columns, sparse omission, ordering, and filtered-driver behavior. `.planning/REQUIREMENTS.md:31` and `.planning/REQUIREMENTS.md:84` mark the requirement complete. |

Orphaned phase requirements: none. All Phase 4 requirement IDs declared in the plans are accounted for in `.planning/REQUIREMENTS.md`.

### Anti-Patterns Found

No blocker anti-patterns found in the phase files reviewed. The route, page, helper, service, repository, and test files are substantive, wired, and do not contain TODO/placeholder/console-only implementations for this feature.

### Human Verification Required

### 1. Driver-Filtered Visual Parity

**Test:** Open `/results` with a real `driver` filter, use the share-image link for one event, and compare the generated image against the visible event card.
**Expected:** The image contains only the selected driver subset and preserves the same canonical columns and ordering as the page.
**Why human:** The automated suite proves the route contract and rendered markup, but not full visual parity from the live app.

### 2. Dense And Sparse Image Readability

**Test:** Open one dense event share-image URL and one sparse historical event share-image URL in a browser.
**Expected:** Dense events show every participant row without clipping, and sparse events omit missing columns while remaining legible.
**Why human:** The tests verify image height growth and sparse-column semantics, but not real-world legibility at user-facing sizes.

### Gaps Summary

No code-level gaps remain for Phase 4. The previous driver-filter parity failure is closed: `/results` now preserves the active driver slug in share-image links, the image route validates and forwards that slug through the existing history service and repository path, and mismatched manual driver filters fail with `404` instead of widening to the full event.

Phase 4 is functionally complete in code and test evidence. The remaining work is manual visual QA of the generated images.

---

_Verified: 2026-04-02T22:28:33Z_
_Verifier: Claude (gsd-verifier)_
