# SINTA Website

## What This Is

SINTA Website is the public results and driver statistics site for SINTA eSports, backed by a private admin area used to manage championships, events, roster data, live broadcast settings, and audit history. This milestone extends the existing brownfield application with a small set of practical improvements focused on richer race results, clearer driver statistics, lightweight event-result sharing, and documentation alignment.

## Core Value

SINTA can publish accurate, easy-to-consume championship results and driver stats quickly, and keep them maintainable through the existing admin workflow.

## Requirements

### Validated

- ✓ Public visitors can browse the home page, results hub, driver roster, and driver detail pages — existing
- ✓ Admin users can manage championships, events, roster data, users, and live broadcast settings through the admin area — existing
- ✓ Historical result data is persisted in Postgres and exposed through public and admin APIs — existing
- ✓ The site already presents event standings, current highlights, and driver statistics to end users — existing

### Active

- [ ] Add optional `qualy` result support to the existing event results model, admin editing flows, public results views, and relevant APIs
- [ ] Keep `qualy` hidden in public and admin presentation when an event does not have a recorded `qualy` value
- [ ] Add a simple share flow that generates a shareable image for a specific event results table, optimized for mobile messaging use cases such as WhatsApp, without direct social integrations
- [ ] Fix the driver recent-positions chart so the Y axis reflects race positions correctly
- [ ] Review and update project documentation so it matches the current application behavior and the new milestone scope

### Out of Scope

- Direct social network integrations or native sharing APIs beyond generating a shareable result image — not required for the current milestone
- Backfilling `qualy` data for historical events that do not already have it — old events should continue working without synthetic values
- Large UI redesigns or broad product expansion outside the results, statistics, sharing, and documentation improvements listed above — keep the milestone focused and low risk

## Context

This is a brownfield Next.js App Router application using React, TypeScript, Tailwind CSS, and Postgres. The codebase already has clear public and admin domains, with server-side services and repositories for history/results and admin operations. The current milestone is intentionally incremental: it adds one new optional result dimension (`qualy`), one narrow sharing capability for event standings, one chart correctness fix, and a documentation pass. The existing codebase map in `.planning/codebase/` should be treated as the baseline architectural reference for future planning.

## Constraints

- **Tech stack**: Stay within the existing Next.js 16, React 19, TypeScript, and Postgres stack — minimize surface area and avoid unnecessary dependency churn
- **Brownfield safety**: Extend the existing results/admin flows without breaking historical events that only have sprint/final data — backward compatibility matters
- **Data compatibility**: `qualy` is optional and must not render as empty noise for events where the value does not exist — preserve a clean public presentation
- **Scope control**: Sharing is limited to a simple event-results image export/generation flow — no social auth, scheduling, or platform-specific publishing features
- **Documentation**: Project and developer docs should remain concise, practical, and aligned with actual runtime behavior

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Treat `qualy` as an optional extension of the existing results model | The milestone must support new result data without forcing changes to older events | — Pending |
| Hide `qualy` wherever it is absent | Empty columns would reduce readability and create unnecessary UI noise | — Pending |
| Start sharing with a generated image of a single event standings table | This satisfies the immediate sharing need with the smallest reasonable implementation | — Pending |
| Exclude direct social integrations from v1 | The user explicitly does not want network-specific sharing features yet | — Pending |
| Keep this milestone focused on incremental product polish and correctness | The current need is practical improvement, not a major functional expansion | — Pending |

---
*Last updated: 2026-04-02 after initialization*
