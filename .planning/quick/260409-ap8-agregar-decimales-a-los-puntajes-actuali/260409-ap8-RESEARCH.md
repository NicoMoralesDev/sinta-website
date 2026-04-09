# Quick Task 260409-ap8 Research

**Task:** Add decimal points support for results points and make result sharing reliable on mobile.
**Date:** 2026-04-09
**Mode:** quick-task research

## Versions and references

- `next@16.1.6`
- `react@19.2.4`
- `pg@8.16.3`
- PostgreSQL numeric types: `numeric(precision, scale)` can enforce one decimal place and rounds to the declared scale.
- MDN Web Share API: `navigator.share()` can share `title`, `text`, `url`, and, when supported, `files`; `navigator.canShare()` is the compatibility check for file sharing.

## Findings

### 1. Decimal points support touches more than admin validation

- The admin editor currently accepts only integers for `p`.
- The write path rejects any non-integer `position` in `lib/server/admin/service.ts`.
- The database still stores `event_results.position` as integer-compatible schema, so allowing `18.5` in the UI alone would fail or drift.
- Public read models and admin read models select `er.position` directly. If the column becomes `numeric`, the `pg` driver may return strings unless queries cast back to `double precision`.

### 2. The lowest-risk schema change is targeted numeric widening

- Keep the shared `position` column, but widen it to `numeric(..., 1)` and tighten the constraint:
  - `p` rows allow `>= 0` with at most one decimal place.
  - non-`p` rows still require positive integers.
- Keep `raw_value` as the display/source-of-truth string for exact formatting, but normalize points input so persisted numeric and string values stay aligned.

### 3. The current share UX is not a true share flow

- Public surfaces use `next/link` directly to `/api/v1/results/events/:id/image`.
- That only navigates to a generated image URL. It does not trigger the mobile share sheet and does not target WhatsApp or similar apps.
- Using `Link` to a binary API route is also a poor fit for the app-router navigation model.

### 4. A practical mobile share improvement is available without platform integration

- Use a small client component that:
  - fetches the generated PNG,
  - shares a `File` through `navigator.share()` when `navigator.canShare({ files })` is supported,
  - falls back to `navigator.share({ title, text, url })` when file sharing is unavailable,
  - falls back again to opening the image URL in a new tab if Web Share is unavailable or the fetch fails.
- This stays inside current scope: no direct WhatsApp integration, no new dependency, still powered by the existing image route.

### 5. Likely source of the “share is broken” feedback

- The existing feature exports an image but never invokes a native share flow.
- On mobile, users expect a share sheet; instead they are navigated to an image URL.
- Even when the image route succeeds, the UX still feels broken because the output is only a separate URL.

## Recommended plan

1. Add a migration to widen points storage to one-decimal numeric values and update validation/helpers so only `p` accepts decimal input with `.`.
2. Cast numeric reads/aggregates back to JS numbers anywhere the repo reads `event_results.position` or sums points.
3. Replace direct share links with a client share button that uses Web Share with file support when available and preserves the existing image-route fallback.

## Risks

- Numeric widening affects both admin and public read paths; missing a cast could leak strings into rendering or tests.
- Sharing files requires HTTPS and browser support. Desktop browsers may fall back to URL sharing or opening the image directly.
- Existing tests assume integer-only points and plain anchor links; they need focused updates.
