# Phase 2: Admin Results And Championship Editing - Research

**Researched:** 2026-04-02
**Domain:** Brownfield admin UI widening for canonical event-result editing and championship organizer metadata
**Confidence:** HIGH

## User Constraints

### Locked Decisions

- Keep the existing event-results workflow in place, but widen it into a responsive full five-column grid.
- Admins should always be able to edit all canonical result fields, even when some of those values are not shown on public surfaces.
- Prefer friendly labels in the admin UI.
- Fall back to compact canonical labels such as `QS`, `S`, `QF`, `F`, and `P` when space is tight, especially on mobile.
- Optimize for readability and a non-chaotic layout rather than maximum density.
- Clearing a filled cell should clear that stored value.
- Historical `QS`, `QF`, and `P` values should clear the same way as any other result cell.
- New empty events should remain free-form, matching the current workflow.
- The save model should be safe and intention-preserving: treat user changes as cell-level edits rather than blindly trusting a whole-grid rewrite.
- Planning should favor explicit dirty tracking so changed cells and cleared cells can be persisted safely without accidental data loss.
- Race-session result cells and points cells have different semantics.
- `P` must accept only integer numeric values that are `0` or greater, or remain blank.
- `P` should not accept race statuses such as `DNF`, `DNQ`, `DSQ`, or `ABSENT`.
- The editor should include light helper text and inline invalid-cell highlighting.
- Save should be blocked when any cell is invalid, and the UI should clearly focus the invalid cells.
- Add `organizerName` to the championship management flow without disrupting the existing UI.
- Treat organizer as secondary metadata, not a primary championship identity field.
- If organizer is blank or absent, it should simply stay hidden.
- A normal field label is enough guidance; no heavy formatting rules are needed.

### Claude's Discretion

- Exact desktop/mobile overflow behavior for the five-column grid.
- Exact helper-copy wording for result-entry validation.
- Whether `P` gets a subtle visual separation from race-session columns.
- Exact placement of the organizer field inside the championship create/edit forms, as long as it stays secondary and does not clutter the current layout.

### Deferred Ideas (OUT OF SCOPE)

- Any public-surface changes for organizer display or canonical result presentation.
- Bulk import, spreadsheet upload, or paste-heavy editing UX beyond the existing admin workflows.
- New admin modules, redesigned navigation, or a new generic data-grid dependency.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ADMIN-01 | Admin can view and edit `QS`, `S`, `QF`, `F`, and `P` in the event results workflow | Requires widening the admin results grid DTO, loader, client editor state, validation helpers, and responsive labels without replacing the current event workflow. |
| ADMIN-02 | Admin can update a result cell or event row without unrelated persisted result values being dropped by the save flow | Requires moving from implicit full-snapshot semantics to explicit dirty cell patches with a concrete clear representation. |
| ADMIN-03 | Admin can create and update championship/tournament organizer metadata in championship management | Requires exposing existing backend organizer support in the current championships manager UI as optional secondary metadata. |
</phase_requirements>

## Summary

Phase 1 already widened the backend enough to store canonical rows and championship organizers safely, but the admin surfaces still reflect the old two-session assumption. `EventsManager` only edits `primary` and `secondary`, `getEventResultsGrid()` only returns those two slots, and `updateEventResults()` still assumes omission means “preserve” because the UI could not express canonical edits or explicit clears. Phase 2 therefore is not a data-model phase. It is a bounded admin workflow phase that must expose the canonical model without regressing the non-destructive guarantees added earlier.

The cleanest approach is to promote a metadata-driven admin grid contract and a cell-level patch protocol. The GET path should return canonical field order and friendly labels so the client can render a five-column editor consistently. The PUT path should accept only changed cells, including explicit clear tombstones, so editing one field does not require the client to resubmit the whole event and clearing one field does not silently resurrect stale data. This preserves the user’s “I edited this cell” mental model and keeps the save path safe under sparse historical data.

The organizer work is smaller and should stay in the existing championships manager. The backend already stores and returns `organizerName`; the UI only needs to expose it inline as optional secondary metadata. No new route family, no new dependency, and no redesign are justified for this phase.

**Primary recommendation:** Add a canonical admin grid DTO with field metadata, use dirty tracked cell patches with explicit clear rows for writes, and widen the current admin components rather than introducing a new editor architecture.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.6 | Existing App Router admin pages and route handlers | The phase fits the current page-plus-route structure and does not justify framework changes. |
| React | 19.2.4 | Client-side state for admin managers | Existing admin flows already use local `useState` and `fetch()`; the same pattern can scale to the widened editor. |
| TypeScript | 5.9.3 | Shared admin DTOs, helper contracts, and validation-safe serialization | The repo uses strict TypeScript everywhere; widened grid and patch semantics should stay typed. |
| Vitest | ^3.2.4 | Regression coverage for routes, services, and static render flows | Existing tests already validate admin service and route seams; Phase 2 can extend that pattern without new tooling. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Tailwind CSS | 4.1.18 | Existing admin layout and responsive styling | Use for the widened grid and helper/error states inside the current admin visual system. |
| `next/navigation` | Next.js built-in | `router.refresh()` after successful admin writes | Keep the current refresh-after-mutation pattern. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Local manager state plus explicit helpers | `react-hook-form` or another form library | Adds dependency and abstraction churn for a single brownfield admin workflow. |
| Metadata-driven table widening | New generic grid dependency | Overkill for five fixed columns and would pull Phase 2 into UI framework work. |
| Dirty cell patch payloads | Resubmitting the full event snapshot on every save | Easier to code superficially, but it makes intentional clears and accidental overwrites harder to separate. |

**Installation:**

```bash
# None. Phase 2 should stay within the repo's pinned stack and add no new packages.
```

**Version verification:** Use the versions pinned in `package.json`. No new framework or library adoption is needed for this phase.

## Architecture Patterns

### Recommended Project Structure

```text
lib/server/admin/types.ts                         # canonical admin grid and patch contracts
lib/server/admin/repository.ts                    # widened grid loader and clear-aware replace behavior
lib/server/admin/service.ts                       # points/race validation and clear tombstone handling
app/api/v1/admin/events/[id]/results/route.ts    # widened GET/PUT admin results contract
app/admin/_components/events-manager.tsx          # responsive five-column editor
app/admin/_components/championships-manager.tsx   # organizer field exposure
tests/admin-event-results-contract.spec.ts        # GET/PUT contract and validation coverage
tests/admin-event-results-preserve.spec.ts        # non-destructive save and clear coverage
tests/admin-events-manager.flow.spec.ts           # editor render/helper coverage
tests/admin-championships-manager.flow.spec.ts    # organizer UI render/helper coverage
```

### Pattern 1: Metadata-Driven Canonical Grid Contract

**What:** The results-grid payload should include field order and friendly labels so the client renders canonical fields from server-provided metadata instead of hardcoding table structure in multiple places.

**When to use:** `getEventResultsGrid()`, the admin results GET route, and the results manager render loop.

**Example:**

```typescript
export type AdminEventResultsGrid = {
  event: AdminEvent;
  fieldOrder: ["qs", "s", "qf", "f", "p"];
  fieldLabels: Record<AdminCanonicalResultField, string>;
  drivers: Array<{
    driverId: string;
    driverSlug: string;
    driverName: string;
    results: Partial<Record<AdminCanonicalResultField, {
      position: number | null;
      status: ResultStatus | null;
      rawValue: string;
      isActive: boolean;
    }>>;
  }>;
};
```

### Pattern 2: Explicit Clear Tombstones For Dirty Cell Saves

**What:** Keep PATCH-like save semantics inside the existing PUT route by sending only changed cells. A cleared cell is represented explicitly instead of by omission.

**When to use:** `updateEventResults()`, `mergeEventResultCells()`, and the client serializer that turns dirty UI state into request rows.

**Example:**

```typescript
type EventResultCellInput = {
  driverId: string;
  sessionKind: "qs" | "s" | "qf" | "f" | "p";
  position: number | null;
  status: ResultStatus | null;
  rawValue: string;
  isActive: boolean;
};

// Changed value
{ driverId, sessionKind: "qf", position: 2, status: null, rawValue: "2", isActive: true }

// Explicit clear
{ driverId, sessionKind: "qf", position: null, status: null, rawValue: "", isActive: false }
```

### Pattern 3: Separate Race Parsing From Points Parsing

**What:** Use distinct helpers for race fields and points so UI validation, helper text, and service rules stay aligned.

**When to use:** `events-manager.tsx` input parsing/serialization and `validateResultCell()` in the admin service.

**Example:**

```typescript
// Race fields: positive integer or status token
parseRaceCell("3") => { position: 3, status: null, rawValue: "3" }
parseRaceCell("DNF") => { position: null, status: "DNF", rawValue: "DNF" }

// Points field: integer >= 0 or blank
parsePointsCell("25") => { position: 25, status: null, rawValue: "25" }
parsePointsCell("DNF") => invalid
```

### Anti-Patterns to Avoid

- **Reusing the race parser for `P`:** Points are not positions; letting `DNF` or `position > 0 only` rules leak into `P` will break the requirement.
- **Depending on omission to mean clear:** Phase 1 intentionally preserved omissions. Phase 2 must keep that safety while still allowing intentional deletion.
- **Hardcoding labels in multiple layers:** The field order and friendly labels should come from one shared contract, not separate arrays inside the UI and repository.
- **Introducing a generic form/grid framework:** The current admin managers are small enough that local state plus extracted helpers is the lower-risk option.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Complex shared form state | Global client store or new form library | Existing local manager state plus small pure helpers | Keeps the phase brownfield-safe and minimizes surface area. |
| Results table schema | Ad hoc arrays of labels and keys in the component | One typed `fieldOrder` + `fieldLabels` contract from `lib/server/admin/types.ts` | Prevents UI/route drift and keeps mobile fallback predictable. |
| Organizer edit flow | New modal or metadata screen | Inline optional field in the current championships manager | Matches user guidance and keeps the UI unchanged except where needed. |

**Key insight:** The hard problem in Phase 2 is not rendering five inputs. It is preserving user intent between “unchanged”, “changed”, and “cleared” while widening an existing workflow.

## Common Pitfalls

### Pitfall 1: Clear And Omit Become The Same Thing Again

**What goes wrong:** The UI clears a cell visually, but the request omits that row, so the Phase 1 merge logic restores the old persisted value.

**Why it happens:** The backend currently treats omission as “preserve”.

**How to avoid:** Send explicit clear tombstones and teach merge logic to delete rows when `isActive` is false.

**Warning signs:** Admin clears `QF`, saves, reloads, and the old `QF` value comes back.

### Pitfall 2: Points Validation Reuses Race Semantics

**What goes wrong:** `P` rejects `0`, accepts `DNF`, or renders race-specific helper text.

**Why it happens:** There is only one parser/validator path today.

**How to avoid:** Split race-field parsing from points parsing in both UI helpers and service validation.

**Warning signs:** Tests for `P = 0` fail or the UI highlights valid integer points as invalid.

### Pitfall 3: Mobile Layout Becomes Unreadable

**What goes wrong:** Five friendly labels and all inputs fit on desktop but overflow or wrap badly on mobile.

**Why it happens:** The existing editor was built for two columns, not five.

**How to avoid:** Keep desktop friendly labels, but provide compact `QS/S/QF/F/P` headers on tight layouts and maintain horizontal readability instead of stacking unbounded text.

**Warning signs:** Header text wraps into multiple lines or points/race helpers obscure the input grid on narrow screens.

### Pitfall 4: Route Contract And UI Contract Diverge

**What goes wrong:** The GET route returns one shape while the component assumes another, or the UI serializes clear rows in a format the service rejects.

**Why it happens:** The current GET and PUT tests are weighted toward service logic, not the full canonical grid/editor contract.

**How to avoid:** Extend route tests to cover widened GET metadata and widened PUT clear/value payloads, not just service calls.

**Warning signs:** TypeScript stays green but the live editor fails after loading or saving because of mismatched field names.

### Pitfall 5: Organizer Field Becomes Too Prominent

**What goes wrong:** The championships editor visually treats organizer as equal to core identity fields and makes the form feel busier than necessary.

**Why it happens:** The field is new and easy to place in the main grid without considering weight.

**How to avoid:** Keep it inline but secondary, with a simple label and optional treatment.

**Warning signs:** The championships create/edit rows require extra scrolling or the organizer field competes with season/name/session labels.

## Code Examples

### Existing Admin Route Pattern

```typescript
export async function PUT(request: Request, context: RouteContext) {
  try {
    const { actor } = await requireAdminActor(request);
    const { id } = await context.params;
    const body = await parseAdminJsonBody<{ rows?: EventResultCellInput[] }>(request);
    const result = await updateEventResults(actor, id, { rows: body.rows ?? [] }, {
      requestId: readRequestId(request),
    });
    return adminJsonOk(result);
  } catch (error) {
    return handleAdminApiError(error);
  }
}
```

### Existing Admin Refresh Pattern

```typescript
const response = await fetch(`/api/v1/admin/events/${selectedEventId}/results`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ rows }),
});

if (response.ok) {
  router.refresh();
  await loadGrid(selectedEventId);
}
```

### Recommended Dirty Patch Serializer

```typescript
function buildDirtyRows(dirtyCells: DirtyCellMap): EventResultCellInput[] {
  return Object.values(dirtyCells).map((cell) =>
    cell.cleared
      ? { driverId: cell.driverId, sessionKind: cell.field, position: null, status: null, rawValue: "", isActive: false }
      : { driverId: cell.driverId, sessionKind: cell.field, position: cell.position, status: cell.status, rawValue: cell.rawValue, isActive: true },
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Two-column `primary`/`secondary` editor assumptions | Canonical field contracts shared across admin and public layers | Phase 1 of this milestone | Admin UI now needs metadata-driven rendering instead of hardcoded two-slot logic. |
| Implicit snapshot preservation as the only safe save model | Explicit dirty tracking with clear tombstones over the existing route | Current phase decision | Lets the UI stay safe without forcing full-grid rewrites. |

**New tools/patterns to consider:**
- Metadata-driven field rendering from typed DTOs rather than duplicated header arrays.
- Pure helper extraction for client validation/serialization so render tests can stay lightweight without a browser harness.

**Deprecated/outdated:**
- Treating the results editor as permanently two-column.
- Reusing one parser for both race results and points.

## Open Questions

1. **Do we need richer admin interaction tests than static render coverage?**
   - What we know: The repo uses Vitest plus `renderToStaticMarkup`, not a browser-based harness.
   - What's unclear: Whether current maintainers want browser-level admin interaction tests in a later milestone.
   - Recommendation: Keep Phase 2 tests at route/service/helper/render level and reserve browser automation for a future testing investment.

2. **Should `QS` and `QF` friendly labels be localized or remain stable Spanish copy?**
   - What we know: The admin UI is already Spanish-first, and the user only required friendly labels with mobile fallback.
   - What's unclear: Whether the admin panel will ever need bilingual copy like the public site.
   - Recommendation: Use stable Spanish-friendly labels now and keep abbreviations as the mobile fallback.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest `^3.2.4` |
| Config file | `vitest.config.ts` |
| Quick run command | `./node_modules/.bin/vitest run tests/admin-event-results-contract.spec.ts tests/admin-event-results-preserve.spec.ts tests/championship-organizer.spec.ts tests/admin-events-manager.flow.spec.ts tests/admin-championships-manager.flow.spec.ts` |
| Full suite command | `npm test` |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ADMIN-01 | Admin loads and edits a responsive canonical `QS/S/QF/F/P` grid with friendly labels and mobile fallback abbreviations | route + helper + render | `./node_modules/.bin/vitest run tests/admin-event-results-contract.spec.ts tests/admin-events-manager.flow.spec.ts` | ❌ Wave 0 |
| ADMIN-02 | Changing or clearing one result cell updates only intended rows and preserves unrelated persisted values | service + route | `./node_modules/.bin/vitest run tests/admin-event-results-contract.spec.ts tests/admin-event-results-preserve.spec.ts` | ✅ existing coverage needs widening |
| ADMIN-03 | Organizer metadata can be created and updated from championship management | route + render | `./node_modules/.bin/vitest run tests/championship-organizer.spec.ts tests/admin-championships-manager.flow.spec.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `./node_modules/.bin/vitest run tests/admin-event-results-contract.spec.ts tests/admin-event-results-preserve.spec.ts tests/championship-organizer.spec.ts tests/admin-events-manager.flow.spec.ts tests/admin-championships-manager.flow.spec.ts`
- **Per wave merge:** `npm run typecheck` and then `npm test`
- **Phase gate:** Admin results and championships tests green, with the known parser workbook failure still documented as an unrelated full-suite limitation if it persists.

### Wave 0 Gaps

- [ ] `tests/admin-events-manager.flow.spec.ts` — widened grid render, helper text, mobile short labels, and serializer/helper coverage.
- [ ] `tests/admin-championships-manager.flow.spec.ts` — organizer field render and optional secondary-metadata behavior.
- [ ] `tests/admin-event-results-contract.spec.ts` — widened GET grid shape, clear tombstones, and `P` validation coverage.
- [ ] `tests/admin-event-results-preserve.spec.ts` — explicit clear behavior alongside preserve-on-omit behavior.

## Sources

### Primary (HIGH confidence)

- `.planning/ROADMAP.md` — Phase 2 goal and success criteria.
- `.planning/REQUIREMENTS.md` — `ADMIN-01`, `ADMIN-02`, `ADMIN-03`.
- `.planning/phases/02-admin-results-and-championship-editing/02-CONTEXT.md` — locked user decisions for this phase.
- `.planning/phases/01-results-contract-ordering-and-championship-metadata/01-02-SUMMARY.md` — current backend normalization and preserve-on-save behavior.
- `app/admin/_components/events-manager.tsx` — current two-column results editor implementation.
- `app/admin/_components/championships-manager.tsx` — current championships admin flow.
- `lib/server/admin/types.ts` — current admin grid and championship contracts.
- `lib/server/admin/repository.ts` — current event-grid loading and row replacement behavior.
- `lib/server/admin/service.ts` — current result validation and merge logic.
- `app/api/v1/admin/events/[id]/results/route.ts` and `app/api/v1/admin/championships/route.ts` — current admin route contracts.
- `tests/admin-event-results-contract.spec.ts`, `tests/admin-event-results-preserve.spec.ts`, `tests/championship-organizer.spec.ts` — current verification seams.

### Secondary (MEDIUM confidence)

- `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/CONVENTIONS.md`, `.planning/codebase/TESTING.md` — repo-wide patterns that constrain the plan.
- `package.json` — pinned stack versions and existing scripts.

### Tertiary (LOW confidence)

- None.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - No new dependency or framework work is needed.
- Architecture: HIGH - The current admin seams clearly show where the two-column assumption and preserve-on-omit logic live.
- Pitfalls: HIGH - The main risks are directly visible in the current service/repository/component code.
- Code examples: HIGH - The repo already contains the exact route, manager, and testing patterns Phase 2 should reuse.

**Research date:** 2026-04-02
**Valid until:** 2026-05-02

---

*Phase: 02-admin-results-and-championship-editing*
*Research completed: 2026-04-02*
*Ready for planning: yes*
