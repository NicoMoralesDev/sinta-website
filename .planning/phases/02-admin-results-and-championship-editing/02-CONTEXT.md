# Phase 2: Admin Results And Championship Editing - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Extend the existing admin workflows so admins can edit the canonical event-result fields `QS`, `S`, `QF`, `F`, and `P`, and manage championship organizer metadata safely. This phase widens the current admin UI and save behavior; it does not add new public display behavior or new product capabilities.

</domain>

<decisions>
## Implementation Decisions

### Canonical results editor shape
- Keep the existing event-results workflow in place, but widen it into a responsive full five-column grid.
- Admins should always be able to edit all canonical result fields, even when some of those values are not shown on public surfaces.
- Prefer friendly labels in the admin UI.
- Fall back to compact canonical labels such as `QS`, `S`, `QF`, `F`, and `P` when space is tight, especially on mobile.
- Optimize for readability and a non-chaotic layout rather than maximum density.

### Cell behavior and save semantics
- Clearing a filled cell should clear that stored value.
- Historical `QS`, `QF`, and `P` values should clear the same way as any other result cell.
- New empty events should remain free-form, matching the current workflow.
- The save model should be safe and intention-preserving: treat user changes as cell-level edits rather than blindly trusting a whole-grid rewrite.
- Planning should favor explicit dirty tracking so changed cells and cleared cells can be persisted safely without accidental data loss.

### Result-entry validation and guidance
- Race-session result cells and points cells have different semantics.
- `P` must accept only integer numeric values that are `0` or greater, or remain blank.
- `P` should not accept race statuses such as `DNF`, `DNQ`, `DSQ`, or `ABSENT`.
- The editor should include light helper text and inline invalid-cell highlighting.
- Save should be blocked when any cell is invalid, and the UI should clearly focus the invalid cells.

### Championship organizer editing UX
- Add `organizerName` to the championship management flow without disrupting the existing UI.
- Treat organizer as secondary metadata, not a primary championship identity field.
- If organizer is blank or absent, it should simply stay hidden.
- A normal field label is enough guidance; no heavy formatting rules are needed.

### Claude's Discretion
- Exact desktop/mobile overflow behavior for the five-column grid.
- Exact helper-copy wording for result-entry validation.
- Whether `P` gets a subtle visual separation from race-session columns.
- Exact placement of the organizer field inside the championship create/edit forms, as long as it stays secondary and does not clutter the current layout.

</decisions>

<specifics>
## Specific Ideas

- The admin editor should expose all canonical fields from the panel even if those fields are not surfaced on the public home or other public pages.
- Friendly labels are preferred, but mobile can collapse to the canonical abbreviations when longer labels would break the layout.
- `P` is explicitly "points", not "position", and should be treated differently in both validation and presentation.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Scope and requirements
- `.planning/ROADMAP.md` — Phase 2 boundary, goal, and success criteria.
- `.planning/REQUIREMENTS.md` — `ADMIN-01`, `ADMIN-02`, and `ADMIN-03`.
- `.planning/PROJECT.md` — Brownfield constraints and milestone-level non-goals.

### Prior phase decisions that constrain Phase 2
- `.planning/phases/01-results-contract-ordering-and-championship-metadata/01-02-SUMMARY.md` — Canonical admin write normalization, preserve-on-save behavior, and organizer metadata persistence already established in the backend.
- `.planning/phases/01-results-contract-ordering-and-championship-metadata/01-03-SUMMARY.md` — Canonical public result ordering and organizer DTO compatibility, useful for keeping admin semantics aligned with later phases.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/admin/_components/events-manager.tsx` — Existing event CRUD plus expandable results editor workflow that should be widened rather than replaced.
- `app/admin/_components/championships-manager.tsx` — Existing championship create/edit UI where organizer metadata should be added.
- `lib/server/admin/service.ts` — Already normalizes legacy session inputs to canonical storage and validates points rows with `p >= 0`.
- `app/api/v1/admin/events/[id]/results/route.ts` and `app/api/v1/admin/championships/route.ts` — Existing admin write endpoints that already accept the widened backend contract.

### Established Patterns
- Admin pages load server data and hand it to client managers; mutations go through `fetch()` to thin admin API routes.
- Result writes are validated in the service layer, not in components alone.
- Phase 1 preserved omitted rows in backend saves to protect unseen canonical data while the UI was still two-column.
- Championship organizer metadata already exists in the service and repository layers, so Phase 2 is primarily an admin-flow exposure task.

### Integration Points
- `app/admin/events/page.tsx` + `app/admin/_components/events-manager.tsx` — Main UI seam for the widened canonical results editor.
- `lib/server/admin/repository.ts` `getEventResultsGrid` — Currently collapses data into `primary` and `secondary`; this will need widening to support `QS`, `S`, `QF`, `F`, and `P`.
- `lib/server/admin/types.ts` — Admin grid types still reflect the two-column editor and will need to match the new UI shape.
- `app/admin/championships/page.tsx` + `app/admin/_components/championships-manager.tsx` — Main UI seam for organizer metadata editing.

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-admin-results-and-championship-editing*
*Context gathered: 2026-04-02*
