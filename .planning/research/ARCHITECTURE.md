# Architecture Research

**Domain:** Brownfield motorsport results website and admin platform milestone integration
**Researched:** 2026-04-02
**Confidence:** HIGH

## Standard Architecture

### System Overview

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                            App Router Entry Layer                           │
├──────────────────────────────────────────────────────────────────────────────┤
│  app/results/page.tsx       app/drivers/[slug]/page.tsx                    │
│  app/admin/events/page.tsx  app/api/v1/results/**  app/api/v1/admin/**     │
└───────────────────────────────┬──────────────────────────────────────────────┘
                                │
┌──────────────────────────────────────────────────────────────────────────────┐
│                         UI And Route Adapter Layer                          │
├──────────────────────────────────────────────────────────────────────────────┤
│  Public UI: EventParticipationList, visualizations, results page chrome    │
│  Admin UI: events-manager and results grid editor                           │
│  New: share-image route handler for one event table                         │
└───────────────────────────────┬──────────────────────────────────────────────┘
                                │
┌──────────────────────────────────────────────────────────────────────────────┐
│                           Domain Service Layer                              │
├──────────────────────────────────────────────────────────────────────────────┤
│  lib/server/history/service.ts  lib/server/admin/service.ts                 │
│  Query parsing, validation, orchestration, DTO shaping                      │
└───────────────────────────────┬──────────────────────────────────────────────┘
                                │
┌──────────────────────────────────────────────────────────────────────────────┐
│                         Repository And Persistence                          │
├──────────────────────────────────────────────────────────────────────────────┤
│  lib/server/history/repository.ts  lib/server/admin/repository.ts           │
│  db/migrations/*.sql  event_results / events / championships / drivers      │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Public results composition | Render event participation cards and preserve filter URLs | `app/results/page.tsx` plus `app/components/event-participation-list.tsx` |
| Driver analytics composition | Build trend, heatmap, and history cards from history DTOs | `app/drivers/[slug]/page.tsx` plus `app/components/visualizations.tsx` |
| Admin event results editor | Load and replace per-event result cells | `app/admin/_components/events-manager.tsx` via `/api/v1/admin/events/[id]/results` |
| History read domain | Expose public event/result DTOs and event-specific read models | `lib/server/history/service.ts` and `lib/server/history/repository.ts` |
| Admin write domain | Validate result mutations and persist audit-backed writes | `lib/server/admin/service.ts` and `lib/server/admin/repository.ts` |
| Shareable image generation | Render one event participation table as a server-generated image | New route handler under `app/api/v1/results/events/[id]/image/route.ts` backed by history service data |

## Recommended Project Structure

```text
app/
├── results/page.tsx                               # Public results hub
├── drivers/[slug]/page.tsx                        # Driver profile and charts
├── components/event-participation-list.tsx        # Canonical event table renderer
├── components/visualizations.tsx                  # Driver trend and heatmap widgets
├── api/v1/results/events/route.ts                 # Existing event list JSON API
├── api/v1/results/events/[id]/image/route.ts      # New shareable image asset route
├── api/v1/admin/events/[id]/results/route.ts      # Existing admin event results API
└── admin/_components/events-manager.tsx           # Existing admin results editor
lib/server/
├── history/types.ts                               # Shared result session contracts
├── history/service.ts                             # Public read orchestration
├── history/repository.ts                          # Public SQL and row mapping
├── admin/types.ts                                 # Admin event grid contracts
├── admin/service.ts                               # Admin validation and audit orchestration
└── admin/repository.ts                            # Admin event result persistence
db/
└── migrations/009_*.sql                           # Next migration for qualy support
docs/
├── admin-dashboard.md                             # Admin workflow notes
├── data-import.md                                 # Import workflow notes
└── future-features.md                             # Deferred share/social scope stays here
README.md                                          # Public developer-facing contract summary
```

### Structure Rationale

- **Keep all result-model expansion inside the existing `history` and `admin` domains:** the repo already separates public reads from admin writes cleanly enough for this milestone. Adding a new domain for `qualy` or sharing would be unnecessary churn.
- **Treat the shareable image as a public asset endpoint, not a new page type:** the existing public API tree under `app/api/v1/results/**` is the right boundary for a generated PNG/JPEG response keyed by `eventId`.
- **Keep event-table rendering logic centered around `EventParticipationCard`:** the public page, admin preview decisions, and share-image output should all read from the same history DTO shape rather than inventing a second event-table model.

## Architectural Patterns

### Pattern 1: Expand The Session Model At The Type And Schema Boundary

**What:** Add `qualy` as a third `session_kind` in the database and shared TypeScript contracts, then let both public and admin flows consume it through existing result DTOs.
**When to use:** For the optional qualifying-result feature. This is the only milestone item that changes the persistence contract.
**Trade-offs:** Lowest long-term duplication, but it touches migrations, parser/import assumptions, shared types, repository SQL, admin validation, and UI ordering in one sweep.

**Where it lands:**
- `db/migrations/009_*.sql`: extend `session_kind` enum to include `qualy`
- `lib/server/history/types.ts`: change `SessionKind` from `"primary" | "secondary"` to `"qualy" | "primary" | "secondary"`
- `lib/server/admin/types.ts`: allow `qualy` in admin result inputs and grids
- `lib/server/history/repository.ts`: map `qualy` labels and preserve deterministic ordering
- `lib/server/admin/repository.ts`: reshape the admin grid away from hard-coded `primary`/`secondary`
- `lib/server/admin/service.ts`: validate uniqueness by `(driverId, sessionKind)` with `qualy` included
- `scripts/import-results-xlsx.ts` and `lib/server/history/parser.ts`: only if the import format is expected to ingest qualy from spreadsheets in this milestone

**Opinionated recommendation:** Keep the label fixed as `Qualy` for now. Do not add `qualy_session_label` to `championships` unless there is a real requirement for championship-specific naming. The current milestone needs optional data support, not more configuration surface.

**Example:**
```typescript
export type SessionKind = "qualy" | "primary" | "secondary";

function getSessionOrder(kind: SessionKind): number {
  if (kind === "qualy") return 0;
  if (kind === "primary") return 1;
  return 2;
}
```

### Pattern 2: Make The Admin Results Grid Session-Driven, Not Column-Driven

**What:** Replace the fixed two-column admin editor shape with a session-aware grid derived from the event result DTO.
**When to use:** For the `qualy` editing flow in `/admin/events`.
**Trade-offs:** Slightly larger UI refactor in `events-manager.tsx`, but it avoids repeating the same problem for every future session type and removes the current hard-coded “2 sessions per event” assumption.

**Where it lands:**
- `lib/server/admin/types.ts`: replace `{ primary, secondary }` with `sessions: Array<{ sessionKind, ... }>` or `sessionsByKind`
- `lib/server/admin/repository.ts`: build the grid from active drivers plus arbitrary session kinds
- `app/admin/_components/events-manager.tsx`: render one input column per session definition, with `qualy` shown first and hidden only when empty for all drivers if product wants a cleaner editor

**Recommendation:** Use a fixed ordered session list `["qualy", "primary", "secondary"]` in the admin editor, even if some cells are blank. Admin needs explicit data-entry affordances. The “hide when absent” rule matters for public presentation, not for editing.

**Example:**
```typescript
const sessionKinds: SessionKind[] = ["qualy", "primary", "secondary"];

const rows = drivers.map((driver) => ({
  driverId: driver.id,
  driverName: driver.canonicalName,
  cells: sessionKinds.map((sessionKind) => ({
    sessionKind,
    value: byDriverAndSession.get(`${driver.id}:${sessionKind}`) ?? null,
  })),
}));
```

### Pattern 3: Reuse History Read Models For Shareable Images

**What:** Generate the shareable event-results image from the same event participation DTO used by the public results UI, through a dedicated public route handler.
**When to use:** For the event-specific share flow.
**Trade-offs:** This adds one more read use case in the history domain, but it avoids duplicating SQL or formatting logic inside the image route.

**Where it lands:**
- New `lib/server/history/service.ts` read method like `getEventParticipationById(eventId)`
- New `lib/server/history/repository.ts` query that fetches one event plus grouped sessions/participants
- New `app/api/v1/results/events/[id]/image/route.ts` returning an `ImageResponse`
- `app/components/event-participation-list.tsx` or a nearby helper for shared session ordering/formatting rules
- `app/results/page.tsx` for the user-facing “share/download image” trigger

**Recommendation:** Keep image composition separate from normal page components. `ImageResponse` rendering has different constraints than normal React UI, so share formatting helpers, not full components.

**Example:**
```typescript
export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const card = await getEventParticipationById(id, new URL(request.url).searchParams);
  return new ImageResponse(<EventResultsImage card={card} />, {
    width: 1200,
    height: 1600,
  });
}
```

## Data Flow

### Request Flow

```text
[Admin edit qualy/result cells]
    ↓
[events-manager.tsx]
    ↓
[PUT /api/v1/admin/events/:id/results]
    ↓
[admin/service.updateEventResults]
    ↓
[admin/repository.replaceEventResults]
    ↓
[event_results]
    ↓
[history/repository reads updated sessions]
    ↓
[results page / driver page / share-image route]
```

### State Management

```text
[Server data from history/admin services]
    ↓
[Server pages render initial props]
    ↓
[Admin local component state for editable rows]
    ↓
[fetch mutation]
    ↓
[router.refresh()]
    ↓
[Server re-render with persisted data]
```

### Key Data Flows

1. **Optional qualy flow:** admin writes `qualy` cells into `event_results`; history repository returns the extra session; public table rendering adds a `Qualy` column only when at least one participant has that session for the event.
2. **Share image flow:** results page exposes an event-level share action; the action calls a new image route; the route loads one `EventParticipationCard`; image markup renders the same ordered session columns as the public table.
3. **Driver chart flow:** driver page derives chart series from race-result sessions only, not blindly from every session in `event.results`, so adding `qualy` does not distort a race-position chart.

## Feature Integration Plan

### 1. Optional Qualy Result Support

**Primary integration points**
- `db/migrations/009_*.sql`
- `lib/server/history/types.ts`
- `lib/server/admin/types.ts`
- `lib/server/history/repository.ts`
- `lib/server/admin/repository.ts`
- `lib/server/admin/service.ts`
- `app/admin/_components/events-manager.tsx`
- `app/components/event-participation-list.tsx`
- `tests/history-repository.spec.ts`
- new or updated admin API/service tests

**Boundary decisions**
- Persist qualy in the existing `event_results` table.
- Do not create a new `event_qualifying_results` table.
- Keep public hiding logic at the presentation layer: if no participant in an event has `qualy`, `EventParticipationList` should not render that column.
- Keep admin editing explicit and session-driven so editors can add qualy without hidden controls.

### 2. Shareable Image For A Specific Event Results Table

**Primary integration points**
- New `app/api/v1/results/events/[id]/image/route.ts`
- `lib/server/history/service.ts`
- `lib/server/history/repository.ts`
- `app/results/page.tsx`
- optionally a small new public component for the share/download trigger

**Boundary decisions**
- Use a public route handler, not an admin endpoint.
- Fetch by `eventId`, which is already present in `EventParticipationCard`.
- Keep output focused on one event table and branding metadata only; do not couple this to social APIs or OG metadata automation yet.

### 3. Recent-Positions Chart Axis Fix

**Primary integration points**
- `app/components/visualizations.tsx`
- `app/drivers/[slug]/page.tsx`
- `tests/driver-profile-page.flow.spec.ts`

**Boundary decisions**
- Fix the chart in the page/component layer, not in the repository.
- Invert the sparkline Y mapping so better positions render higher on the chart.
- Introduce a local selector for chart-worthy sessions. Once `qualy` exists, the chart must either exclude `qualy` or clearly rename itself to a broader “session trend”. For this milestone, exclude `qualy`.

### 4. Documentation Refresh

**Primary integration points**
- `README.md`
- `docs/admin-dashboard.md`
- `docs/data-import.md`
- optionally `docs/future-features.md` only to keep direct social sharing deferred

**Boundary decisions**
- Document the new optional `qualy` behavior and the new image endpoint/flow.
- Document whether imports can populate qualy yet or whether qualy is admin-only for now.
- Keep docs aligned with actual implemented route paths and admin screens.

## Suggested Build Order

1. **Stabilize the result model contract first**
   - Add the migration and shared `SessionKind` type changes.
   - Refactor repository/service code that assumes only `primary` and `secondary`.
   - This is the hard dependency for every other `qualy`-aware consumer.

2. **Refactor admin event results editing next**
   - Update `AdminEventResultsGrid`, admin repository shaping, validation, and `events-manager.tsx`.
   - This gives maintainers a way to enter and verify qualy before public exposure depends on it.

3. **Update public event result rendering**
   - Extend `EventParticipationList` session ordering to `qualy`, `primary`, `secondary`.
   - Preserve the “hide qualy when absent” rule by deriving visible columns from actual event data.
   - This completes the main user-visible part of the qualy feature.

4. **Build the shareable image route on top of the stabilized public event DTO**
   - Add a history-domain read for one event by id.
   - Add `app/api/v1/results/events/[id]/image/route.ts`.
   - Add a small trigger from the results page UI.
   - This should come after step 3 so the image and page use the same session ordering and visibility rules.

5. **Apply the driver chart fix after the session model is expanded**
   - Fix Y-axis inversion in `SparklinePositions`.
   - Filter out `qualy` from race-position analytics on the driver page.
   - Doing this after the model expansion avoids reworking the selector twice.

6. **Refresh documentation last**
   - Update README and operational docs only once endpoints, admin behavior, and import expectations are final.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Current milestone scale | Keep the monolith and existing repositories. The feature set is still well within a single Next.js app and Postgres schema. |
| More event-session variants later | Extract shared session-order/label helpers so `qualy` does not become another hard-coded branch scattered across pages and repositories. |
| Higher share-image traffic | Cache the image route response at the CDN/HTTP level before introducing any new rendering service. |

### Scaling Priorities

1. **First bottleneck:** repeated session-kind branching across history/admin code. Fix it now with shared ordering and label helpers.
2. **Second bottleneck:** duplicate formatting logic between HTML tables and image rendering. Share selectors and formatting helpers, not SQL or JSX duplication.

## Anti-Patterns

### Anti-Pattern 1: Treat Qualy As A Frontend-Only Column

**What people do:** Add a third input or column in the UI while leaving `SessionKind`, SQL ordering, and validation fixed to two sessions.
**Why it's wrong:** The repo currently hard-codes `primary`/`secondary` at the schema, type, parser, admin grid, and repository levels. A UI-only patch will drift immediately.
**Do this instead:** Change the persistence and shared type boundary first, then adapt admin and public rendering off that shared contract.

### Anti-Pattern 2: Build Share Images From A Separate Ad Hoc Query

**What people do:** Add a one-off route handler that queries `event_results` directly and reimplements event grouping, labels, and ordering.
**Why it's wrong:** The image will diverge from `/results`, especially once `qualy` visibility rules change.
**Do this instead:** Add one history-domain read for “event participation by id” and make both page UI and image generation depend on the same DTO semantics.

### Anti-Pattern 3: Let Driver Charts Consume Every Session Type

**What people do:** Continue deriving `numericPositions` from all `event.results` entries after `qualy` is added.
**Why it's wrong:** The chart is currently understood as recent race positions. Injecting qualifying results changes its meaning and can hide the actual axis-fix bug under noisier data.
**Do this instead:** Add a small page-level selector that chooses the race sessions used by analytics widgets.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Postgres | Existing repository modules plus one migration | `qualy` support is fundamentally a schema and SQL concern first |
| Next.js `ImageResponse` | Route handler under `app/api/v1/results/events/[id]/image/route.ts` | Appropriate for generated image assets in the App Router; do not introduce extra image libraries for v1 |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `app/admin/_components/events-manager.tsx` ↔ `app/api/v1/admin/events/[id]/results/route.ts` | HTTP JSON | Update payload and grid shape to be session-driven |
| `app/api/v1/admin/events/[id]/results/route.ts` ↔ `lib/server/admin/service.ts` | Direct service call | Validation and audit behavior remain in the admin domain |
| `lib/server/admin/service.ts` ↔ `lib/server/admin/repository.ts` | Direct function call | Repository owns `event_results` persistence and grid assembly |
| `app/results/page.tsx` ↔ `lib/server/history/service.ts` | Direct service call | Public page should continue to avoid fetching its own internal API |
| `app/api/v1/results/events/[id]/image/route.ts` ↔ `lib/server/history/service.ts` | Direct service call | Image route should reuse public read logic, not admin code |
| `app/drivers/[slug]/page.tsx` ↔ `app/components/visualizations.tsx` | Props | Keep chart selection/filtering close to the page, keep the SVG component focused on rendering |

## Sources

- Local architecture baseline: `/home/nico/projects/sinta-website/.planning/PROJECT.md`
- Local codebase map: `/home/nico/projects/sinta-website/.planning/codebase/ARCHITECTURE.md`
- Local structure map: `/home/nico/projects/sinta-website/.planning/codebase/STRUCTURE.md`
- Local risk map: `/home/nico/projects/sinta-website/.planning/codebase/CONCERNS.md`
- Current implementation: `/home/nico/projects/sinta-website/app/admin/_components/events-manager.tsx`
- Current implementation: `/home/nico/projects/sinta-website/app/components/event-participation-list.tsx`
- Current implementation: `/home/nico/projects/sinta-website/app/components/visualizations.tsx`
- Current implementation: `/home/nico/projects/sinta-website/app/drivers/[slug]/page.tsx`
- Current implementation: `/home/nico/projects/sinta-website/lib/server/history/types.ts`
- Current implementation: `/home/nico/projects/sinta-website/lib/server/history/repository.ts`
- Current implementation: `/home/nico/projects/sinta-website/lib/server/admin/types.ts`
- Current implementation: `/home/nico/projects/sinta-website/lib/server/admin/service.ts`
- Current implementation: `/home/nico/projects/sinta-website/lib/server/admin/repository.ts`
- Current schema: `/home/nico/projects/sinta-website/db/migrations/001_results_schema.sql`
- Current docs: `/home/nico/projects/sinta-website/README.md`
- Next.js Route Handlers docs, last updated March 31, 2026: https://nextjs.org/docs/app/getting-started/route-handlers
- Next.js `ImageResponse` API reference: https://nextjs.org/docs/app/api-reference/functions/image-response

---
*Architecture research for: SINTA Website milestone integration*
*Researched: 2026-04-02*
