# Roadmap: SINTA Website

## Overview

This brownfield milestone extends the existing SINTA website without changing its core architecture. The work clusters into five dependency-driven phases: first stabilize optional `qualy` in the shared results contract, then make admin editing safe, then expose the new session cleanly on public results and driver stats, then generate a shareable event-results image from the canonical public DTO, and finally align documentation with the implemented behavior and known verification limits.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Results Contract And Schema** - Make optional `qualy` a safe first-class part of persisted and public event result data.
- [ ] **Phase 2: Admin Qualy Editing Safety** - Let admins manage `qualy` inside existing event workflows without noisy empty controls or data loss.
- [ ] **Phase 3: Public Results And Driver Stats Correctness** - Expose `qualy` cleanly on public result surfaces while keeping race-focused stats trustworthy.
- [ ] **Phase 4: Event Results Share Image** - Generate a messaging-friendly image from the canonical public event results table.
- [ ] **Phase 5: Documentation Alignment** - Update project docs to match the brownfield runtime, new behaviors, and verification limits.

## Phase Details

### Phase 1: Results Contract And Schema
**Goal**: Optional `qualy` data can be stored and retrieved through the existing results model without breaking historical events or existing sprint/final data.
**Depends on**: Nothing (first phase)
**Requirements**: DATA-01, DATA-02, DATA-03
**Success Criteria** (what must be TRUE):
  1. Admin can save an event with `qualy` results without losing existing sprint or final results for that event.
  2. Historical events that do not have `qualy` continue to load and save without validation failures or synthetic qualifying data.
  3. Public consumers can retrieve event result data with `qualy` included only when it exists for the event.
**Plans**: TBD

### Phase 2: Admin Qualy Editing Safety
**Goal**: Admins can maintain `qualy` results safely inside the existing event results workflow.
**Depends on**: Phase 1
**Requirements**: ADMIN-01, ADMIN-02
**Success Criteria** (what must be TRUE):
  1. Admin can open an event and edit `qualy` alongside the existing result sessions in the same results workflow.
  2. Admin can update one result cell without unrelated persisted result cells being dropped by the save flow.
  3. Admin does not see empty `qualy` controls or columns for events where no `qualy` data exists.
**Plans**: TBD

### Phase 3: Public Results And Driver Stats Correctness
**Goal**: Visitors can trust the public results and driver stats surfaces when `qualy` is present.
**Depends on**: Phase 2
**Requirements**: RESULT-01, RESULT-02, RESULT-03, STAT-01, STAT-02
**Success Criteria** (what must be TRUE):
  1. Visitor can view `qualy` in the event results table when the selected event has recorded qualifying data.
  2. Visitor does not see an empty `qualy` column for events without qualifying data, and visible result sessions appear in a consistent order.
  3. Visitor sees the recent-positions chart plotted so better finishes read as better performance.
  4. Visitor sees driver trend and aggregate race statistics remain race-correct after `qualy` support is added.
**Plans**: TBD

### Phase 4: Event Results Share Image
**Goal**: Visitors can generate a shareable image that faithfully represents a specific public event results table.
**Depends on**: Phase 3
**Requirements**: SHARE-01, SHARE-02
**Success Criteria** (what must be TRUE):
  1. Visitor can trigger generation of a shareable image for a specific event results table from the public results experience.
  2. The generated image includes every driver shown in the selected event table.
  3. The generated image matches the visible result sessions for that event, including omitting `qualy` when the event does not have it.
**Plans**: TBD

### Phase 5: Documentation Alignment
**Goal**: Maintainers can rely on the project documentation for the current runtime behavior and this milestone's changes.
**Depends on**: Phase 4
**Requirements**: DOC-01, DOC-02
**Success Criteria** (what must be TRUE):
  1. Maintainer can follow project documentation that matches the current runtime setup and real admin/results workflows.
  2. Maintainer can find concise documentation for `qualy` behavior, the share-image flow, and any known verification limits for this milestone.
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Results Contract And Schema | 0/TBD | Not started | - |
| 2. Admin Qualy Editing Safety | 0/TBD | Not started | - |
| 3. Public Results And Driver Stats Correctness | 0/TBD | Not started | - |
| 4. Event Results Share Image | 0/TBD | Not started | - |
| 5. Documentation Alignment | 0/TBD | Not started | - |
