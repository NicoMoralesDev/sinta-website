# Quick Task: Results Table Polish - Research

**Researched:** 2026-04-03
**Domain:** Public results table presentation, leaderboard summary, and responsive behavior
**Confidence:** HIGH

## Summary

The public event tables are already centralized around shared helpers and a single list component. Column order and numeric formatting are controlled by `app/components/event-participation-helpers.ts`, while the visual layout and session badge styling live in `app/components/event-participation-list.tsx`. That is the right seam for the requested separator, label, points-cell, and mobile changes.

The side summaries on `/results` are a separate concern. Both the "Driver snapshot" and "Current championship" tables are duplicated in `app/results/page.tsx`, and their current data contract does not include total points. Showing points there is not a CSS-only change; it requires extending the leaderboard type and SQL query.

**Primary recommendation:** keep the canonical `QS/S/QF/F/P` contract and sparse-column behavior intact, move new label/value/tone rules into shared presentation helpers, use a dedicated mobile layout for event rows instead of squeezing six fixed columns, and extend leaderboard queries/types before adding total-points columns.

## Standard Stack

| Library | Version | Purpose |
|---------|---------|---------|
| Next.js | 16.1.6 | App Router page and route rendering |
| React | 19.2.4 | Shared server/client component rendering |
| Tailwind CSS | 4.1.18 | Table/card styling and responsive breakpoints |
| TypeScript | 5.9.3 | Shared DTO and helper contracts |
| Vitest | 3.2.4 | Flow and route regression coverage |

No new dependency is justified for this task.

## Integration Points

### Shared event-table formatting

- `app/components/event-participation-helpers.ts`
- Current behavior:
  - `getEventParticipationSessionColumns()` preserves sparse historical columns and canonical order.
  - `formatEventParticipationSessionValue()` returns `P${position}` for every numeric session, so points currently render as `P25`.
- Recommended use:
  - Add presentation metadata here or in a nearby shared helper.
  - Branch on `sessionKind === "p"` for points-specific labels and values.

### Shared event-table layout

- `app/components/event-participation-list.tsx`
- Current behavior:
  - Uses one grid layout for all breakpoints.
  - Forces `repeat(n, minmax(90px, auto))` plus `min-w-[84px]` chips.
  - Applies ranking colors by numeric `position`, which incorrectly treats `1` point as a gold result.
- Recommended use:
  - Keep desktop/tablet grid here.
  - Add a separate mobile rendering path for participant rows.
  - Add yellow column separators here, not in the page wrapper.

### Results side summaries

- `app/results/page.tsx`
- Current behavior:
  - Renders two almost identical summary tables.
  - Headers are `W / P / T10`; `P` currently means podiums, not points.
  - No total-points field is available in the rendered data.
- Recommended use:
  - Update both tables together or extract one small local summary-table component.
  - Rename the podium column to avoid collision with points once total points is added.

### Leaderboard data contract

- `lib/server/history/types.ts`
- `lib/server/history/repository.ts`
- Current behavior:
  - `CurrentChampionshipSummary.leaderboard` does not expose total points.
  - Current championship SQL aggregates wins, podiums, top 10, completed races, and average position only.
- Recommended use:
  - Add a numeric `totalPoints` field to the leaderboard contract.
  - Aggregate it from `event_results` rows where `session_kind = 'p'`.
  - Do not infer points from formatted UI strings.

### Share-image parity risk

- `app/api/v1/results/events/[id]/image/route.ts`
- Current behavior:
  - Reuses the shared column/value helpers.
  - Uses its own `getSessionTone()` palette logic.
- Recommended use:
  - If event-table point formatting changes from `P25` to `25`, update the image route too.
  - If colors or header semantics should stay aligned with the public card, keep both paths in sync.

### Existing responsive label pattern

- `app/admin/_components/events-manager.tsx`
- Current behavior:
  - Already uses `hidden md:inline` and `md:hidden` to swap full labels and compact labels.
- Recommended use:
  - Reuse this exact breakpoint pattern for public result headers.
  - Avoid inventing a new responsive-label mechanism.

## Architecture Patterns

### Pattern 1: Presentation metadata per session kind

**What:** Add a small shared helper that returns label/value/tone metadata from `sessionKind` and `lang`.

**Use for:**
- Desktop full labels vs mobile abbreviations
- `PTS` header instead of `P`
- Numeric points values without a leading `P`
- Points-specific badge styling

**Guidance:**
- Keep canonical ordering from `getEventParticipationSessionColumns()`.
- Use explicit fallbacks for legacy or unknown kinds:
  - Prefer mapped full labels for `qs`, `s`, `qf`, `f`, `p`
  - Fall back to `sessionLabel` for legacy `primary` / `secondary` or any unknown kind

### Pattern 2: Two layouts, one data source

**What:** Keep the current grid for `md+`, but render a compact stacked/card layout on mobile.

**Why:** On a 320-390px viewport, `driver + 5 result columns` is already beyond the current min-width budget. Shrinking fonts alone will produce a denser but still hard-to-scan layout.

**Recommended mobile shape:**
- Driver name as the first row
- Session values below in a 2-column or 3-column chip grid
- Compact labels only on mobile

### Pattern 3: One summary-table renderer for both right-column blocks

**What:** Consolidate the duplicated markup for the ranking and current-championship summaries into one small renderer.

**Why:** The task changes headers and columns in both places. Leaving them duplicated increases the chance of updating one and forgetting the other.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Points detection | Regex/parsing on formatted UI text | `session.sessionKind === "p"` plus numeric `position` | UI text will change; the contract already carries the semantic type |
| Mobile readability | Smaller and smaller six-column grid | Separate mobile row layout | The current fixed-width grid is the root issue |
| Responsive labels | New breakpoint API or prop matrix | Existing `hidden md:inline` / `md:hidden` pattern | The repo already uses this pattern |
| Summary-table updates | Two manually synced table copies | One local renderer/helper | Prevents header drift and missed columns |

## Common Pitfalls

### Pitfall 1: Breaking sparse historical events

**What goes wrong:** The implementation assumes all five canonical columns always exist and inserts empty placeholders.

**How to avoid:** Keep `getEventParticipationSessionColumns()` as the visibility source of truth. Only change presentation, not the sparse-column rule.

### Pitfall 2: Treating points like finishing position

**What goes wrong:** `1` point gets the same "winner" treatment as `P1`.

**Why it happens:** `getSessionBadgeTone()` keys off `position` only, and `formatEventParticipationSessionValue()` prefixes every numeric value with `P`.

**How to avoid:** Make both helpers session-aware before checking numeric thresholds.

### Pitfall 3: Fixing web cards but not share images

**What goes wrong:** `/results` shows `PTS` and raw point values, but the share image still shows `P` and `P25`.

**How to avoid:** If semantics change, update `app/api/v1/results/events/[id]/image/route.ts` in the same task or explicitly accept divergence.

### Pitfall 4: Assuming total points is UI-only

**What goes wrong:** The right-column summaries add a points header without extending the backend contract.

**How to avoid:** Update `lib/server/history/types.ts` and the relevant repository query before wiring the UI.

### Pitfall 5: Silent docs drift

**What goes wrong:** `docs/results-model.md` still claims public surfaces use uppercase `QS / S / QF / F / P` labels everywhere.

**How to avoid:** If desktop public labels become full text, update the docs in the same change.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 3.2.4 |
| Config file | `vitest.config.ts` |
| Quick run command | `npm run test -- tests/results-page.flow.spec.ts tests/history-share-image-route.spec.ts` |
| Full suite command | `npm run test` |

### Focused test map

| Area | Behavior | Recommended coverage |
|------|----------|----------------------|
| Event table helpers | `p` renders as raw points, non-`p` numeric sessions keep position formatting | Extend `tests/results-page.flow.spec.ts` helper assertions |
| Event table layout | Desktop headers show full labels, mobile uses compact labels | Add markup assertions in `tests/results-page.flow.spec.ts` |
| Share image parity | Image route matches updated points formatting if changed | Extend `tests/history-share-image-route.spec.ts` |
| Current championship summary | Total points column appears and shows correct values | Add page-level assertions plus repository/service coverage if query changes |

### Manual verification

- Check `/results` on a narrow mobile viewport and confirm the participant rows are readable without horizontal pan.
- Verify yellow separators visually against the requested reference styling.
- Confirm points cells no longer use winner/placement color semantics.

## Open Questions

1. **Reference images are not present in the current task context.**
   - Impact: separator thickness, exact label copy, and preferred mobile composition cannot be matched pixel-for-pixel yet.
   - Safe default: implement from the textual requirements and keep the change isolated so visual tuning is easy afterward.

2. **Exact desktop long-copy for `QS / S / QF / F` is not locked in code today.**
   - What exists now: public history surfaces use compact uppercase labels; admin uses long labels such as `Qualy Sprint`, `Qualy Final`, and `Puntos`.
   - Safe default: reuse the admin long-label wording for desktop public headers unless the reference images show different copy.

## Sources

### Primary (HIGH confidence)

- `package.json`
- `app/components/event-participation-list.tsx`
- `app/components/event-participation-helpers.ts`
- `app/results/page.tsx`
- `app/api/v1/results/events/[id]/image/route.ts`
- `app/admin/_components/events-manager.tsx`
- `lib/server/history/types.ts`
- `lib/server/history/repository.ts`
- `tests/results-page.flow.spec.ts`
- `tests/history-share-image-route.spec.ts`
- `docs/results-model.md`

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - directly verified from `package.json`
- Architecture: HIGH - driven by the current render path and shared helpers
- Pitfalls: HIGH - confirmed by current helper behavior, duplicated markup, and existing tests/docs

**Research date:** 2026-04-03
**Valid until:** 2026-04-10
