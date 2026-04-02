# Project Research Summary

**Project:** SINTA Website
**Domain:** Brownfield motorsport results website and admin platform
**Researched:** 2026-04-02
**Confidence:** HIGH

## Executive Summary

This milestone is an incremental extension of an existing Next.js 16 and Postgres application, not a product reset. The research is consistent: experts would keep the current App Router, React, TypeScript, direct-SQL repository pattern, and Tailwind stack, then widen the existing event-results contract into a canonical five-column model: `QS`, `S`, `QF`, `F`, and `P`. The safest implementation path is to treat that five-column shape, points-based ranking, and championship organizer metadata as first-class concerns across schema, shared types, repositories, services, admin payloads, and presentation helpers, while preserving current behavior for historical events that only have a subset of those values.

The recommended approach is to sequence work by dependency, not by surface visibility. First stabilize the data contract, points-based ordering rules, and championship metadata, then refactor the admin results and championship editing flows, then update public rendering and aggregate rules, then add the shareable event-image route on top of the canonical event DTO, and finally refresh docs against the real implementation. That order minimizes drift between admin, public pages, and the share image, and it keeps the chart fix aligned with the new result semantics.

The main risks are partial rollout of the canonical result columns, accidental data loss from the admin replace-all save flow, event rows being sorted inconsistently with their published points, and public statistics or charts silently treating new session data as race results. Mitigation is straightforward but non-optional: define the shared contract up front, centralize session/column ordering and points-based ranking, treat admin saves as full snapshots, and add targeted regression coverage for aggregate correctness, public-label rendering, and page/image parity.

## Key Findings

### Recommended Stack

The stack research strongly favors staying inside the existing platform. No new framework, ORM, chart library, or client-side screenshot package is justified for this milestone. The codebase already has the right boundaries: Next.js App Router for pages and route handlers, React for UI and server-rendered JSX, TypeScript for widening shared result types safely, Postgres plus `pg` for the existing results model, and Tailwind for consistent styling.

The only notable implementation-specific recommendation is to use `next/og` and `ImageResponse` for the shareable event-results image. That keeps sharing server-side, deterministic, and aligned with the existing public read model, while avoiding the operational and maintenance cost of browser screenshot tooling or third-party chart/image packages.

**Core technologies:**
- Next.js 16.1.6: App Router pages, route handlers, and image generation — already matches the repo structure and supports the image route without extra infrastructure.
- React 19.2.4: Public pages, admin islands, and image JSX composition — the required changes are incremental component and typing work.
- TypeScript 5.9.3: Shared result, session, ranking, and API contracts — the key guardrail for the canonical `QS`/`S`/`QF`/`F`/`P` model across layers.
- PostgreSQL with `pg` 8.16.3: Existing persistence and query model — the expanded event-results shape and organizer metadata are schema-and-query extensions, not a reason to add an ORM.
- Tailwind CSS 4.1.18: Existing styling system — enough for public/admin updates and image visual parity without introducing new UI tooling.
- `next/og`: Server-side share-image generation — preferred over client DOM capture or headless-browser screenshots for this scope.

### Expected Features

The feature research is clear: every active milestone item is P1, but they are not equal in dependency weight. The canonical five-column event-results model, points-based ranking, and championship organizer metadata are the core product changes. The shareable event-results image is the single differentiator worth shipping now, but only after the event-results contract is stable. The chart fix and documentation refresh are mandatory polish items because both affect trust: one in stats semantics, one in maintainability.

The research also sets strong anti-scope boundaries. Do not expand image export into social integrations, multi-layout graphics tooling, historical backfills for `QS`/`QF`/points, or a broad analytics redesign. Those ideas are plausible follow-ons, but they dilute the milestone and introduce unnecessary operational risk.

**Must have (table stakes):**
- Canonical `QS`, `S`, `QF`, `F`, and `P` support across admin, APIs, and public results views.
- Points-based event ordering that matches the published standings instead of relying on final-race position.
- Championship organizer metadata surfaced in an appropriate public championship label or heading.
- Recent-positions chart axis correctness — P1 must visually read as best, or the stats surface loses credibility.
- Documentation refresh — operational docs must match the real runtime and admin behavior.

**Should have (competitive):**
- Shareable image for a specific event results table — a focused, messaging-friendly distribution feature without social-platform integration.

**Defer (v2+):**
- Direct social publishing or network-specific sharing integrations — too much auth and maintenance cost for current value.
- Historical `QS`/`QF`/points backfill — only worth considering if trustworthy source data becomes available.
- Multi-layout graphics variants or broader chart/analytics expansion — outside the milestone’s narrow scope.

### Architecture Approach

The architecture research points to one dominant strategy: extend the existing history and admin domains in place, and keep all surfaces dependent on the same event-results semantics. That means widening the event-results contract to represent `QS`, `S`, `QF`, `F`, and `P`, updating schema and ordering logic, moving the admin grid from fixed columns to a canonical results snapshot model, adding championship organizer metadata to the championship domain, keeping public visibility rules in presentation helpers, and building the share-image route as a thin adapter over the same history-service read model used by `/results`.

**Major components:**
1. Public results composition: render event participation tables and expose the share trigger using the canonical history DTO, points ordering, and championship organizer label.
2. Admin results editor and championship editor: load and save a full event snapshot through a canonical results grid and maintain organizer metadata safely.
3. History service and repository: own public event shaping, aggregate filtering, session/column ordering, points-based ranking, championship metadata reads, and the event-by-id read needed by both page and image surfaces.
4. Admin service and repository: own validation, snapshot replacement safety, championship organizer persistence, and per-driver event result writes.
5. Share-image route: generate one event-specific image from canonical event data, not from a separate SQL path.

### Critical Pitfalls

1. **Partial rollout of `QS`/`S`/`QF`/`F`/`P` across layers** — define the shared contract first, then update schema, shared types, repositories, services, APIs, and UI surfaces together.
2. **Admin replace-all saves dropping existing results** — treat the editor as a full snapshot, preload every persisted cell, submit unchanged cells too, and test “edit one field, preserve the rest.”
3. **Public event rows sorted inconsistently with published points** — centralize points-based ordering so admin, public pages, APIs, and share images all rank rows the same way.
4. **Public stats and charts counting `QS` or `QF` as race data** — explicitly scope aggregate queries and driver chart selectors to race sessions where required.
5. **Organizer metadata appearing in the wrong place or adding UI clutter** — bind organizer display to the championship label or heading instead of per-row result cells.
6. **Share image drifting from the public results table** — reuse the same event-shaping logic and verify page/image parity for the same event.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Results Contract, Ordering, And Championship Metadata
**Rationale:** Every other milestone item depends on a stable definition of the canonical result columns, points-based ordering, and championship organizer metadata.
**Delivers:** Schema migration, widened shared result contracts, points-order helpers, championship organizer support, and repository/service support for the canonical event-results shape.
**Addresses:** Canonical event-results support, points ordering, and organizer metadata.
**Avoids:** Partial contract rollout and inconsistent ranking or metadata reads across layers.

### Phase 2: Admin Results And Championship Editing
**Rationale:** Maintainers need a safe way to create and verify the canonical result columns and championship organizer metadata before public presentation and image export rely on them.
**Delivers:** Canonical admin results grid, full-snapshot payload handling, championship organizer editing, validation updates, and regression coverage for preserve-on-edit behavior.
**Uses:** TypeScript shared contracts, existing admin service/repository pattern, Postgres persistence.
**Implements:** Admin event results editor, championship editing flow, and admin write domain updates.
**Addresses:** Canonical results support and organizer management in admin flows.
**Avoids:** Replace-all save data loss and ambiguous blank-versus-missing semantics.

### Phase 3: Public Results, Organizer Display, And Driver Stats Correctness
**Rationale:** Once data entry is safe, public read models and visuals can expose the canonical result columns and organizer metadata without corrupting existing race-focused features.
**Delivers:** Canonical public table rendering, points-based row ordering, organizer label rendering, aggregate query filtering, and the recent-positions chart fix excluding non-race sessions.
**Uses:** Existing history service/repository and public component layer.
**Implements:** Public results composition, leaderboard/highlight rules, and driver profile visualization updates.
**Addresses:** Public canonical column rendering, organizer display, and chart axis correctness.
**Avoids:** Empty presentation noise, broken ordering, misplaced metadata, and race stats inflated by non-race sessions.

### Phase 4: Event Share Image
**Rationale:** The image route should be built on top of the finalized public event DTO so the exported asset cannot drift from `/results`.
**Delivers:** Event-by-id history read, `app/api/v1/results/events/[id]/image/route.ts`, and a simple share/download trigger in the public results flow.
**Uses:** Next.js `ImageResponse` via `next/og`.
**Implements:** Shareable image generation as a thin adapter over canonical event data.
**Addresses:** Shareable image export for a specific event table.
**Avoids:** Separate SQL paths, inconsistent session rendering, and over-expansion into social integrations.

### Phase 5: Documentation And Final Verification
**Rationale:** Docs should be updated only after behavior, route paths, and verification limits are known.
**Delivers:** Updated milestone-facing docs, honest verification notes, and command/runtime caveats aligned with the current checkout.
**Addresses:** Documentation refresh.
**Avoids:** Docs claiming unsupported behavior or test coverage.

### Phase Ordering Rationale

- The order follows the real dependency graph: schema and shared contracts first, admin write safety second, public read semantics third, image export fourth, and docs last.
- Public rendering and the share image are intentionally separated so the image route can depend on stable event-shaping logic instead of defining it.
- The chart fix belongs with public read-model work because its correctness depends on explicit session-selection rules after the canonical result model exists.
- This grouping directly addresses the highest-risk pitfalls in the order they are most likely to surface.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** Confirm the exact migration strategy for supporting the canonical result columns plus championship organizer metadata in the current Postgres schema and any import-path implications.
- **Phase 4:** Validate final `ImageResponse` runtime details, font/asset constraints, and caching behavior against the chosen implementation.
- **Phase 5:** Confirm which documented commands are actually reliable in the current checkout, especially around known test limitations.

Phases with standard patterns (skip research-phase):
- **Phase 2:** The existing admin service/repository and snapshot-replacement flow are well understood; this is mainly a careful refactor plus regression coverage.
- **Phase 3:** Public component wiring and aggregate filtering follow established repo patterns once the session contract is settled.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Based on the repo’s pinned dependencies and current official Next.js documentation for route handlers and `ImageResponse`. |
| Features | MEDIUM | Product scope is clear, but competitive framing and sharing-value assumptions are less authoritative than the internal milestone definition. |
| Architecture | HIGH | Grounded in the current codebase structure and explicit extension points already present in history/admin domains. |
| Pitfalls | HIGH | Strongly supported by current implementation constraints, known save behavior, and the repo’s existing two-session assumptions. |

**Overall confidence:** HIGH

### Gaps to Address

- Exact migration shape for `session_kind`: validate the safest production-compatible Postgres change during phase planning before implementation.
- Import behavior for `QS`/`QF`/points: decide whether spreadsheet import is in scope now or whether the new columns are admin-entry-only in this milestone, then document that explicitly.
- Share-image runtime details: confirm final route runtime, font strategy, and cache behavior before coding the image surface.
- Verification baseline: account for known test-suite limitations so the roadmap and final docs do not assume a fully clean default test gate.

## Sources

### Primary (HIGH confidence)
- `/home/nico/projects/sinta-website/.planning/PROJECT.md` — milestone scope, constraints, and out-of-scope boundaries.
- `/home/nico/projects/sinta-website/.planning/research/STACK.md` — recommended technologies, versions, and official-doc references.
- `/home/nico/projects/sinta-website/.planning/research/ARCHITECTURE.md` — component boundaries, patterns, integration points, and build order.
- `/home/nico/projects/sinta-website/.planning/research/PITFALLS.md` — implementation risks, prevention strategies, and verification expectations.
- https://nextjs.org/docs/app/api-reference/functions/image-response — official guidance for server-side image generation.
- https://nextjs.org/docs/app/getting-started/route-handlers — official guidance for current App Router route-handler patterns.

### Secondary (MEDIUM confidence)
- `/home/nico/projects/sinta-website/.planning/research/FEATURES.md` — table stakes, differentiators, anti-features, and roadmap priorities.
- Formula 1 official results archive — evidence that session-level qualifying views are standard in motorsport results products.
- The Third Turn examples — evidence that session-aware motorsport result presentation is normal in the domain.

### Tertiary (LOW confidence)
- None beyond the feature-level market comparisons already captured in `FEATURES.md`.

---
*Research completed: 2026-04-02*
*Ready for roadmap: yes*
