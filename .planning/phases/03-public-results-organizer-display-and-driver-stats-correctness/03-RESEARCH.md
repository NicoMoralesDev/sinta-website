# Phase 3: Public Results, Organizer Display, And Driver Stats Correctness - Research

**Researched:** 2026-04-02
**Domain:** Public results rendering and driver-stat derivation correctness in the existing Next.js App Router frontend
**Confidence:** HIGH

<user_constraints>
## User Constraints

**Source note:** No `03-CONTEXT.md` exists for this phase. The constraints below are derived from the user objective, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/PROJECT.md`, and `.planning/STATE.md`.

### Locked Decisions

- Stay brownfield and extend the existing public pages and APIs with minimal surface area.
- Preserve the canonical public event-results order `QS`, `S`, `QF`, `F`, `P`.
- Preserve points-first participant ordering with final-race and driver-name fallback.
- Keep historical events truthful by hiding empty `QS`, `QF`, and `P` columns instead of synthesizing data.
- Show organizer information inline with a public championship label or heading.
- Keep driver trend and aggregate statistics race-correct after canonical `QS`/`QF`/`P` support.

### Claude's Discretion

- Exact public surface that shows organizer metadata first.
- Whether organizer rendering should reuse existing filter/current payloads or widen event-card DTOs.
- Whether race-only session filtering for driver charts stays page-local or becomes a tiny shared helper.
- Whether STAT-01 is implementation work or verification-only, given the current sparkline math.

### Deferred Ideas (OUT OF SCOPE)

- Share-image generation and any social sharing workflow.
- Historical backfill of missing `QS`, `QF`, or `P` values.
- Broad redesign of the results hub or driver profile.
- Documentation alignment beyond what Phase 5 will cover.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RESULT-01 | Visitor can view event result tables using the canonical column order `QS`, `S`, `QF`, `F`, `P` | Already implemented by shared session ordering in `lib/server/history/repository.ts` and dynamic column derivation in `app/components/event-participation-list.tsx`; phase work should verify and preserve it on public pages. |
| RESULT-02 | Visitor sees event participants ordered by points instead of final-race position | Already implemented in repository grouping via points-first sort; phase work should keep public rendering from bypassing that shared order. |
| RESULT-03 | Visitor does not see noisy empty session columns for historical events that lack `QS` or `QF` data | Already implemented by deriving visible columns from actual event sessions; phase work should avoid replacing this with a fixed five-column header. |
| RESULT-04 | Visitor can see the championship/tournament organizer rendered in an appropriate public championship label or heading | Not implemented on current public pages; phase needs a small UI pass that reuses existing organizer data already exposed by filters/current-championship payloads. |
| STAT-01 | Visitor sees the recent-positions chart with race positions plotted in the correct direction so better finishes read as better performance | Current sparkline math already maps lower finishing positions to smaller SVG `y` values, which display higher on screen; phase should verify this with an explicit test instead of rewriting blindly. |
| STAT-02 | Visitor sees driver trend and aggregate race statistics remain race-correct after `QS`, `QF`, and `P` support is added | Repository aggregate SQL is already race-only, but driver-page trend/heatmap derivations still inspect all sessions; phase must make those page-level derivations final-race-only. |
</phase_requirements>

## Summary

Phase 3 is narrower than the roadmap title suggests. The repo already has most of RESULT-01, RESULT-02, and RESULT-03 in place: public participant grouping is points-first in [`lib/server/history/repository.ts`](../../../lib/server/history/repository.ts), public event headers are derived from actual sessions instead of a fixed five-column schema in [`app/components/event-participation-list.tsx`](../../../app/components/event-participation-list.tsx), and the targeted Vitest coverage for those behaviors is already green. The planner should treat those requirements as public-surface verification and regression-hardening work, not as a redesign.

The real implementation gap is split across two places. First, organizer metadata is now present in public filter/current payloads, but it is still not rendered on the results page. Second, the driver profile still derives `numericPositions` and `heatmapItems` from every stored session in an event, which means `QS`, `QF`, `S`, and `P` rows can leak into the trend chart and heatmap even though repository aggregates are already scoped to `F` rows only. Those page-level derivations are the main correctness bug left by the canonical results expansion.

The most important planning decision is to keep this phase minimal. Do not reopen the shared results contract. Reuse the existing server-first Next.js page pattern, keep participant ordering and sparse-column logic in the current shared helpers, use the existing organizer fields already available from `getFilters()` and `getCurrentChampionship()`, and fix race-only driver derivation in place on the driver page with focused tests.

**Primary recommendation:** Plan Phase 3 as a small public UI correctness pass: preserve existing canonical ordering/column behavior, render organizer text from already-loaded data, and make driver trend/heatmap derivations final-race-only with explicit regression tests.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.6 | App Router pages and route handlers for `/results`, `/drivers/[slug]`, and `/api/v1/**` | The repo already uses server-rendered App Router pages that call the history service directly; this phase should stay inside that pattern. |
| React | 19.2.4 | Server/client composition for pages and shared components | Existing public pages are server components by default and only use client boundaries where interaction is required. |
| TypeScript | 5.9.3 | Shared DTOs, session-kind narrowing, and test fixtures | Current behavior hinges on typed session kinds and DTO compatibility. |
| PostgreSQL via `pg` | `pg` `^8.16.3` | Existing repository read path that already enforces points-first ordering and race-only aggregates | No ORM or schema change is needed for this phase. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vitest | `^3.2.4` | Flow, repository, and route regression coverage | Use for organizer rendering, race-only driver-page derivation, and sparkline-orientation verification. |
| Tailwind CSS | 4.1.18 | Small organizer-label UI adjustments | Keep public UI changes additive and local to existing class patterns. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Reusing `getFilters()` / `getCurrentChampionship()` organizer data | Widening `EventParticipationCard` to carry `organizerName` everywhere | DTO widening is only justified if organizer must appear on every event card across multiple pages. For this phase, results-page-only rendering is the lower-risk path. |
| Keeping the inline SVG sparkline | Replacing it with a charting library | That adds dependency churn and does not solve the real bug, which is session selection rather than chart infrastructure. |
| Fixing driver-page derivation locally | Moving all chart-ready data shaping into the repository | Repository aggregates are already correct. Shifting presentation-only arrays into SQL would increase surface area without clear benefit. |

**Installation:**

```bash
# None. This phase should use the repo-pinned stack and add no dependencies.
```

**Version verification:** Repo versions were detected from `package.json` on 2026-04-02: Next.js `16.1.6`, React `19.2.4`, TypeScript `5.9.3`, Vitest `^3.2.4`, Tailwind CSS `4.1.18`, and Node `22.x`. Official docs were checked for current App Router server-component guidance, route-handler conventions, React Server Components stability, Vitest module mocking behavior, and SVG coordinate semantics. No package upgrade is recommended for this phase.

## Architecture Patterns

### Recommended Project Structure

```text
app/results/page.tsx                    # Results-page organizer label and public-surface verification
app/components/event-participation-list.tsx
app/drivers/[slug]/page.tsx             # Race-only trend/heatmap derivation
app/components/visualizations.tsx       # Sparkline orientation stays here; add focused test coverage
lib/server/history/repository.ts        # Existing shared ordering and race-only aggregate rules
tests/results-page.flow.spec.ts         # Organizer rendering + public results regressions
tests/driver-profile-page.flow.spec.ts  # Race-only page derivation coverage
tests/history-repository.spec.ts        # Existing points ordering and race-only aggregate protection
tests/driver-visualizations.spec.ts     # New direct sparkline-orientation coverage
```

### Pattern 1: Preserve Shared Public Results Semantics

**What:** Keep participant ordering and visible-column derivation in the existing shared paths instead of recreating them in page code.

**When to use:** Any public results rendering change for `/results`, current championship summaries, or later share-image work.

**Example:**

```typescript
// Source: local pattern in lib/server/history/repository.ts and
// app/components/event-participation-list.tsx
const participants = Array.from(grouped.values())
  .sort(compareParticipants)
  .map((participant) => ({
    ...participant,
    sessions: participant.sessions.sort(
      (left, right) => getSessionKindOrder(left.sessionKind) - getSessionKindOrder(right.sessionKind),
    ),
  }));

const columns = getSessionColumns(event);
```

**Planning implication:** RESULT-01, RESULT-02, and RESULT-03 should be handled as regression-preserving tasks. Do not introduce a fixed `["QS","S","QF","F","P"]` header in the component, because that would regress sparse historical events.

### Pattern 2: Race-Only Driver Analytics Derivation

**What:** Derive chart and heatmap inputs from the event's final-race result only, not from every session row attached to the event.

**When to use:** `numericPositions`, heatmap cells, and any future driver trend widgets that are supposed to represent race finishes.

**Example:**

```typescript
// Source: recommended adaptation for app/drivers/[slug]/page.tsx
function getRaceResult(
  results: Array<{ sessionKind: string; position: number | null; status: string | null }>,
) {
  return results.find((result) => result.sessionKind === "f" || result.sessionKind === "secondary") ?? null;
}

const numericPositions = history.items
  .map((event) => getRaceResult(event.results)?.position ?? null)
  .filter((value): value is number => value !== null)
  .slice(0, 20)
  .reverse();

const heatmapItems = history.items.slice(0, 24).map((event) => {
  const race = getRaceResult(event.results);
  return {
    roundLabel: `${event.seasonYear} R${event.roundNumber}`,
    position: race?.position ?? null,
    status: race?.status ?? null,
  };
});
```

**Planning implication:** keep this logic local unless a second consumer appears during implementation. A page-local helper is the smallest reasonable change.

### Pattern 3: Organizer Rendering From Existing Read Models

**What:** Use the organizer data that is already available on `filters.championships` and `current.championship` before widening any public DTO.

**When to use:** Results-page headings, selected-championship context labels, and current championship summary text.

**Example:**

```typescript
// Source: recommended adaptation for app/results/page.tsx
function formatChampionshipLabel(
  seasonYear: number,
  name: string,
  organizerName: string | null,
) {
  return organizerName ? `${seasonYear} - ${name} (${organizerName})` : `${seasonYear} - ${name}`;
}
```

**Planning implication:** default to `/results` only. Widen `EventParticipationCard` with `organizerName` only if implementation proves the same label must render inside reused event cards across multiple pages.

### Anti-Patterns to Avoid

- **Re-sorting public rows in React components:** public row order already comes from the shared repository helper.
- **Forcing fixed five-column headers on historical events:** this would directly violate RESULT-03.
- **Treating every numeric session as a race finish on the driver page:** this is the remaining stats bug.
- **Introducing a chart dependency to fix a data-selection bug:** the sparkline component is adequate.
- **Duplicating organizer metadata into event-level DTOs without need:** use the fields already exposed by existing read models first.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Public results ordering | Page-local `sort()` calls | Existing `compareParticipants()` in `lib/server/history/repository.ts` | Keeps page, API, and future export surfaces aligned. |
| Sparse historical columns | Hard-coded `QS/S/QF/F/P` header rendering | `getSessionColumns()` in `app/components/event-participation-list.tsx` | Prevents empty noisy columns on older events. |
| Organizer lookup | New API endpoint or duplicated event-level field | Existing `organizerName` on filters/current payloads | Minimal surface and already DTO-compatible. |
| Driver trend data shaping | Inline ad hoc `flatMap()` over all session rows | One explicit final-race selector per event | Avoids counting qualifying, sprint, and points rows as race finishes. |
| Sparkline rendering | New chart library | Existing SVG polyline component with a targeted test | The current component is small, deterministic, and already server-render-safe. |

**Key insight:** Phase 3 is mostly about using the existing shared semantics consistently on public surfaces. The planner should optimize for fewer code paths, not more abstractions.

## Common Pitfalls

### Pitfall 1: Reopening Requirements That Are Already Satisfied

**What goes wrong:** The plan treats RESULT-01, RESULT-02, and RESULT-03 as if the repo still needs new sorting or new column logic.

**Why it happens:** The requirements are still marked pending even though Phase 1/2 already landed most of the shared semantics and tests.

**How to avoid:** Scope those tasks to public-surface verification and regression coverage. Do not redesign `EventParticipationList` or repository ordering helpers.

**Warning signs:** Planned work introduces a new session-order constant in page code or proposes fixed empty columns.

### Pitfall 2: Driver Charts Use All Sessions Instead Of The Race Result

**What goes wrong:** `QS`, `QF`, `S`, or `P` rows appear in the driver trend/heatmap, giving multiple chart points per event or better-looking finishes than the actual race result.

**Why it happens:** [`app/drivers/[slug]/page.tsx`](../../../app/drivers/%5Bslug%5D/page.tsx) currently derives `numericPositions` by flattening every `event.results` entry and chooses `bestSession` for the heatmap instead of the final race.

**How to avoid:** Select the final race session (`f`, plus `secondary` for compatibility) once per event before building chart arrays.

**Warning signs:** The trend line has more points than races, or a heatmap cell shows a qualifying result instead of the race finish.

### Pitfall 3: Blindly “Fixing” Sparkline Orientation

**What goes wrong:** The phase inverts the SVG sparkline even though the current code already maps better finishes to smaller `y` values, which render higher on screen in SVG.

**Why it happens:** SVG coordinates increase downward, so chart direction is easy to reason about incorrectly without a direct test.

**How to avoid:** Add a focused component test that asserts a better finishing position produces a smaller `y` coordinate than a worse one.

**Warning signs:** A code change flips the polyline formula without any accompanying orientation test.

### Pitfall 4: Organizer Rendering Triggers Unnecessary DTO Churn

**What goes wrong:** The plan widens `EventParticipationCard`, result routes, and multiple pages just to show organizer text once on `/results`.

**Why it happens:** `EventParticipationList` is a tempting reuse point, but the existing public read models already carry organizer data in places the results page loads today.

**How to avoid:** Start with results-page labels/headings backed by `getFilters()` and `getCurrentChampionship()`. Widen DTOs only if the implementation truly needs per-event organizer rendering on multiple pages.

**Warning signs:** A task list suddenly touches `lib/server/history/types.ts`, multiple routes, and page consumers only for organizer display.

### Pitfall 5: Losing Legacy Final-Race Compatibility

**What goes wrong:** Driver-page helpers only treat `f` as a race result and ignore `secondary` rows if any compatibility data still leaks through.

**Why it happens:** Repository ordering helpers still understand `secondary` as a final-race alias, but page-level derivation currently has no shared helper.

**How to avoid:** Keep the page helper tolerant of both `f` and `secondary`.

**Warning signs:** Mixed legacy fixtures or route payloads render empty trend/heatmap data even when a final result exists.

## Code Examples

Verified patterns from repo and official sources:

### Public Results Tables Should Stay Data-Driven

```typescript
// Source: app/components/event-participation-list.tsx
function getSessionColumns(event: EventParticipationCard): SessionColumn[] {
  const map = new Map<string, SessionColumn>();

  for (const participant of event.participants) {
    for (const session of participant.sessions) {
      const key = `${session.sessionKind}:${session.sessionLabel}`;
      if (!map.has(key)) {
        map.set(key, {
          sessionKind: session.sessionKind,
          sessionLabel: session.sessionLabel,
        });
      }
    }
  }

  return Array.from(map.values()).sort((left, right) => {
    const byKind = getSessionOrder(left.sessionKind) - getSessionOrder(right.sessionKind);
    if (byKind !== 0) {
      return byKind;
    }

    return left.sessionLabel.localeCompare(right.sessionLabel);
  });
}
```

### Server Pages Should Keep Data Access On The Server

```typescript
// Source: https://nextjs.org/docs/app/building-your-application/rendering/server-components
// Adaptation: keep /results and /drivers/[slug] as server pages that call
// lib/server/history/service.ts directly rather than fetching internal APIs.
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const post = await getPost(id);
  return <main>{post.title}</main>;
}
```

### Vitest Mocking Pattern Already Matches Repo Usage

```typescript
// Source: https://vitest.dev/guide/mocking/modules.html
// Repo-compatible pattern for page and route tests
const { getResultsEventParticipationMock } = vi.hoisted(() => ({
  getResultsEventParticipationMock: vi.fn(),
}));

vi.mock("@/lib/server/history/service", () => ({
  getResultsEventParticipation: getResultsEventParticipationMock,
}));
```

### SVG Trend Direction Should Be Verified, Not Guessed

```typescript
// Source: MDN SVG user-coordinate docs + current app/components/visualizations.tsx pattern
const y = padding + ((position - min) / range) * (height - padding * 2);
// Lower finishing positions (P1, P2) produce smaller y values.
// In SVG, smaller y renders higher on the screen.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Public result tables assumed two sessions (`primary` / `secondary`) | Shared canonical order now supports `QS`, `S`, `QF`, `F`, `P` with legacy aliases preserved | Phase 1 on 2026-04-02 | Public event tables are mostly ready; Phase 3 should preserve, not replace, that behavior. |
| Public participant order favored best numeric finish across available sessions | Repository sorting is now points-first with final-race fallback | Phase 1 on 2026-04-02 | RESULT-02 is already effectively implemented in shared read logic. |
| Race aggregates could have been polluted by non-race rows after canonical expansion | Repository aggregates explicitly filter `er.session_kind = 'f'` | Phase 1 on 2026-04-02 | Driver and current-summary counts are already protected at the SQL layer. |
| Driver-page charts assumed every session row was fair game | Phase 3 should use one final-race result per event for trend/heatmap inputs | Pending | This is the main remaining stats-correctness task. |

**Deprecated/outdated:**

- Two-session-only public reasoning is outdated for event table rendering.
- Any plan that proposes a fixed five-column public header for all events is outdated relative to the current sparse-column implementation.

## Open Questions

1. **Should organizer text appear only on `/results`, or also on reused event cards elsewhere?**
   - What we know: `organizerName` already exists on `filters.championships` and `current.championship`, but not on `EventParticipationCard`.
   - What's unclear: whether product intent is a results-page-only label or organizer text on every event-card header across results, home, and driver history.
   - Recommendation: Start with `/results` labels/headings only. Delay DTO widening unless implementation proves a second public surface needs the same data.

2. **Should race-only session selection be extracted or kept local?**
   - What we know: the bug is currently local to `app/drivers/[slug]/page.tsx`.
   - What's unclear: whether another public page in this phase will need the same helper.
   - Recommendation: Implement a small page-local helper first. Extract only if a second consumer appears during implementation.

3. **Does STAT-01 require code changes or just explicit verification?**
   - What we know: current sparkline math already maps lower positions to smaller SVG `y` values, which display higher on screen.
   - What's unclear: whether a product expectation exists that contradicts the current up-is-better reading.
   - Recommendation: Treat STAT-01 as test-first verification unless manual review shows a different visual issue in the running page.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest `^3.2.4` |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run tests/results-page.flow.spec.ts tests/history-repository.spec.ts tests/history-api.spec.ts tests/history-api-v2.spec.ts tests/driver-profile-page.flow.spec.ts` |
| Full suite command | `npm run test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RESULT-01 | Public result tables preserve `QS`, `S`, `QF`, `F`, `P` display order | flow + route | `npx vitest run tests/results-page.flow.spec.ts tests/history-api.spec.ts` | ✅ |
| RESULT-02 | Public participants stay points-first | repository + flow | `npx vitest run tests/history-repository.spec.ts tests/results-page.flow.spec.ts` | ✅ |
| RESULT-03 | Sparse historical events hide empty canonical columns | flow + route | `npx vitest run tests/results-page.flow.spec.ts tests/history-api.spec.ts` | ✅ |
| RESULT-04 | Results page renders organizer in a public championship label or heading | flow | `npx vitest run tests/results-page.flow.spec.ts -t organizer` | ✅ extend existing spec |
| STAT-01 | Sparkline plots better finishes as better performance | component/unit | `npx vitest run tests/driver-visualizations.spec.ts` | ❌ Wave 0 |
| STAT-02 | Driver page trend/heatmap and aggregate race stats stay race-correct | repository + flow | `npx vitest run tests/history-repository.spec.ts tests/driver-profile-page.flow.spec.ts` | ✅ partial; flow gap remains |

### Sampling Rate

- **Per task commit:** `npx vitest run tests/results-page.flow.spec.ts tests/driver-profile-page.flow.spec.ts tests/history-repository.spec.ts`
- **Per wave merge:** `npx vitest run tests/results-page.flow.spec.ts tests/history-repository.spec.ts tests/history-api.spec.ts tests/history-api-v2.spec.ts tests/driver-profile-page.flow.spec.ts tests/driver-visualizations.spec.ts`
- **Phase gate:** `npm run test` plus manual `/results` and `/drivers/[slug]` sanity review before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `tests/driver-visualizations.spec.ts` — direct sparkline-orientation assertions for STAT-01.
- [ ] Extend `tests/driver-profile-page.flow.spec.ts` with mixed `qs`/`s`/`qf`/`f`/`p` event data to prove trend and heatmap use only the race result for STAT-02.
- [ ] Extend `tests/results-page.flow.spec.ts` with an organizer-rendering assertion for RESULT-04.
- [ ] `npm run test` currently has a repo-wide blocker unrelated to this phase: `tests/history-parser.spec.ts` expects `data-source/Historia The New Project.xlsx`, which is missing in this checkout.

## Sources

### Primary (HIGH confidence)

- Local repo: `package.json`, `vitest.config.ts`, `app/results/page.tsx`, `app/drivers/[slug]/page.tsx`, `app/components/event-participation-list.tsx`, `app/components/visualizations.tsx`, `lib/server/history/repository.ts`, `tests/results-page.flow.spec.ts`, `tests/history-repository.spec.ts`, `tests/history-api.spec.ts`, `tests/history-api-v2.spec.ts`, `tests/driver-profile-page.flow.spec.ts`
- Next.js official docs: https://nextjs.org/docs/app/building-your-application/rendering/server-components - verified that App Router pages are server components by default and should keep data fetching on the server.
- Next.js official docs: https://nextjs.org/docs/app/building-your-application/routing/route-handlers - verified current App Router route-handler conventions and supported HTTP-method model.
- React official docs: https://react.dev/reference/rsc/server-components - verified React 19 Server Components stability guidance.

### Secondary (MEDIUM confidence)

- Vitest official docs: https://vitest.dev/guide/mocking/modules.html - verified the repo’s `vi.hoisted()` + `vi.mock()` test pattern for page and route modules.
- MDN SVG docs: https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/points and https://developer.mozilla.org/en-US/docs/Web/API/SVGSVGElement/y - verified SVG point coordinates and `y` semantics used to reason about sparkline direction.

### Tertiary (LOW confidence)

- None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - repo-pinned versions plus official framework docs.
- Architecture: HIGH - derived from direct code inspection and targeted passing Phase 3-related tests.
- Pitfalls: HIGH - organizer and driver-page gaps are visible in concrete current code paths; only organizer-placement scope remains slightly product-dependent.

**Research date:** 2026-04-02
**Valid until:** 2026-05-02
