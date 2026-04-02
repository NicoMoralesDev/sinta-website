# Requirements: SINTA Website

**Defined:** 2026-04-02
**Core Value:** SINTA can publish accurate, easy-to-consume championship results and driver stats quickly, and keep them maintainable through the existing admin workflow.

## v1 Requirements

### Results Data

- [x] **DATA-01**: Admin can store event participant results using the canonical columns `QS`, `S`, `QF`, `F`, and `P`
- [x] **DATA-02**: Admin can import or save event results with `QS`, `QF`, or `P` values without losing existing event data
- [x] **DATA-03**: Public consumers can retrieve event result data with canonical result fields and points-based ordering
- [x] **DATA-04**: Maintainer can store organizer metadata for each championship/tournament

### Admin Results

- [x] **ADMIN-01**: Admin can view and edit `QS`, `S`, `QF`, `F`, and `P` in the event results workflow
- [x] **ADMIN-02**: Admin can update a result cell or event row without unrelated persisted result values being dropped by the save flow
- [x] **ADMIN-03**: Admin can create and update championship/tournament organizer metadata in championship management

### Public Results

- [ ] **RESULT-01**: Visitor can view event result tables using the canonical column order `QS`, `S`, `QF`, `F`, `P`
- [ ] **RESULT-02**: Visitor sees event participants ordered by points instead of final-race position
- [ ] **RESULT-03**: Visitor does not see noisy empty session columns for historical events that lack `QS` or `QF` data
- [ ] **RESULT-04**: Visitor can see the championship/tournament organizer rendered in an appropriate public championship label or heading

### Sharing

- [ ] **SHARE-01**: Visitor can generate a shareable image for a specific event results table from the public results experience
- [ ] **SHARE-02**: Generated share image includes all drivers in the selected event table and preserves the canonical column order and points-based ranking shown to the visitor

### Driver Stats

- [ ] **STAT-01**: Visitor sees the recent-positions chart with race positions plotted in the correct direction so better finishes read as better performance
- [ ] **STAT-02**: Visitor sees driver trend and aggregate race statistics remain race-correct after `QS`, `QF`, and `P` support is added

### Documentation

- [ ] **DOC-01**: Maintainer can read project documentation that reflects the current runtime setup and admin/results workflows
- [ ] **DOC-02**: Maintainer can find documentation for the `QS`/`S`/`QF`/`F`/`P` results model, points-based ordering, organizer metadata, share-image flow, and any verification limits relevant to this milestone

## v2 Requirements

### Sharing

- **SHARE-03**: Visitor can publish shared result images directly to social platforms from the site
- **SHARE-04**: Maintainer can offer multiple branded share-image layouts or aspect ratios for the same event table

### Results Data

- **DATA-05**: Maintainer can backfill historical `QS`, `QF`, or points data for older events from trusted source data

### Analytics

- **STAT-03**: Visitor can access expanded driver analytics beyond the current recent-positions correction

## Out of Scope

| Feature | Reason |
|---------|--------|
| Direct social platform integrations | The current milestone only needs a simple shareable image, not network-specific publishing workflows |
| Historical `QS`/`QF`/points backfill for older events | Older events should continue working without synthetic or partially trusted extra session data |
| Multiple share-image layouts or templates | One stable event-table image is enough to validate the sharing feature |
| Broad chart redesign or analytics expansion | The milestone only needs the current chart correctness fix |
| Large documentation overhaul outside the touched workflows | The documentation pass should stay aligned to changed behavior, not become a repo-wide rewrite |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | Phase 1 | Complete |
| DATA-02 | Phase 1 | Complete |
| DATA-03 | Phase 1 | Complete |
| DATA-04 | Phase 1 | Complete |
| ADMIN-01 | Phase 2 | Complete |
| ADMIN-02 | Phase 2 | Complete |
| ADMIN-03 | Phase 2 | Complete |
| RESULT-01 | Phase 3 | Pending |
| RESULT-02 | Phase 3 | Pending |
| RESULT-03 | Phase 3 | Pending |
| RESULT-04 | Phase 3 | Pending |
| SHARE-01 | Phase 4 | Pending |
| SHARE-02 | Phase 4 | Pending |
| STAT-01 | Phase 3 | Pending |
| STAT-02 | Phase 3 | Pending |
| DOC-01 | Phase 5 | Pending |
| DOC-02 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0

---
*Requirements defined: 2026-04-02*
*Last updated: 2026-04-02 after scope revision*
