# Phase 1: Results Contract, Ordering, And Championship Metadata - Research

**Researched:** 2026-04-02
**Domain:** Canonical event-result contract widening in an existing Next.js + Postgres results system
**Confidence:** HIGH

## User Constraints

### Locked Decisions

- Canonical result columns are `QS`, `S`, `QF`, `F`, and `P`.
- Event ordering must use points (`P`) instead of final-race position.
- Historical events may legitimately lack `QS`, `QF`, or `P` values and must remain backward compatible without synthetic data.
- Organizer metadata belongs at the championship/tournament level, not on individual event-result rows.
- This phase is data-contract work first. Admin UX changes belong to Phase 2, public rendering polish belongs to Phase 3.

### Claude's Discretion

- Exact Postgres migration shape for widening `event_results` and `championships`.
- Exact shared DTO shape for canonical result fields.
- Whether Phase 1 includes CLI import-path support now or only save/read support plus a documented import gap.
- Exact fallback ordering rule for historical events that have no stored points.

### Deferred Ideas (OUT OF SCOPE)

- Direct social integrations or admin upload UX.
- Historical backfill of missing `QS`, `QF`, or `P` values where trusted source data does not already exist.
- Broad public UI redesign beyond the contract/order metadata work needed to keep later phases unblocked.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-01 | Admin can store event participant results using the canonical columns `QS`, `S`, `QF`, `F`, and `P` | Requires a widened DB contract, canonical field constants/types, admin validation updates, and repository/service persistence support. |
| DATA-02 | Admin can import or save event results with `QS`, `QF`, or `P` values without losing existing event data | Requires preserving the replace-all save semantics safely, defining legacy-null behavior, and explicitly documenting canonical XLSX import widening as deferred until a committed workbook fixture exists. |
| DATA-03 | Public consumers can retrieve event result data with canonical result fields and points-based ordering | Requires a canonical public DTO, a shared points-first participant ordering helper, and repository filtering so race stats do not accidentally count non-race fields. |
| DATA-04 | Maintainer can store organizer metadata for each championship/tournament | Requires a championship-level schema addition, admin DTO/API support, and shared read models that expose organizer data without duplicating it onto events. |
</phase_requirements>

## Summary

The current repo is built around a two-session assumption from database to UI. `event_results` stores one row per `(event, driver, session_kind)` with `session_kind` limited to `"primary"` and `"secondary"`, and the public participation view sorts drivers by the best numeric position found across all stored sessions. That model is not compatible with the requested five-field contract because `P` is not a race session, `QS`/`QF` can be absent on historical events, and several aggregates currently treat every numeric `position` as race data.

The safest Phase 1 plan is additive and centralized: widen the existing persistence model rather than introducing a second parallel result store, define one canonical field-order contract shared across admin/history types, centralize participant ordering around points, and add championship organizer metadata directly to `championships`. The planner should treat this as schema plus shared-domain work, not as a UI phase. The most important repo touch points are `db/migrations/*.sql`, `lib/server/history/types.ts`, `lib/server/admin/types.ts`, `lib/server/history/repository.ts`, `lib/server/admin/repository.ts`, `lib/server/admin/service.ts`, `app/api/v1/admin/events/[id]/results/route.ts`, and `app/api/v1/admin/championships/route.ts`.

The biggest scope question is import. The repo already has a supported CLI import path in `scripts/import-results-xlsx.ts`, but the parser currently hardcodes paired `"primary"/"secondary"` columns from the workbook. Phase 1 should not invent a new upload flow. The planner should either:

1. Include bounded CLI import widening now if a representative workbook with `QS`/`QF`/`P` columns exists.
2. Treat Phase 1 as save/read contract work only, satisfy DATA-02 through the existing save path, and explicitly document canonical XLSX import as a follow-up once sample source data exists.

**Primary recommendation:** Keep the existing row-based `event_results` persistence pattern, widen it behind a canonical field contract, filter race-only aggregates explicitly, and add organizer metadata to `championships` in the same phase.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 5.9.3 | Shared canonical DTOs, field-order constants, and validation helpers | The repo already uses strict TS across pages, APIs, services, repositories, scripts, and tests. |
| Next.js | 16.1.6 | Existing App Router pages and route handlers that expose admin/public results data | Phase 1 only widens existing route/service contracts; no framework change is justified. |
| PostgreSQL + raw SQL migrations | Existing deployment + `db/migrations/*.sql` | Persistent storage for championships, events, and event results | The repo already centralizes data access in SQL repositories; Phase 1 is schema-first and does not need an ORM. |
| `pg` | ^8.16.3 | Database access from repositories and import script | Matches the repo's direct-query pattern and keeps the blast radius small. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React | 19.2.4 | Admin/public component props shaped by widened DTOs | Needed where server pages and admin clients consume the new contract later, but Phase 1 should avoid broad UI work. |
| Vitest | ^3.2.4 | Regression coverage for repositories, services, routes, and page flows | Use for contract, ordering, and organizer metadata coverage before later UI phases depend on them. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Widening the existing row-based `event_results` model | Replacing it with one wide row per `(event, driver)` containing `qs/s/qf/f/p` columns | The wide-row model is semantically cleaner, but it is a much larger rewrite across parser, repositories, admin grid loading, revert snapshots, and every existing query. |
| One shared canonical result contract | A separate points table plus legacy session rows | This reduces `session_kind` churn, but it creates two persistence models for one event table and makes save/read ordering logic harder to keep aligned. |
| Reusing the existing CLI import path only if sample data exists | Adding a new authenticated import endpoint now | That is out of scope for this milestone and adds avoidable product and security surface. |

**Installation:**

```bash
# None. Phase 1 should use the repo-pinned stack and add no new dependencies.
```

**Version verification:** Use the repo-pinned versions from `package.json` for planning. No new package should be introduced for this phase. Official docs were only needed to confirm current Next.js route-handler behavior and Postgres enum-migration constraints.

## Architecture Patterns

### Recommended Project Structure

```text
db/migrations/                         # Phase 1 schema changes
lib/server/history/types.ts            # Canonical public result DTOs and field constants
lib/server/admin/types.ts              # Canonical admin result DTOs and championship organizer field
lib/server/history/repository.ts       # Public mapping, points ordering, race-only aggregates
lib/server/admin/repository.ts         # Results grid loading and championship persistence
lib/server/admin/service.ts            # Canonical result-cell validation and snapshot replacement
app/api/v1/admin/events/[id]/results/route.ts
app/api/v1/admin/championships/route.ts
scripts/import-results-xlsx.ts         # Only if CLI import widening is included now
lib/server/history/parser.ts           # Only if CLI import widening is included now
```

### Pattern 1: Central Canonical Field Contract

**What:** Define one shared field-order constant and one canonical participant shape, then make repositories adapt DB rows into that contract.

**When to use:** Anywhere that currently branches on `"primary"` and `"secondary"` or renders/saves result cells.

**Example:**

```typescript
// Source: recommended adaptation of the current shared-type pattern in
// lib/server/history/types.ts and lib/server/admin/types.ts
export const CANONICAL_RESULT_FIELDS = ["qs", "s", "qf", "f", "p"] as const;

export type CanonicalResultField = (typeof CANONICAL_RESULT_FIELDS)[number];

export type CanonicalResultCell = {
  numericValue: number | null;
  status: ResultStatus | null;
  rawValue: string;
};

export type CanonicalEventParticipant = {
  driverId: string;
  driverSlug: string;
  driverName: string;
  fields: Partial<Record<CanonicalResultField, CanonicalResultCell>>;
};
```

### Pattern 2: Repository-Owned Ordering And Visibility Rules

**What:** Keep points-first sorting and legacy-column omission in one shared repository/helper path instead of letting pages and components infer it independently.

**When to use:** `getEventParticipationPage()`, `getCurrentChampionshipSummary()`, later share-image data reads, and any public/admin API that exposes event participants.

**Example:**

```typescript
// Source: recommended replacement for the current bestPosition sort in
// lib/server/history/repository.ts::toParticipationCards
function sortParticipants(left: CanonicalEventParticipant, right: CanonicalEventParticipant) {
  const leftPoints = left.fields.p?.numericValue ?? null;
  const rightPoints = right.fields.p?.numericValue ?? null;

  if (leftPoints !== null || rightPoints !== null) {
    const byPoints = (rightPoints ?? Number.NEGATIVE_INFINITY) - (leftPoints ?? Number.NEGATIVE_INFINITY);
    if (byPoints !== 0) {
      return byPoints;
    }
  }

  const leftFinal = left.fields.f?.numericValue ?? Number.MAX_SAFE_INTEGER;
  const rightFinal = right.fields.f?.numericValue ?? Number.MAX_SAFE_INTEGER;
  if (leftFinal !== rightFinal) {
    return leftFinal - rightFinal;
  }

  return left.driverName.localeCompare(right.driverName);
}
```

### Pattern 3: Snapshot Writes With Explicit Legacy Omission

**What:** Preserve the current full-snapshot replace flow, but make the canonical serializer distinguish between "missing historical field" and "cleared current field".

**When to use:** `updateEventResults()` and any import apply path that writes event results.

**Example:**

```typescript
// Source: recommended adaptation of the current replace-all flow in
// lib/server/admin/service.ts and lib/server/admin/repository.ts
// Only send/write cells that actually exist for the event snapshot.
// Do not synthesize qs/qf/p rows for legacy events.
const rowsToPersist = canonicalRows.filter((row) => row.rawValue !== "");
await replaceEventResults(eventId, rowsToPersist);
```

### Ordering And Aggregation Touch Points

- `lib/server/history/repository.ts::toParticipationCards()` currently sorts participants by the minimum numeric position across all stored sessions. That must move to a points-first helper.
- `lib/server/history/repository.ts::getHighlights()`, `getDriverStats()`, `getResultsOverview()`, and `getCurrentChampionshipSummary()` currently count any numeric `er.position` as race data. They must be filtered so only the final-race field contributes to race stats.
- `lib/server/history/repository.ts::fetchResultsForEvents()` currently maps `"primary"` and `"secondary"` labels only. That mapping must become canonical-field aware.
- `lib/server/admin/repository.ts::getEventResultsGrid()` currently materializes `{ primary, secondary }` per driver. That grid must widen to canonical fields before Phase 2 can safely build on it.

### Anti-Patterns to Avoid

- **Scattering field order across the app:** Do not let `app/components/`, admin components, repositories, and tests each invent their own `QS/S/QF/F/P` order.
- **Letting points masquerade as race results in aggregates:** Any query that counts wins, podiums, top-10s, or average position must explicitly scope to the final-race field.
- **Duplicating organizer metadata on events or result rows:** Store it once on `championships` and project it where needed.
- **Synthesizing legacy values:** Do not write placeholder `QS`, `QF`, or `P` rows for old events just to fill the canonical shape.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Event participant ordering | Per-page or per-component custom sort logic | One shared repository/helper sort keyed by `P` then `F` fallback | Prevents page/API/share-image drift and makes mixed historical data predictable. |
| Organizer storage | Per-event organizer copies | A nullable organizer field on `championships` plus shared DTO mapping | Avoids denormalization and keeps tournament context authoritative. |
| Import workflow expansion | A new upload UI or endpoint | The existing CLI import script, widened only if sample data exists | New upload UX is out of scope and adds unnecessary auth/operational work. |
| Historical compatibility | Fake `0`/`-` rows for missing `QS`, `QF`, or `P` | Omit missing cells and derive visible columns from actual data | Keeps old events truthful and supports RESULT-03 later without backfill. |

**Key insight:** Phase 1 should stabilize one shared contract and one shared ordering rule. Any design that creates parallel save/read/order paths will make later admin/public/share phases expensive and fragile.

## Common Pitfalls

### Pitfall 1: Enum Migration That Fails Mid-Apply

**What goes wrong:** A migration adds new enum values and then immediately inserts or updates rows using those values in the same transaction.

**Why it happens:** PostgreSQL enum additions are transactional, but newly added enum values are not usable until the transaction commits.

**How to avoid:** Either split enum widening and data writes into separate migrations, or avoid immediate DML that references the new values inside the enum-alter transaction.

**Warning signs:** Migration scripts pass syntax checks but fail when the first insert/update uses the new field key.

### Pitfall 2: Points Data Corrupts Race Stats

**What goes wrong:** Current queries count every numeric `er.position` as a race finish. If `P` is stored as a numeric result row and filters stay unchanged, wins/podiums/top-10s/current-summary numbers become wrong.

**Why it happens:** `getDriverStats()`, `getResultsOverview()`, `getHighlights()`, and `getCurrentChampionshipSummary()` currently do not distinguish result-field semantics.

**How to avoid:** Add an explicit race-only filter, with the final-race field as the only source for finish-based aggregates.

**Warning signs:** Drivers appear to have extra "completed races", average positions inflate, or highlights pick the wrong winner.

### Pitfall 3: The Public Participant Sort Still Uses Best Position

**What goes wrong:** The current `toParticipationCards()` sort uses the minimum numeric position across all sessions, so a `QS=1` or `S=1` row can outrank a higher-points event result.

**Why it happens:** Ordering is derived from the current dynamic session array instead of from a shared participant-order key.

**How to avoid:** Introduce one points-first sort helper and reuse it anywhere event participants are grouped.

**Warning signs:** The same event appears in a different order between API views, public tables, and later export surfaces.

### Pitfall 4: Replace-All Saves Drop Untouched Cells

**What goes wrong:** `replaceEventResults()` deactivates all existing rows for an event before reinserting the submitted set. If the submitted snapshot omits cells that were not edited, stored data disappears.

**Why it happens:** The admin save path is snapshot-based, not patch-based.

**How to avoid:** Phase 1 planning must assume canonical snapshots roundtrip all persisted fields for the event, even before the Phase 2 UI is complete.

**Warning signs:** Editing one field causes older session data for the same driver or event to vanish.

### Pitfall 5: Import Support Is Assumed Without Real Source Data

**What goes wrong:** The planner assumes the current XLSX parser can already ingest canonical fields, but `lib/server/history/parser.ts` only maps alternating `"primary"/"secondary"` columns from `J:W`.

**Why it happens:** Requirements say "import or save", but the repo's only import implementation is tightly coupled to the current workbook shape.

**How to avoid:** Gate canonical CLI import support on an actual sample workbook or explicit source-column mapping. If none exists, document the import gap and keep the scope on save/read support.

**Warning signs:** Phase tasks reference `QS/QF/P` import work without any sample file, fixture, or column mapping evidence.

### Pitfall 6: Organizer Metadata Lands On The Wrong Entity

**What goes wrong:** Organizer gets attached to events or result rows because those flows are already being edited.

**Why it happens:** Event editing and event result loading are the most visible current touch points.

**How to avoid:** Add organizer once to `championships`, widen `AdminChampionship` and public championship DTOs, and let later UI phases render from that source.

**Warning signs:** Event DTOs start carrying organizer while championship DTOs do not.

## Code Examples

Verified patterns from the current repo and primary docs:

### Shared Route-Handler Pattern

```typescript
// Source: current repo pattern in app/api/v1/**/route.ts and
// Next.js Route Handlers docs
export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  return Response.json(await loadFromService(url.searchParams));
}
```

### Small, Additive Championship Migration

```sql
-- Source: recommended continuation of db/migrations/*.sql style
alter table championships
  add column if not exists organizer_name text null;

create index if not exists idx_championships_organizer_name
  on championships(organizer_name);
```

### Explicit Race-Only Aggregate Filter

```sql
-- Source: recommended replacement for current broad er.position filters
count(*) filter (
  where er.result_field = 'f'
    and er.numeric_value is not null
    and er.numeric_value <= 3
) as podiums
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Two hardcoded result buckets: `"primary"` and `"secondary"` | One canonical five-field result contract ordered as `QS`, `S`, `QF`, `F`, `P` | Phase 1 | Shared types, repositories, and later UI/export surfaces can align on one stable model. |
| Event participants sorted by best numeric position across stored sessions | Event participants sorted by points first, then final-race fallback for legacy rows | Phase 1 | Public and API consumers get the published ranking semantics the user asked for. |
| Championship metadata limited to name, slug, and session labels | Championship metadata includes organizer at tournament level | Phase 1 | Organizer data stays normalized and is available to later public/admin phases. |

**Deprecated/outdated:**

- `"primary"` / `"secondary"`-only assumptions in `lib/server/history/types.ts`, `lib/server/admin/types.ts`, `lib/server/history/parser.ts`, and `app/admin/_components/events-manager.tsx`.
- Any query that infers participant rank from `bestPosition` or from unrestricted `er.position` values.

## Open Questions

1. **Can `P` be zero or fractional?**
   - What we know: The current schema enforces `position > 0`, and all existing numeric handling assumes integer race positions.
   - What's unclear: Whether points data includes `0`, halves, or other non-integer scoring.
   - Recommendation: Confirm from trusted source data before finalizing the migration. If unknown at planning time, assume integer points with `0` allowed and record that assumption explicitly.

2. **Do we have a real workbook shape for canonical import now?**
   - What we know: The only current import path parses alternating `primary/secondary` columns from the existing workbook.
   - What's unclear: Whether a trusted workbook with `QS` / `QF` / `P` columns already exists for Phase 1.
   - Recommendation: Add import tasks to Phase 1 only if a representative sample file or column mapping is available. Otherwise, keep DATA-02 scoped to save/read support and document import as pending source confirmation.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest `^3.2.4` |
| Config file | `vitest.config.ts` |
| Quick run command | `./node_modules/.bin/vitest run tests/history-repository.spec.ts tests/history-api.spec.ts tests/history-api-v2.spec.ts tests/results-page.flow.spec.ts` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-01 | Canonical `QS/S/QF/F/P` values can be stored and read through shared admin/history contracts | unit + repository | `./node_modules/.bin/vitest run tests/admin-event-results-contract.spec.ts` | ❌ Wave 0 |
| DATA-02 | Save path preserves existing event data and legacy missing fields; canonical CLI import widening stays deferred until a committed workbook fixture exists | service + integration | `./node_modules/.bin/vitest run tests/admin-event-results-preserve.spec.ts` | ❌ Wave 0 |
| DATA-03 | Public consumers receive canonical fields and points-first participant ordering | repository + route | `./node_modules/.bin/vitest run tests/history-repository.spec.ts tests/history-api.spec.ts tests/results-page.flow.spec.ts` | ❌ Wave 0 |
| DATA-04 | Championship organizer metadata persists and is returned through shared types/routes | repository + route | `./node_modules/.bin/vitest run tests/championship-organizer.spec.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `./node_modules/.bin/vitest run tests/history-repository.spec.ts tests/history-api.spec.ts tests/history-api-v2.spec.ts tests/results-page.flow.spec.ts`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`, or a documented exception if the workbook-dependent parser test has not yet been replaced with a committed fixture.

### Wave 0 Gaps

- [ ] `tests/admin-event-results-contract.spec.ts` — canonical field validation, duplicate prevention, and shared DTO mapping.
- [ ] `tests/admin-event-results-preserve.spec.ts` — replace-all save behavior that preserves untouched persisted cells and legacy omissions.
- [ ] `tests/championship-organizer.spec.ts` — organizer persistence and retrieval through admin/public contracts.
- [ ] `tests/history-repository.spec.ts` — expand existing coverage to assert points-first ordering and race-only aggregate filtering.
- [ ] `tests/history-api.spec.ts` / `tests/results-page.flow.spec.ts` — expand existing coverage to assert canonical field exposure.
- [ ] Documented exception for `tests/history-parser.spec.ts` — canonical CLI import widening stays out of Phase 1 until a committed workbook fixture exists, so parser validation is tracked as deferred scope rather than a Wave 0 blocker.

## Sources

### Primary (HIGH confidence)

- `db/migrations/001_results_schema.sql` through `db/migrations/008_live_broadcast_config.sql` — current schema shape, existing migration style, and soft-delete/runtime-compat patterns.
- `lib/server/history/types.ts` — current public result/session contract.
- `lib/server/admin/types.ts` — current admin event-results grid and championship contract.
- `lib/server/history/repository.ts` — current participant ordering, aggregate semantics, and public mapping paths.
- `lib/server/admin/repository.ts` — current results-grid loading, snapshot replacement, and championship persistence paths.
- `lib/server/admin/service.ts` — current result-cell validation and replace-all save behavior.
- `scripts/import-results-xlsx.ts` and `lib/server/history/parser.ts` — current CLI import scope and workbook assumptions.
- https://www.postgresql.org/docs/current/sql-altertype.html — enum-migration behavior, especially `ALTER TYPE ... ADD VALUE` commit semantics.
- https://nextjs.org/docs/app/getting-started/route-handlers — current App Router route-handler behavior and caching defaults.

### Secondary (MEDIUM confidence)

- `tests/history-repository.spec.ts`, `tests/history-api.spec.ts`, `tests/history-api-v2.spec.ts`, `tests/results-page.flow.spec.ts` — existing verification seams and current missing assertions.
- `.planning/research/SUMMARY.md`, `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/CONCERNS.md`, `.planning/codebase/STACK.md` — repo-wide architectural and validation context.

### Tertiary (LOW confidence)

- None.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - The phase can stay entirely within the repo's pinned Next.js, TypeScript, `pg`, SQL-migration, and Vitest stack.
- Architecture: HIGH - Current repository/service boundaries and concrete code paths clearly show where the two-session assumptions live.
- Pitfalls: HIGH - The main risks are directly visible in current queries, save behavior, parser assumptions, and official Postgres enum docs.

**Research date:** 2026-04-02
**Valid until:** 2026-05-02
