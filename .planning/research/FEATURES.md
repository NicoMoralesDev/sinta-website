# Feature Research

**Domain:** Motorsport results website and admin platform (current milestone scope)
**Researched:** 2026-04-02
**Confidence:** MEDIUM

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Optional qualifying result support in existing event results flows | In motorsport, qualifying is a standard session artifact when it exists. Admins expect to record it, and results viewers expect it to appear alongside race outcomes. | MEDIUM | Extend the current two-session event-results model across admin types, services, repositories, APIs, and public rendering. Keep backward compatibility with legacy events that only have sprint/final data. |
| Conditional `qualy` visibility when data is absent | Motorsport tables should stay readable. Empty qualifying columns or placeholders make older events look broken instead of intentionally incomplete. | LOW | This is part of the `qualy` rollout, not a separate product surface. Public and admin views should omit `qualy` entirely when no recorded value exists for that event. |
| Recent-positions chart axis correctness | A driver trend chart that visually treats worse finishes as “higher” breaks trust in the stats page. Users expect P1 to read as best immediately. | LOW | Localized visualization fix. No schema change should be required, but regression coverage should be added because the driver profile uses this chart as a credibility feature. |
| Documentation refresh for actual runtime and admin behavior | This is an admin-operated brownfield app with manual imports and operational workflows. Current docs must match the app or routine maintenance becomes error-prone. | LOW | Update only the docs affected by this milestone: event results semantics, share flow, and current commands/workflows. Do not turn this into a broad documentation rewrite. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Shareable image for a specific event results table | Gives SINTA a lightweight distribution tool for WhatsApp and other messaging channels without requiring users to crop screenshots or wait for custom graphics. | MEDIUM | Generate one deterministic image from the canonical event results table. Scope it to a single event table export path, optimized for mobile messaging, with no direct social integrations. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Direct social platform integrations | Feels like the natural next step after adding sharing. | Adds OAuth, platform-specific APIs, publish failures, permission handling, and ongoing maintenance far beyond this milestone’s value. | Generate a downloadable/shareable event-results image only. |
| Historical `qualy` backfill or synthetic qualifying values | Stakeholders may want old events to “look consistent” once `qualy` exists. | Synthetic or partial backfills reduce data trust and create migration/import scope that the milestone explicitly avoids. | Support `qualy` only where real data exists and hide it everywhere else. |
| Multi-layout graphics studio for results | Once one share image exists, it is tempting to ask for branded variants, multiple aspect ratios, overlays, and templates. | Turns a focused export feature into a design-tool product with high UI and maintenance cost. | Ship one stable layout for one event table, then evaluate real usage. |
| Broad chart redesign or analytics expansion | The recent-positions issue can trigger requests for richer dashboards at the same time. | Expands a small correctness fix into a larger data-viz project and distracts from the core milestone. | Fix the Y-axis semantics only and defer broader chart work. |
| Full documentation overhaul | Documentation work can easily spread into package-manager cleanup, style normalization, or total IA rework. | Large doc churn is expensive to review and easy to desynchronize again. | Refresh only the pages touched by the new milestone behavior. |

## Feature Dependencies

```text
[Optional qualy support]
    └──requires──> [Event results model + admin grid extension]
                       └──requires──> [Repository/service/type/API updates]

[Conditional qualy visibility] ──requires──> [Optional qualy support]

[Shareable event-results image]
    └──requires──> [Stable event results table payload/rendering]
                       └──enhances──> [Optional qualy support when qualy exists]

[Documentation refresh] ──requires──> [Finalized qualy + share-flow behavior]

[Direct social integrations] ──conflicts──> [Milestone-scoped image export]
```

### Dependency Notes

- **Optional qualy support requires event results model + admin grid extension:** the current admin editor explicitly models two sessions per event, so `qualy` cannot be added safely as a view-only tweak.
- **Conditional qualy visibility requires optional qualy support:** hiding logic depends on `qualy` being represented as optional throughout the stack rather than faked with empty values.
- **Shareable event-results image requires stable event results table payload/rendering:** the image generator should reuse the same canonical event-results data contract, not introduce a second interpretation of standings.
- **Shareable event-results image enhances optional qualy support:** once `qualy` exists, the exported image can include it where present, but export should not block the core data-model change.
- **Documentation refresh requires finalized qualy + share-flow behavior:** otherwise docs will immediately drift again.
- **Direct social integrations conflict with milestone-scoped image export:** both solve “sharing,” but the second path keeps implementation narrow and operationally safe.

## MVP Definition

### Launch With (v1)

Minimum viable product for this milestone.

- [ ] Optional `qualy` support across admin, API, and public results views, with hidden-when-absent behavior
- [ ] Shareable image export for one specific event results table
- [ ] Recent-positions chart axis fix so visual ranking matches motorsport semantics
- [ ] Documentation updates for the changed event-results and sharing flows

### Add After Validation (v1.x)

- [ ] Qualy-inclusive vs race-only share variants if maintainers repeatedly request both
- [ ] Automatic OG/social preview images for event URLs if link sharing becomes a measurable growth path

### Future Consideration (v2+)

- [ ] Direct publishing to social networks if manual image sharing proves insufficient
- [ ] Historical `qualy` ingestion/backfill only if trustworthy source data becomes consistently available

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Optional `qualy` support | HIGH | MEDIUM | P1 |
| Conditional `qualy` visibility | HIGH | LOW | P1 |
| Shareable event-results image | HIGH | MEDIUM | P1 |
| Recent-positions chart axis fix | MEDIUM | LOW | P1 |
| Documentation refresh | MEDIUM | LOW | P1 |

**Priority key:**
- P1: Must have for this milestone
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Competitor A | Competitor B | Our Approach |
|---------|--------------|--------------|--------------|
| Session-level results | Formula 1’s official results archive exposes event-level session views such as `Qualifying` and `Race Result`, reinforcing that session granularity is expected. | The Third Turn commonly separates starting/result context and event-level result records, reinforcing motorsport users’ expectation for session-aware data. | Add optional `qualy` support to the existing event-results flow without forcing it onto legacy events. |
| Shareability | Official series sites usually push users toward links, editorial images, or platform accounts rather than simple messaging-first exports. | Community results sites are mostly URL-first and not optimized for mobile messaging shares. | Export one deterministic event-results image tailored to WhatsApp-style sharing. |
| Stats trust | Established motorsport sites avoid visual semantics that invert competitive rank. | Community sites often stay tabular, but still keep positional meaning numerically intuitive. | Fix the chart axis only; do not expand this milestone into a chart-system redesign. |

## Sources

- Internal project scope: [/home/nico/projects/sinta-website/.planning/PROJECT.md](/home/nico/projects/sinta-website/.planning/PROJECT.md)
- Existing architecture boundaries: [/home/nico/projects/sinta-website/.planning/codebase/ARCHITECTURE.md](/home/nico/projects/sinta-website/.planning/codebase/ARCHITECTURE.md)
- Current codebase risks and constraints: [/home/nico/projects/sinta-website/.planning/codebase/CONCERNS.md](/home/nico/projects/sinta-website/.planning/codebase/CONCERNS.md)
- Current operational and product docs: [/home/nico/projects/sinta-website/README.md](/home/nico/projects/sinta-website/README.md)
- Deferred-feature baseline: [/home/nico/projects/sinta-website/docs/future-features.md](/home/nico/projects/sinta-website/docs/future-features.md)
- Formula 1 official results archive, showing per-event session views including `Qualifying` and `Race Result`: https://www.formula1.com/en/results/2026/races/1299/brazil/qualifying
- The Third Turn community motorsport results examples, showing start/result and qualifying-race style session granularity: https://www.thethirdturn.com/wiki/Trevor_LaTourrette/Results/2026 and https://www.thethirdturn.com/wiki/2025_Macau_Grand_Prix_Qualifying_Race

---
*Feature research for: Motorsport results website and admin platform*
*Researched: 2026-04-02*
