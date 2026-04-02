# SINTA Website

## What This Is

SINTA Website is the public results and driver statistics site for SINTA eSports, backed by a private admin area used to manage championships, events, roster data, live broadcast settings, and audit history. This milestone extends the existing brownfield application with a more structured event results model, points-based event ordering, championship organizer metadata, lightweight event-result sharing, clearer driver statistics, and documentation alignment.

## Core Value

SINTA can publish accurate, easy-to-consume championship results and driver stats quickly, and keep them maintainable through the existing admin workflow.

## Requirements

### Validated

- ✓ Public visitors can browse the home page, results hub, driver roster, and driver detail pages — existing
- ✓ Admin users can manage championships, events, roster data, users, and live broadcast settings through the admin area — existing
- ✓ Historical result data is persisted in Postgres and exposed through public and admin APIs — existing
- ✓ The site already presents event standings, current highlights, and driver statistics to end users — existing

### Active

- [ ] Extend the existing event results model to support the canonical columns `QS`, `S`, `QF`, `F`, and `P` across admin editing flows, public results views, and relevant APIs
- [ ] Order event-result tables by points (`P`) instead of final-race position
- [ ] Preserve backward compatibility for historical events that do not have all session values, keeping the public presentation clean instead of fabricating missing data
- [ ] Add organizer metadata at the championship/tournament level and surface it in the most appropriate public championship label or heading
- [ ] Add a simple share flow that generates a shareable image for a specific event results table, optimized for mobile messaging use cases such as WhatsApp, without direct social integrations
- [ ] Fix the driver recent-positions chart so the Y axis reflects race positions correctly
- [ ] Review and update project documentation so it matches the current application behavior and the new milestone scope

### Out of Scope

- Direct social network integrations or native sharing APIs beyond generating a shareable result image — not required for the current milestone
- Backfilling historical `QS`, `QF`, or points data where trustworthy data does not already exist — old events should continue working without synthetic values
- Large UI redesigns or broad product expansion outside the results, statistics, sharing, and documentation improvements listed above — keep the milestone focused and low risk

## Context

This is a brownfield Next.js App Router application using React, TypeScript, Tailwind CSS, and Postgres. The codebase already has clear public and admin domains, with server-side services and repositories for history/results and admin operations. The current milestone is intentionally incremental, but broader than the first draft: it introduces a canonical five-column event-results shape (`QS`, `S`, `QF`, `F`, `P`), makes points the event-table ordering key, adds championship organizer metadata, keeps sharing limited to one event-table image export, fixes a chart correctness issue, and refreshes documentation. The existing codebase map in `.planning/codebase/` should be treated as the baseline architectural reference for future planning.

## Constraints

- **Tech stack**: Stay within the existing Next.js 16, React 19, TypeScript, and Postgres stack — minimize surface area and avoid unnecessary dependency churn
- **Brownfield safety**: Extend the existing results/admin flows without breaking historical events that only have a subset of the new canonical result columns — backward compatibility matters
- **Data compatibility**: The canonical event table is `QS`, `S`, `QF`, `F`, `P`, but historical events may legitimately lack some session values and should not render as broken or synthetic data
- **Ranking semantics**: Event standings should be driven by points (`P`), not by final-race position, so every read model and share/export surface must stay aligned
- **Metadata placement**: Championship organizer data belongs at the championship/tournament level and should be shown in a way that clarifies context without cluttering result tables
- **Scope control**: Sharing is limited to a simple event-results image export/generation flow — no social auth, scheduling, or platform-specific publishing features
- **Documentation**: Project and developer docs should remain concise, practical, and aligned with actual runtime behavior

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Treat `QS`, `S`, `QF`, `F`, and `P` as the canonical event-results columns | The milestone now requires a stable shared contract instead of a single extra qualifying column | — Pending |
| Order event standings by points (`P`) | The user explicitly wants each event table sorted by points rather than by final result | — Pending |
| Keep legacy events compatible by omitting unavailable session values instead of generating fake data | Historical events should remain readable and trustworthy even if they lack newer session fields | — Pending |
| Store organizer metadata at the championship/tournament level | Organizer belongs to the tournament context, not to each event row | — Pending |
| Show organizer inline with the championship label or heading, such as `Temporada 2026 - Clase 3 - (Organizador)` | This surfaces the data where users identify the competition without overloading each result row | — Pending |
| Start sharing with a generated image of a single event standings table | This satisfies the immediate sharing need with the smallest reasonable implementation | — Pending |
| Exclude direct social integrations from v1 | The user explicitly does not want network-specific sharing features yet | — Pending |
| Keep this milestone focused on incremental product polish and correctness | The current need is practical improvement, not a major functional expansion | — Pending |

---
*Last updated: 2026-04-02 after scope revision*
