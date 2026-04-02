# Requirements: SINTA Website

**Defined:** 2026-04-02
**Core Value:** SINTA can publish accurate, easy-to-consume championship results and driver stats quickly, and keep them maintainable through the existing admin workflow.

## v1 Requirements

### Results Data

- [ ] **DATA-01**: Admin can store an optional `qualy` result for an event participant without requiring `qualy` on historical events that do not have it
- [ ] **DATA-02**: Admin can import or save event results with `qualy` values without losing existing sprint/final event results
- [ ] **DATA-03**: Public consumers can retrieve event result data with `qualy` included when it exists for the event

### Admin Results

- [ ] **ADMIN-01**: Admin can view and edit `qualy` results in the event results workflow alongside the existing result sessions
- [ ] **ADMIN-02**: Admin does not see an unnecessary `qualy` input or empty `qualy` column for events where no `qualy` data exists

### Public Results

- [ ] **RESULT-01**: Visitor can view `qualy` in an event results table when the selected event has recorded `qualy` data
- [ ] **RESULT-02**: Visitor does not see an empty `qualy` column for events that only have the existing result sessions
- [ ] **RESULT-03**: Visitor sees event result sessions in a clear and consistent order when `qualy` is present

### Sharing

- [ ] **SHARE-01**: Visitor can generate a shareable image for a specific event results table from the public results experience
- [ ] **SHARE-02**: Generated share image includes all drivers in the selected event table and matches the visible result sessions for that event

### Driver Stats

- [ ] **STAT-01**: Visitor sees the recent-positions chart with race positions plotted in the correct direction so better finishes read as better performance
- [ ] **STAT-02**: Visitor sees driver trend and aggregate race statistics remain race-correct after `qualy` support is added

### Documentation

- [ ] **DOC-01**: Maintainer can read project documentation that reflects the current runtime setup and admin/results workflows
- [ ] **DOC-02**: Maintainer can find documentation for the new `qualy` behavior, share-image flow, and any verification limits relevant to this milestone

## v2 Requirements

### Sharing

- **SHARE-03**: Visitor can publish shared result images directly to social platforms from the site
- **SHARE-04**: Maintainer can offer multiple branded share-image layouts or aspect ratios for the same event table

### Results Data

- **DATA-04**: Maintainer can backfill historical `qualy` results for older events from trusted source data

### Analytics

- **STAT-03**: Visitor can access expanded driver analytics beyond the current recent-positions correction

## Out of Scope

| Feature | Reason |
|---------|--------|
| Direct social platform integrations | The current milestone only needs a simple shareable image, not network-specific publishing workflows |
| Historical `qualy` backfill for older events | Older events should continue working without synthetic or partially trusted qualifying data |
| Multiple share-image layouts or templates | One stable event-table image is enough to validate the sharing feature |
| Broad chart redesign or analytics expansion | The milestone only needs the current chart correctness fix |
| Large documentation overhaul outside the touched workflows | The documentation pass should stay aligned to changed behavior, not become a repo-wide rewrite |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DATA-01 | TBC | Pending |
| DATA-02 | TBC | Pending |
| DATA-03 | TBC | Pending |
| ADMIN-01 | TBC | Pending |
| ADMIN-02 | TBC | Pending |
| RESULT-01 | TBC | Pending |
| RESULT-02 | TBC | Pending |
| RESULT-03 | TBC | Pending |
| SHARE-01 | TBC | Pending |
| SHARE-02 | TBC | Pending |
| STAT-01 | TBC | Pending |
| STAT-02 | TBC | Pending |
| DOC-01 | TBC | Pending |
| DOC-02 | TBC | Pending |

**Coverage:**
- v1 requirements: 14 total
- Mapped to phases: 0
- Unmapped: 14 ⚠️

---
*Requirements defined: 2026-04-02*
*Last updated: 2026-04-02 after initial definition*
