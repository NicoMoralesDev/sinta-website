# Pitfalls Research

**Domain:** Brownfield motorsport results website and admin platform milestone (`qualy`, share image, chart fix, docs refresh)
**Researched:** 2026-04-02
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Forcing `qualy` into the existing two-session contract without an explicit boundary

**What goes wrong:**
Developers add `qualy` in one layer only, or treat it as a third `session_kind` without fully tracing the impact across SQL, types, admin payloads, public DTOs, and rendering helpers. The result is partial support, broken type assumptions, or wider schema churn than the milestone needs.

**Why it happens:**
The current codebase is strongly shaped around exactly two result slots: `primary` and `secondary`. That assumption appears in `db/migrations/001_results_schema.sql`, `lib/server/history/types.ts`, `lib/server/admin/types.ts`, `lib/server/admin/service.ts`, `lib/server/admin/repository.ts`, and the public/admin UI components.

**How to avoid:**
Decide the `qualy` contract before implementation and keep it narrow. Document whether `qualy` is:
- an optional field attached to each driver row for an event, or
- a broader third session that must change enum, ordering, aggregation, and display logic everywhere.

Prefer the smallest model that satisfies the milestone. Build an impact checklist covering:
- DB schema and migration shape
- Admin DTOs and validation
- Public read-model DTOs
- Results rendering helpers
- API response shapes
- Tests for event result mapping

**Warning signs:**
- New code introduces `qualy` strings in UI files, but `SessionKind` still only allows `primary | secondary`
- A migration changes `session_kind` before read-model behavior is defined
- Results page, driver page, and admin grid each represent `qualy` differently
- Review diffs touch many unrelated read paths without a clear contract note

**Phase to address:**
Phase 1: Data contract and schema design

---

### Pitfall 2: The admin “replace all rows” flow silently drops existing results

**What goes wrong:**
Saving event results from the admin UI deactivates all rows for the event, then re-inserts the submitted set. If the new UI hides `qualy`, omits unchanged rows, or submits only visible fields, existing event data can disappear on save.

**Why it happens:**
`replaceEventResults()` in `lib/server/admin/repository.ts` is a full replacement operation. `updateEventResults()` in `lib/server/admin/service.ts` accepts only the submitted rows, and `EventsManager` currently builds the payload from editable client state rather than patching individual cells.

**How to avoid:**
Treat the admin results editor as a full snapshot editor, not a partial patch editor.
- Load every persisted result cell into the client state before editing
- Include unchanged persisted cells in the save payload
- Add a regression test for “edit one field, preserve the rest”
- If `qualy` is optional, distinguish between “no `qualy` for this event” and “blank input means delete existing `qualy`”
- Keep audit snapshots readable enough to detect accidental mass removal

**Warning signs:**
- Editing one result row causes unrelated rows or sessions to disappear after refresh
- Audit logs show a large before/after delta for a tiny admin change
- The admin payload builder conditionally excludes hidden or empty `qualy` cells without explicit deletion semantics
- Reviewers cannot tell whether blank means “unset” or “not rendered”

**Phase to address:**
Phase 2: Admin editing and persistence safety

---

### Pitfall 3: Optional `qualy` leaks into tables as empty noise or broken ordering

**What goes wrong:**
Public and admin tables render a `qualy` column even when an event has no `qualy` data, or place it in an inconsistent position relative to Sprint/Final. That degrades readability and makes older events look broken.

**Why it happens:**
The public table currently derives columns from the sessions actually present in each event via `getSessionColumns()` in `app/components/event-participation-list.tsx`, while the admin grid is hard-coded around two labeled cells. A naive “always show qualy” implementation will fight both behaviors.

**How to avoid:**
Define rendering rules explicitly:
- Show `qualy` only when at least one active row for that event has a real `qualy` value
- Keep session order deterministic across pages and images
- Reuse one shared session-order helper instead of duplicating ordering logic in public page, admin grid, and share image
- Add page-flow coverage for one event with `qualy` and one without it

**Warning signs:**
- Old events suddenly show blank `qualy` badges or placeholder values
- Admin and public pages disagree on column order or labels
- Session headers are derived differently in each surface
- Event cards become wider or harder to scan with mostly empty cells

**Phase to address:**
Phase 3: Public/admin presentation polish

---

### Pitfall 4: Race stats and highlights start counting `qualy` as a race result

**What goes wrong:**
Wins, podiums, top 5, top 10, “best driver” highlights, current championship leaderboard, and driver history charts become inflated or misleading because `qualy` rows are included in aggregate queries that were previously race-only.

**Why it happens:**
Most aggregate queries in `lib/server/history/repository.ts` currently operate over all active `event_results` rows. That is safe today because only `primary` and `secondary` exist and both are treated as race sessions. Adding `qualy` changes the meaning of “all rows”.

**How to avoid:**
Write down which features are race-result aggregates and which are full session timelines.
- Add explicit filters for the allowed session set in every aggregate query
- Review `getDriverStats()`, `getResultsOverview()`, `getHighlights()`, and `getCurrentChampionshipSummary()`
- Add repository tests proving `qualy` does not change wins/podiums/highlights unless that is intentionally required
- Keep driver/event display data separate from leaderboard math

**Warning signs:**
- A driver gains wins or podiums after only `qualy` data is loaded
- Event highlights pick pole position instead of best race finish
- Current championship leaderboard changes when only `qualy` is edited
- Queries still use “all active event_results” after the schema change

**Phase to address:**
Phase 3: Public read-model rules and aggregate correctness

---

### Pitfall 5: The chart axis fix only flips the line visually, not the underlying meaning

**What goes wrong:**
The recent-positions sparkline looks inverted correctly, but the labels, selected data points, or interpretation remain wrong. A common version of this bug is “best” and “worst” still being derived from the old orientation, or the chart starting to include `qualy` points when the intended axis fix was only for race positions.

**Why it happens:**
`SparklinePositions` in `app/components/visualizations.tsx` currently plots `y` directly from `position - min`, and `app/drivers/[slug]/page.tsx` feeds it every numeric event result in the driver history. The visual bug and the data-selection rule are coupled.

**How to avoid:**
Fix the chart as a semantics change, not just an SVG tweak.
- Define which session(s) feed the “recent positions” chart
- Invert the Y mapping so lower positions render higher
- Re-check the `Best: Pn | Worst: Pn` copy after the visual inversion
- Add a focused component/spec asserting the generated points for `[1, 5, 10]` or equivalent
- Verify the heatmap and sparkline use intentionally different rules if that is desired

**Warning signs:**
- The line direction changes, but the legend/copy becomes inconsistent
- The chart shifts when `qualy` is added, even though the milestone only asked for a race-position axis fix
- There is no automated test for ascending/descending position samples
- Manual QA relies only on one driver with flat results

**Phase to address:**
Phase 3: Driver profile chart correctness

---

### Pitfall 6: The share image becomes a second, drifting implementation of the results table

**What goes wrong:**
The generated image does not match the table users see on `/results`, uses different session ordering, exposes wrong/inactive data, or breaks in production because the image runtime has different rendering constraints than a normal page.

**Why it happens:**
The repo does not currently have an image-generation path. It is easy to rebuild the table separately for an image route instead of reusing one formatting contract, and easy to forget runtime constraints such as font loading, caching behavior, and the need for deterministic event selection.

**How to avoid:**
Keep the image feature deliberately narrow.
- Generate images for a specific `eventId`, not arbitrary free-form filters
- Reuse the same event-result shaping logic used by the public results table
- Decide early whether the route runs on Node or Edge and verify the chosen API supports the needed assets/fonts in Next.js 16
- Add a server test for the route payload selection and a manual visual checklist for mobile readability
- Exclude inactive rows/events/drivers exactly the same way as the public page

**Warning signs:**
- The image route introduces custom SQL instead of reusing existing service/repository shaping
- The same event shows different labels/order in page vs image
- Generated images require admin context or non-deterministic client state
- Visual QA only checks desktop browser preview, not compressed mobile-share output

**Phase to address:**
Phase 4: Share image implementation

---

### Pitfall 7: Documentation is refreshed without matching real commands, env behavior, and test limitations

**What goes wrong:**
README and milestone docs claim the new features are complete, but local verification still fails or behaves differently in practice. The most likely misses are admin dry-run behavior, the already-failing default test suite, outdated API examples, and package-manager ambiguity.

**Why it happens:**
The current docs are partly outdated relative to the codebase. `README.md` mixes Spanish and English, documents `npm`, and the repo contains both `package-lock.json` and `pnpm-lock.yaml`. `npm run test` is already known to fail on a clean checkout because `tests/history-parser.spec.ts` depends on a missing workbook.

**How to avoid:**
Treat docs refresh as verification work, not copy editing.
- Re-run every documented command that the milestone mentions
- Call out that `npm run test` is not a clean-checkout gate until the workbook dependency is addressed
- Document admin dry-run implications for result editing verification
- Update API and route docs only after the final route shape is settled
- Keep milestone notes explicit about what was manually verified versus automatically covered

**Warning signs:**
- Docs say “run tests” without mentioning the known parser fixture failure
- Screenshots or share-image instructions omit required event preconditions
- API docs mention fields that the actual route does not return
- Review summary says “verified” but lists only lint/typecheck

**Phase to address:**
Phase 5: Documentation and regression verification

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Reusing `primary` or `secondary` to secretly mean `qualy` for some championships | Avoids a schema change | Corrupts semantics across stats, charts, admin labels, and future imports | Never |
| Duplicating session-order logic in public page, admin grid, and image route | Fast implementation per surface | Surfaces drift quickly and regress independently | Only for a temporary spike, not merged production code |
| Counting every `event_results` row in aggregates | Zero query refactor | Wins, podiums, highlights, and trend lines become wrong once `qualy` exists | Never after `qualy` lands |
| Treating docs refresh as prose-only work | Faster milestone closeout | README and operator workflows diverge from the real app | Never |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Postgres migrations | Adding `qualy` behavior in app code before every environment has the required schema change | Ship the migration and the app contract together, and verify queries fail safely if the schema is stale |
| Next.js image generation | Assuming a normal page/component can be reused 1:1 inside an image route without runtime/font constraints | Decide the image runtime first, keep the layout deterministic, and test the route directly in the chosen runtime |
| Admin write flow | Verifying in dev without noticing `ADMIN_DEV_DRY_RUN=1` | Make dry-run state explicit during QA and document when a real write check was performed |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Generating share images with fresh DB work on every request and no narrow event lookup | Slow image response, repeated DB reads, inconsistent output timing | Restrict to a specific event, reuse existing query shaping, and cache where appropriate | Noticeable once a shared image URL gets reused in chats/social previews |
| Recomputing wide result tables separately for page and image | Duplicate query work and more drift bugs | Centralize event-result shaping once and fan out to page/image renderers | Breaks immediately in maintenance terms, not just at scale |
| Expanding the admin grid with more client-only state but no targeted tests | UI becomes harder to reason about and regressions hide behind refreshes | Keep grid state explicit and add focused save/load regression specs | Breaks as soon as more than two editable result dimensions exist |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Building the share image from admin-only or inactive result data | Public image URLs can expose unpublished or soft-deleted data | Use the same active-only public read model as `/results` |
| Accepting broad free-form filters on the image route | Easier abuse, heavier DB work, and harder cache semantics | Require a specific public event identifier and validate it strictly |
| Treating the image route as “just presentation” and skipping output review | Wrong event labels or stale data can be widely redistributed | Add manual verification against the canonical `/results` table before release |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Showing a `qualy` column with mostly empty cells | Older events look incomplete or buggy | Render `qualy` only when the event actually has data |
| Making the share image match desktop density instead of mobile messaging constraints | Text becomes unreadable once compressed in WhatsApp-like flows | Design for narrow width, larger type, and a single event table only |
| Fixing the chart axis but not the narrative around “good” vs “bad” positions | Users still misread performance trends | Invert the line and verify labels/examples with real driver histories |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **`qualy` support:** Often missing aggregate rules. Verify wins, podiums, highlights, and leaderboard behavior with and without `qualy`.
- [ ] **Admin editor:** Often missing snapshot preservation. Verify editing one cell does not remove untouched event results.
- [ ] **Optional presentation:** Often missing hidden-state logic. Verify old events render with no blank `qualy` column in public and admin views.
- [ ] **Share image:** Often missing parity checks. Verify the generated image matches the same event table on `/results`.
- [ ] **Chart fix:** Often missing semantic validation. Verify “best” is visually highest and labels still match the plotted data.
- [ ] **Docs refresh:** Often missing real command validation. Verify README commands and caveats reflect the current checkout behavior.

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Partial `qualy` contract rollout | HIGH | Freeze further UI work, document the intended contract, revert ambiguous schema/API changes, and add mapping tests before reintroducing the feature |
| Admin save removed event results | HIGH | Use the `event_results` audit trail to identify the last good snapshot, restore via controlled revert, and add a regression test before reopening editing |
| Aggregates started counting `qualy` | MEDIUM | Patch the scoped queries, back-verify affected driver/championship pages, and compare before/after numbers for known events |
| Share image diverges from page table | MEDIUM | Switch the image route to the canonical event-shaping helper, invalidate stale output, and visually compare event/page/image for one fixture event |
| Docs claim unsupported verification | LOW | Correct the docs immediately, list the real verification gap, and avoid marking the milestone complete until the missing check runs |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Forcing `qualy` into the two-session contract without an explicit boundary | Phase 1: Data contract and schema design | Written contract note plus impacted-type/query inventory reviewed before coding |
| Admin “replace all rows” flow silently drops existing results | Phase 2: Admin editing and persistence safety | Regression test for editing one field while preserving the rest of the event snapshot |
| Optional `qualy` leaks into tables as empty noise or broken ordering | Phase 3: Public/admin presentation polish | Flow checks for one event with `qualy` and one without it on both admin and public views |
| Race stats and highlights start counting `qualy` as a race result | Phase 3: Public read-model rules and aggregate correctness | Repository/service tests showing unchanged leaderboard/highlight math when only `qualy` is added |
| Chart axis fix only flips the line visually, not the meaning | Phase 3: Driver profile chart correctness | Focused chart test plus manual sanity check with known position samples |
| Share image becomes a second, drifting implementation of the results table | Phase 4: Share image implementation | Route output compared against the canonical event table for the same event |
| Documentation refresh misses real commands and test limitations | Phase 5: Documentation and regression verification | Verification section lists actual commands run, expected failures, and manual checks honestly |

## Sources

- Internal planning context: `.planning/PROJECT.md`
- Codebase risks and testing gaps: `.planning/codebase/CONCERNS.md`, `.planning/codebase/TESTING.md`, `.planning/codebase/CONVENTIONS.md`
- Current data model and migration constraints: `db/migrations/001_results_schema.sql`, `db/migrations/005_results_views_active_filters.sql`
- Public results shaping: `lib/server/history/types.ts`, `lib/server/history/service.ts`, `lib/server/history/repository.ts`, `app/components/event-participation-list.tsx`, `app/results/page.tsx`
- Admin event results flow: `lib/server/admin/types.ts`, `lib/server/admin/service.ts`, `lib/server/admin/repository.ts`, `app/admin/_components/events-manager.tsx`, `app/api/v1/admin/events/[id]/results/route.ts`
- Driver chart behavior: `app/components/visualizations.tsx`, `app/drivers/[slug]/page.tsx`
- Documentation baseline: `README.md`, `docs/future-features.md`

---
*Pitfalls research for: SINTA Website milestone on optional qualy support, shareable result image, chart correction, and documentation refresh*
*Researched: 2026-04-02*
