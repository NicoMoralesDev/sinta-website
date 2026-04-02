# Project Research Summary

**Project:** SINTA Website
**Domain:** Brownfield motorsport results website and admin platform
**Researched:** 2026-04-02
**Confidence:** HIGH

## Executive Summary

This milestone is an incremental extension of an existing Next.js 16 and Postgres application, not a product reset. The research is consistent: experts would keep the current App Router, React, TypeScript, direct-SQL repository pattern, and Tailwind stack, then widen the existing event-results contract just enough to support an optional `qualy` session. The safest implementation path is to treat `qualy` as a first-class optional session across schema, shared types, repositories, services, admin payloads, and presentation helpers, while preserving current behavior for historical two-session events.

The recommended approach is to sequence work by dependency, not by surface visibility. First stabilize the data contract and session ordering rules, then refactor the admin results editor into a session-driven snapshot editor, then update public rendering and aggregate rules, then add the shareable event-image route on top of the canonical event DTO, and finally refresh docs against the real implementation. That order minimizes drift between admin, public pages, and the share image, and it keeps the chart fix aligned with the new session semantics.

The main risks are partial `qualy` rollout, accidental data loss from the admin replace-all save flow, and public statistics or charts silently counting `qualy` as a race result. Mitigation is straightforward but non-optional: define the session contract up front, reuse one shared session-ordering and event-shaping path, treat admin saves as full snapshots, and add targeted regression coverage for aggregate correctness, hidden-when-absent rendering, and page/image parity.

## Key Findings

### Recommended Stack

The stack research strongly favors staying inside the existing platform. No new framework, ORM, chart library, or client-side screenshot package is justified for this milestone. The codebase already has the right boundaries: Next.js App Router for pages and route handlers, React for UI and server-rendered JSX, TypeScript for widening shared result types safely, Postgres plus `pg` for the existing results model, and Tailwind for consistent styling.

The only notable implementation-specific recommendation is to use `next/og` and `ImageResponse` for the shareable event-results image. That keeps sharing server-side, deterministic, and aligned with the existing public read model, while avoiding the operational and maintenance cost of browser screenshot tooling or third-party chart/image packages.

**Core technologies:**
- Next.js 16.1.6: App Router pages, route handlers, and image generation — already matches the repo structure and supports the image route without extra infrastructure.
- React 19.2.4: Public pages, admin islands, and image JSX composition — the required changes are incremental component and typing work.
- TypeScript 5.9.3: Shared result, session, and API contracts — the key guardrail for optional `qualy` compatibility across layers.
- PostgreSQL with `pg` 8.16.3: Existing persistence and query model — `qualy` is a schema-and-query extension, not a reason to add an ORM.
- Tailwind CSS 4.1.18: Existing styling system — enough for public/admin updates and image visual parity without introducing new UI tooling.
- `next/og`: Server-side share-image generation — preferred over client DOM capture or headless-browser screenshots for this scope.

### Expected Features

The feature research is clear: every active milestone item is P1, but they are not equal in dependency weight. Optional `qualy` support and hidden-when-absent presentation are the core product change. The shareable event-results image is the single differentiator worth shipping now, but only after the event-results contract is stable. The chart fix and documentation refresh are mandatory polish items because both affect trust: one in stats semantics, one in maintainability.

The research also sets strong anti-scope boundaries. Do not expand image export into social integrations, multi-layout graphics tooling, historical `qualy` backfills, or a broad analytics redesign. Those ideas are plausible follow-ons, but they dilute the milestone and introduce unnecessary operational risk.

**Must have (table stakes):**
- Optional `qualy` support across admin, APIs, and public results views — users expect motorsport results to accommodate qualifying when it exists.
- Conditional `qualy` visibility — older events must remain clean, with no empty qualifying noise.
- Recent-positions chart axis correctness — P1 must visually read as best, or the stats surface loses credibility.
- Documentation refresh — operational docs must match the real runtime and admin behavior.

**Should have (competitive):**
- Shareable image for a specific event results table — a focused, messaging-friendly distribution feature without social-platform integration.

**Defer (v2+):**
- Direct social publishing or network-specific sharing integrations — too much auth and maintenance cost for current value.
- Historical `qualy` backfill — only worth considering if trustworthy source data becomes available.
- Multi-layout graphics variants or broader chart/analytics expansion — outside the milestone’s narrow scope.

### Architecture Approach

The architecture research points to one dominant strategy: extend the existing history and admin domains in place, and keep all surfaces dependent on the same event-results semantics. That means widening `SessionKind`, updating the `event_results` schema, moving the admin grid from fixed columns to a session-driven snapshot model, keeping public visibility rules in presentation helpers, and building the share-image route as a thin adapter over the same history-service read model used by `/results`.

**Major components:**
1. Public results composition: render event participation tables and expose the share trigger using the canonical history DTO.
2. Admin results editor: load and save a full event snapshot through a session-driven grid so `qualy` can be entered safely.
3. History service and repository: own public event shaping, aggregate filtering, session ordering, and the event-by-id read needed by both page and image surfaces.
4. Admin service and repository: own validation, snapshot replacement safety, and persistence of per-driver session results.
5. Share-image route: generate one event-specific image from canonical event data, not from a separate SQL path.

### Critical Pitfalls

1. **Partial `qualy` rollout across layers** — define the session contract first, then update schema, shared types, repositories, services, APIs, and UI surfaces together.
2. **Admin replace-all saves dropping existing results** — treat the editor as a full snapshot, preload every persisted cell, submit unchanged cells too, and test “edit one field, preserve the rest.”
3. **Public stats and charts counting `qualy` as race data** — explicitly scope aggregate queries and driver chart selectors to race sessions where required.
4. **`qualy` showing as empty noise or in inconsistent order** — centralize session ordering and render `qualy` only when real data exists for that event in public-facing surfaces.
5. **Share image drifting from the public results table** — reuse the same event-shaping logic and verify page/image parity for the same event.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Results Contract And Schema
**Rationale:** Every other milestone item depends on a stable definition of `qualy` and deterministic session ordering.
**Delivers:** Schema migration, widened `SessionKind`, shared ordering/label helpers, and repository/service support for optional `qualy`.
**Addresses:** Optional `qualy` support.
**Avoids:** Partial `qualy` rollout and inconsistent contracts across layers.

### Phase 2: Admin Editing Safety
**Rationale:** Maintainers need a safe way to create and verify `qualy` data before public presentation and image export rely on it.
**Delivers:** Session-driven admin grid, full-snapshot payload handling, validation updates, and regression coverage for preserve-on-edit behavior.
**Uses:** TypeScript shared contracts, existing admin service/repository pattern, Postgres persistence.
**Implements:** Admin event results editor plus admin write domain.
**Addresses:** Optional `qualy` support in admin flows.
**Avoids:** Replace-all save data loss and ambiguous blank-versus-missing semantics.

### Phase 3: Public Results And Stats Correctness
**Rationale:** Once data entry is safe, public read models and visuals can expose `qualy` without corrupting existing race-focused features.
**Delivers:** Hidden-when-absent `qualy` rendering, deterministic session order in public tables, aggregate query filtering, and the recent-positions chart fix excluding `qualy`.
**Uses:** Existing history service/repository and public component layer.
**Implements:** Public results composition, leaderboard/highlight rules, and driver profile visualization updates.
**Addresses:** Conditional `qualy` visibility and chart axis correctness.
**Avoids:** Empty presentation noise, broken ordering, and race stats inflated by `qualy`.

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
- The chart fix belongs with public read-model work because its correctness depends on explicit session-selection rules after `qualy` exists.
- This grouping directly addresses the highest-risk pitfalls in the order they are most likely to surface.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** Confirm the exact migration strategy for extending `session_kind` in the current Postgres schema and any import-path implications.
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
- Import behavior for `qualy`: decide whether spreadsheet import is in scope now or whether `qualy` is admin-entry-only in this milestone, then document that explicitly.
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
