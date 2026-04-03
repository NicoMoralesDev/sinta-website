---
phase: quick-260403-qtw-results-table-polish
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - lib/server/history/types.ts
  - lib/server/history/repository.ts
  - app/components/event-participation-helpers.ts
  - app/components/event-participation-list.tsx
  - app/api/v1/results/events/[id]/image/route.ts
  - app/results/page.tsx
  - tests/history-repository.spec.ts
  - tests/history-share-image-route.spec.ts
  - tests/results-page.flow.spec.ts
  - docs/results-model.md
autonomous: true
requirements: []
must_haves:
  truths:
    - "On `/results`, event tables show compact abbreviations only on small screens, while tablet/desktop uses full session labels and `PTS` for points."
    - "Points cells render raw totals instead of `Pxx`, and their styling does not reuse finishing-position winner/top-10 semantics."
    - "The ranking and current-championship summary tables show total points alongside wins, podiums, and top-10 counts without dropping the existing organizer and CTA behavior."
  artifacts:
    - path: "lib/server/history/types.ts"
      provides: "Public history types that expose total points in stats and current leaderboard payloads"
    - path: "lib/server/history/repository.ts"
      provides: "SQL aggregation for `session_kind = 'p'` and current-championship leaderboard mapping"
    - path: "app/components/event-participation-helpers.ts"
      provides: "Shared label/value metadata for compact vs full session presentation and points-specific formatting"
    - path: "app/components/event-participation-list.tsx"
      provides: "Responsive event-results rendering with readable mobile rows, yellow separators, and points-aware badges"
    - path: "app/api/v1/results/events/[id]/image/route.ts"
      provides: "Share-image rendering aligned with the updated public points headers and values"
    - path: "app/results/page.tsx"
      provides: "Sidebar summary tables updated to include total points and avoid `P` label ambiguity"
    - path: "tests/history-repository.spec.ts"
      provides: "Repository assertions for points aggregation in driver stats and current leaderboard results"
    - path: "tests/history-share-image-route.spec.ts"
      provides: "Route assertions that keep share-image points semantics aligned with the shared helpers"
    - path: "tests/results-page.flow.spec.ts"
      provides: "Rendered-markup coverage for public labels, summary-table points, and preserved share/filter links"
    - path: "docs/results-model.md"
      provides: "Maintainer guidance for the updated public label and points presentation rules"
  key_links:
    - from: "lib/server/history/repository.ts"
      to: "app/results/page.tsx"
      via: "the `totalPoints` fields returned by stats and current championship queries"
      pattern: "totalPoints"
    - from: "app/components/event-participation-helpers.ts"
      to: "app/components/event-participation-list.tsx"
      via: "shared session label/value metadata for desktop, mobile, and points formatting"
      pattern: "formatEventParticipationSessionValue|getEventParticipationSessionColumns"
    - from: "app/components/event-participation-helpers.ts"
      to: "app/api/v1/results/events/[id]/image/route.ts"
      via: "shared points/header formatting reused by the image renderer"
      pattern: "formatEventParticipationSessionValue|getEventParticipationSessionColumns"
    - from: "tests/results-page.flow.spec.ts"
      to: "app/results/page.tsx"
      via: "static markup assertions for headers, totals, and preserved links"
      pattern: "renderToStaticMarkup"
---

<objective>
Polish the public results presentation so the tables are readable on mobile, points are visually and semantically distinct from finishing positions, and the sidebar summaries include total points.

Purpose: Ship the requested UI corrections with the smallest possible surface area by reusing the shared event-results helpers, existing `/results` page structure, and the current repository query layer.
Output: Updated shared event-table rendering, aligned share-image output, leaderboard points aggregation, refreshed `/results` summary tables, and focused regression coverage/docs.
</objective>

<execution_context>
@/home/nico/.codex/get-shit-done/workflows/execute-plan.md
@/home/nico/.codex/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@AGENTS.md
@package.json
@.planning/quick/260403-qtw-hay-algunas-mejoras-y-errores-a-corregir/260403-qtw-RESEARCH.md
@.skills/planning-and-verification/SKILL.md
@.skills/version-aware-implementation/SKILL.md
@app/components/event-participation-helpers.ts
@app/components/event-participation-list.tsx
@app/api/v1/results/events/[id]/image/route.ts
@app/results/page.tsx
@lib/server/history/types.ts
@lib/server/history/repository.ts
@tests/history-repository.spec.ts
@tests/results-page.flow.spec.ts
@tests/history-share-image-route.spec.ts
@docs/results-model.md

<interfaces>
From `app/components/event-participation-helpers.ts`:
```ts
export type EventParticipationSessionColumn = {
  sessionKind: EventParticipationEntry["sessions"][number]["sessionKind"];
  sessionLabel: string;
};

export function getEventParticipationSessionColumns(
  event: EventParticipationCard,
): EventParticipationSessionColumn[];

export function formatEventParticipationSessionValue(
  session: EventParticipationEntry["sessions"][number],
  lang: Language,
): string;
```

From `lib/server/history/types.ts`:
```ts
export type DriverStats = {
  driverSlug: string;
  canonicalName: string;
  wins: number;
  podiums: number;
  top5: number;
  top10: number;
  completed: number;
  dnf: number;
  dnq: number;
  dsq: number;
  absent: number;
};

export type CurrentChampionshipSummary = {
  championship: {
    id: string;
    seasonYear: number;
    slug: string;
    name: string;
    organizerName: string | null;
  };
  events: EventParticipationCard[];
  leaderboard: Array<{
    driverSlug: string;
    driverName: string;
    wins: number;
    podiums: number;
    top10: number;
    completed: number;
    avgPosition: number | null;
  }>;
};
```
</interfaces>

<notes>
- The quick-task folder does not currently contain the three promised reference images, so implementation should follow the textual requirements and keep visual tuning isolated.
- Keep the canonical `qs/s/qf/f/p` ordering and sparse historical column visibility unchanged.
- Use the existing admin/public wording already present in the repo for long-form labels unless the missing reference images later require copy tuning.
- No new dependencies are justified; stay within Next.js `16.1.6`, React `19.2.4`, Tailwind `4.1.18`, and Vitest `3.2.4`.
</notes>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Extend the results data contract with total-points aggregation</name>
  <files>lib/server/history/types.ts, lib/server/history/repository.ts, tests/history-repository.spec.ts</files>
  <behavior>
    - Driver stats returned to `/results` expose a numeric `totalPoints` field derived from active `session_kind = 'p'` rows.
    - The current championship leaderboard exposes the same numeric `totalPoints` field without changing the existing row limit, organizer metadata, or sort order in this quick task.
    - Points are aggregated in SQL, not inferred from formatted UI strings or final-race positions.
  </behavior>
  <action>Add `totalPoints` to the `DriverStats` type and the `CurrentChampionshipSummary.leaderboard` entry type in `lib/server/history/types.ts`. In `lib/server/history/repository.ts`, widen the stats and current-championship leaderboard row types plus both queries so they sum active `event_results.position` values only when `session_kind = 'p'`; keep the existing wins/podiums/top-10 ordering intact unless the current query already depends on points. Update `tests/history-repository.spec.ts` fixtures and assertions so repository coverage proves `totalPoints` is mapped for both `getDriverStats()` and `getCurrentChampionshipSummary()`. Do not parse points from `raw_value`, do not repurpose final-race rows, and do not change unrelated DTOs.</action>
  <verify>
    <automated>npm run test -- tests/history-repository.spec.ts</automated>
  </verify>
  <done>`/results` server data can render total points for the filtered ranking and current-championship summary from explicit backend fields.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Rework shared event-table presentation for points semantics and mobile readability</name>
  <files>app/components/event-participation-helpers.ts, app/components/event-participation-list.tsx, app/api/v1/results/events/[id]/image/route.ts, tests/history-share-image-route.spec.ts</files>
  <behavior>
    - Public event tables keep canonical sparse columns, but desktop/tablet shows full labels while small screens use compact abbreviations and `PTS` for points.
    - Desktop/tablet headers stay readable by allowing wrapped/two-line full labels when needed instead of widening into a squeezed single-line grid.
    - Points values render as raw numbers without a leading `P`, and points badges do not inherit podium/winner color semantics.
    - Mobile event rows are readable without forcing the current six-column compressed grid, and the share image stays aligned with the updated points formatting.
  </behavior>
  <action>Create or widen a small shared presentation helper in `app/components/event-participation-helpers.ts` so session rendering can distinguish full label, compact label, aria text, and value formatting by `sessionKind`. Treat `p` specially: compact label `PTS`, raw numeric value, and a dedicated neutral/yellow points tone rather than the current finishing-position palette. In `app/components/event-participation-list.tsx`, keep the existing `md+` grid path but add responsive label swapping with the repo’s `hidden md:inline` / `md:hidden` pattern, add the yellow column separators requested by the user, and replace the current cramped small-screen row layout with a compact stacked/card presentation that still uses the same underlying columns. Update `app/api/v1/results/events/[id]/image/route.ts` so the generated image matches the new points header/value semantics and does not show `P25` once the web table shows `25`. Extend `tests/history-share-image-route.spec.ts` to lock the helper and share-image parity. Do not fabricate missing historical columns, do not create a second event DTO, and do not add client-side measurement logic.</action>
  <verify>
    <automated>npm run test -- tests/history-share-image-route.spec.ts</automated>
  </verify>
  <done>The public event list and share image treat points as points, not finishing positions, desktop/tablet headers can wrap into readable full-label rows, and mobile rows are structured for readability instead of squeezed fixed-width columns.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Update `/results` sidebar summaries, flow coverage, and docs</name>
  <files>app/results/page.tsx, tests/results-page.flow.spec.ts, docs/results-model.md</files>
  <behavior>
    - The ranking and current-championship tables both show total points in addition to wins, podiums, and top-10 counts.
    - Summary-table headers no longer overload `P` for both podiums and points, while the existing organizer copy, current-championship CTA, and share/filter link behavior remain intact.
    - Maintainer docs describe the public label split (desktop full labels vs mobile abbreviations) and the new points formatting rules.
  </behavior>
  <action>In `app/results/page.tsx`, update both sidebar summary tables together. Prefer extracting one small local summary-table renderer or shared config so the header and cell changes land in one place. Add a total-points column fed by the new backend field, rename the podium header to avoid collision with points, and keep row ordering/limits, organizer display, and `filterCurrent` behavior unchanged. Extend `tests/results-page.flow.spec.ts` so rendered-markup assertions cover the updated points header/value output, the added total-points cells in both summary tables, and the still-correct share-image/filter links. Update `docs/results-model.md` to document that public event tables now use full labels on larger screens, compact abbreviations on small screens, and raw numeric points values with `PTS` instead of `P` in compact contexts. Do not rewrite the whole page or add new page-level client components.</action>
  <verify>
    <automated>npm run test -- tests/results-page.flow.spec.ts</automated>
  </verify>
  <done>`/results` shows total points everywhere requested, the sidebar and event-table labels are no longer ambiguous, and the public behavior is documented and regression-tested.</done>
</task>

</tasks>

<verification>
Run `npm run test -- tests/history-repository.spec.ts`, `npm run test -- tests/history-share-image-route.spec.ts`, `npm run test -- tests/results-page.flow.spec.ts`, and `npm run typecheck`. After the automated checks pass, manually inspect `/results` on a narrow mobile viewport and on a desktop-width viewport, confirming the yellow separators plus the wrapped/two-line full-label headers against the user’s textual requirements because the reference image files are not present in the task folder.
</verification>

<success_criteria>
The public results experience becomes readable on mobile, points are visually distinct from placements across the page and share image, and both sidebar summary tables expose total points with focused regression coverage.
</success_criteria>
