# Roadmap: SINTA Website

## Overview

This brownfield milestone extends the existing SINTA website without changing its core architecture. The work still clusters into five dependency-driven phases, but the shared contract is now broader: first stabilize the canonical event-results model (`QS`, `S`, `QF`, `F`, `P`), points-based ordering, and championship organizer metadata; then make admin editing safe; then expose the new semantics cleanly on public results and driver stats; then generate a shareable event-results image from the canonical public DTO; and finally align documentation with the implemented behavior and known verification limits.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Results Contract, Ordering, And Championship Metadata** - Make `QS`, `S`, `QF`, `F`, `P`, points-based ordering, and championship organizer metadata safe first-class parts of the shared data model.
- [ ] **Phase 2: Admin Results And Championship Editing** - Let admins manage the canonical event-result columns and championship organizer metadata safely inside existing workflows.
- [ ] **Phase 3: Public Results, Organizer Display, And Driver Stats Correctness** - Expose the new result semantics and organizer metadata cleanly on public surfaces while keeping race-focused stats trustworthy.
- [ ] **Phase 4: Event Results Share Image** - Generate a messaging-friendly image from the canonical public event results table.
- [ ] **Phase 5: Documentation Alignment** - Update project docs to match the brownfield runtime, new behaviors, and verification limits.

## Phase Details

### Phase 1: Results Contract, Ordering, And Championship Metadata
**Goal**: Canonical event-result fields, points-based ordering, and championship organizer metadata can be stored and retrieved through the existing model without breaking historical data.
**Depends on**: Nothing (first phase)
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04
**Success Criteria** (what must be TRUE):
  1. Admin can save an event with canonical `QS`, `S`, `QF`, `F`, and `P` fields without losing existing result data for that event.
  2. Historical events that do not have every canonical session value continue to load and save without validation failures or synthetic session data.
  3. Public consumers can retrieve event result data with canonical result fields and points-based ordering.
  4. Championship/tournament organizer metadata can be stored and retrieved through the shared data model.
**Plans**: TBD

### Phase 2: Admin Results And Championship Editing
**Goal**: Admins can maintain canonical event-result fields and championship organizer metadata safely inside the existing workflows.
**Depends on**: Phase 1
**Requirements**: ADMIN-01, ADMIN-02, ADMIN-03
**Success Criteria** (what must be TRUE):
  1. Admin can open an event and edit `QS`, `S`, `QF`, `F`, and `P` in the same results workflow.
  2. Admin can update one result cell without unrelated persisted result cells being dropped by the save flow.
  3. Admin can create and update organizer metadata in the championship/tournament management flow.
**Plans**: TBD

### Phase 3: Public Results, Organizer Display, And Driver Stats Correctness
**Goal**: Visitors can trust the public results and driver stats surfaces when the canonical result model and organizer metadata are present.
**Depends on**: Phase 2
**Requirements**: RESULT-01, RESULT-02, RESULT-03, RESULT-04, STAT-01, STAT-02
**Success Criteria** (what must be TRUE):
  1. Visitor can view event result tables using the canonical column order `QS`, `S`, `QF`, `F`, `P`.
  2. Visitor sees event participants ordered by points rather than by final-race position.
  3. Visitor does not see noisy empty session columns for historical events that lack newer session data.
  4. Visitor can see the championship/tournament organizer in an appropriate public label or heading.
  5. Visitor sees the recent-positions chart and related race statistics remain race-correct after the data-model change.
**Plans**: TBD

### Phase 4: Event Results Share Image
**Goal**: Visitors can generate a shareable image that faithfully represents a specific public event results table.
**Depends on**: Phase 3
**Requirements**: SHARE-01, SHARE-02
**Success Criteria** (what must be TRUE):
  1. Visitor can trigger generation of a shareable image for a specific event results table from the public results experience.
  2. The generated image includes every driver shown in the selected event table.
  3. The generated image matches the visible result columns and points-based ranking shown for that event.
**Plans**: TBD

### Phase 5: Documentation Alignment
**Goal**: Maintainers can rely on the project documentation for the current runtime behavior and this milestone's changes.
**Depends on**: Phase 4
**Requirements**: DOC-01, DOC-02
**Success Criteria** (what must be TRUE):
  1. Maintainer can follow project documentation that matches the current runtime setup and real admin/results workflows.
  2. Maintainer can find concise documentation for the `QS`/`S`/`QF`/`F`/`P` results model, points-based ordering, organizer metadata, the share-image flow, and any known verification limits for this milestone.
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Results Contract, Ordering, And Championship Metadata | 0/TBD | Not started | - |
| 2. Admin Results And Championship Editing | 0/TBD | Not started | - |
| 3. Public Results, Organizer Display, And Driver Stats Correctness | 0/TBD | Not started | - |
| 4. Event Results Share Image | 0/TBD | Not started | - |
| 5. Documentation Alignment | 0/TBD | Not started | - |
