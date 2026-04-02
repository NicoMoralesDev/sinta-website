# Phase 5: Documentation Alignment - Research

**Researched:** 2026-04-02
**Domain:** Maintainer documentation for the current Next.js runtime, admin workflows, and results/share contracts
**Confidence:** HIGH

<user_constraints>
## User Constraints

- Goal: Maintainers can rely on the project documentation for the current runtime behavior and this milestone's changes.
- Depends on: Phase 4.
- Requirements in scope: `DOC-01`, `DOC-02`.
- Must cover:
  - current runtime setup
  - real admin and public results workflows
  - the `QS` / `S` / `QF` / `F` / `P` results model
  - points-based ordering
  - organizer metadata
  - the share-image flow
  - known verification limits for this milestone
- Additional repo constraint: touched documentation must be written in English (`AGENTS.md`).
- Out of scope:
  - repo-wide documentation rewrite
  - future sharing/backfill features already deferred in `.planning/REQUIREMENTS.md`
  - code behavior changes unless a documentation bug exposes a blocking ambiguity
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DOC-01 | Maintainer can read project documentation that reflects the current runtime setup and admin/results workflows | README must become the authoritative runtime/setup index, and workflow docs must match the actual admin dry-run behavior, five-column results grid, public results page, and share-image route. |
| DOC-02 | Maintainer can find documentation for the `QS`/`S`/`QF`/`F`/`P` results model, points-based ordering, organizer metadata, share-image flow, and verification limits | Add one focused results-contract doc, link it from README, and document verification limits from real command output instead of assumptions. |
</phase_requirements>

## Summary

Phase 5 should be a targeted maintainer-doc pass, not a repo-wide rewrite. The implemented runtime and workflows are already clear in code and tests: the app runs on Node `22.x`, Next.js `16.1.6`, App Router pages revalidate every 120 seconds, public APIs and the share-image route return `Cache-Control: public, s-maxage=120, stale-while-revalidate=600`, and admin APIs are `no-store`. The canonical results contract is now `qs/s/qf/f/p`, public ordering is points-first with a legacy fallback to final-race position, championships carry optional `organizerName`, and the share-image flow is a server-side `next/og` route keyed by `eventId` with an optional `driver` slug.

The current documentation drifts from that reality in a few concrete places. `README.md` still omits migration `009_canonical_results_contract.sql`, does not explain the canonical results model or the share-image route, and mixes Spanish with English despite repo policy. `docs/admin-dashboard.md` documents admin auth and dry-run behavior, but not the canonical five-column results grid or organizer metadata in the championship workflow. `docs/data-import.md` documents the workbook path but not that the parser test depends on a local workbook fixture that is not present on a fresh checkout. The best plan is to keep README short and authoritative, then push detail into focused docs under `docs/`.

One more constraint matters for planning: documentation must be derived from code and tests, not from stale UI copy. The admin championships UI still contains copy that says the current model supports two sessions, but the real contract is five canonical fields with championship-specific display labels for `s` and `f`. The documentation pass should explain that distinction instead of repeating the stale wording.

**Primary recommendation:** Use `README.md` as the authoritative runtime/setup index, add `docs/results-model.md` for the milestone-specific results/share contract, and update `docs/admin-dashboard.md` plus `docs/data-import.md` so every changed Phase 1-4 behavior has one documented source of truth.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js | `22.x` | App runtime and scripts | Enforced in `package.json` and already assumed by the repo. |
| Next.js | `16.1.6` | App Router pages, route handlers, `next/og` image generation | Existing runtime; all DB-backed routes explicitly use `runtime = "nodejs"`. |
| React | `19.2.4` | UI rendering | Locked by the current Next.js stack. |
| TypeScript | `5.9.3` | Typed app and server contracts | Canonical source for the results/admin contracts. |
| pg | `8.16.3` | Postgres/Supabase access | Existing DB pool and health/integration flow depend on it. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vitest | `3.2.4` | Behavior and contract verification | Use as the evidence base behind docs claims. |
| ESLint | `9.39.2` | Static checks | Run after any doc-related code reference cleanup. |
| Tailwind CSS | `4.1.18` | Admin/public UI styling | Relevant only when docs point maintainers to UI implementation files. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `README.md` + `docs/*.md` | dedicated docs site or MDX pipeline | Overkill for a maintainer-only phase and creates a new drift surface. |
| one focused results-contract doc | putting every detail into README | Makes onboarding noisy and harder to keep current. |
| behavior-backed docs from types/tests | screenshots or prose copied from UI labels | Screenshots drift faster, and current UI copy still contains stale wording. |

**Installation:**
```bash
npm install
```

**Version verification:** Exact versions came from `package.json` on 2026-04-02. Official platform behavior was cross-checked against the current Next.js Route Handlers / OG image docs and Vitest config docs. Next.js publishes docs for `16.2.2` today, so those pages are the closest official reference for this repo's `16.1.6` patch release.

## Architecture Patterns

### Recommended Documentation Structure
```text
README.md                 # English maintainer entrypoint: runtime, env, cache model, workflow links
docs/admin-dashboard.md   # Admin auth, dry-run, championships/events/results workflow
docs/results-model.md     # New: canonical results contract, ordering, organizer, share-image, verification limits
docs/data-import.md       # Workbook/import prerequisites and parser-test caveat
```

### Pattern 1: Entry-point README, detail docs below it
**What:** Keep README short and authoritative for setup, runtime, caching, and where to go next. Put milestone-specific detail in focused docs and link them.
**When to use:** Any topic with more than one workflow step or more than one prerequisite.
**Example:**
```md
## Runtime
- Node.js 22.x
- npm
- Next.js App Router on Node runtime handlers
- Public pages and APIs use 120-second revalidation or cache headers
- Admin APIs are no-store

## Workflow Docs
- [Admin dashboard](docs/admin-dashboard.md)
- [Results model and sharing](docs/results-model.md)
- [Data import](docs/data-import.md)
```
**Source:** local repo structure and current docs surface.

### Pattern 2: Document contracts from shared types and tests, not from UI copy
**What:** Treat `lib/server/history/types.ts`, shared helpers, service validation, and Vitest assertions as the documentation source of truth.
**When to use:** Results fields, ordering rules, share-image behavior, organizer metadata, and verification caveats.
**Example:**
```ts
export const CANONICAL_RESULT_FIELDS = ["qs", "s", "qf", "f", "p"] as const;
```
**Source:** `lib/server/history/types.ts`

### Pattern 3: Separate storage contract from display labels
**What:** Docs must distinguish canonical stored session kinds (`qs/s/qf/f/p`) from human labels (`Qualy Sprint`, championship-specific sprint/final labels, localized organizer copy).
**When to use:** Admin results grid and public results documentation.
**Example:**
```ts
fieldOrder: ["qs", "s", "qf", "f", "p"],
fieldLabels: {
  qs: "Qualy Sprint",
  s: championship?.primarySessionLabel ?? "Sprint",
  qf: "Qualy Final",
  f: championship?.secondarySessionLabel ?? "Final",
  p: "Puntos",
}
```
**Source:** `lib/server/admin/repository.ts`

### Anti-Patterns to Avoid
- **Repo-wide translation sweep:** Phase 5 should fix touched maintainer docs, not launch a full documentation rewrite.
- **Duplicated behavior tables:** If the same contract appears in README and a deep doc, keep only the summary in README and link out.
- **UI-copy-as-truth:** Current admin copy still mentions a two-session model; documentation should not repeat that.
- **Undocumented cache behavior:** Public results/share output is cached; admin output is `no-store`. Omitting that creates debugging confusion.
- **Claiming full-suite green on fresh checkout:** `npm run test` currently fails without the workbook fixture; docs must say so.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Runtime/setup docs | new docs framework, generated site, or external wiki | `README.md` + existing `docs/*.md` | Lowest drift surface and no new tooling. |
| Results contract narrative | custom terminology or screenshots | repo types/tests (`CANONICAL_RESULT_FIELDS`, admin grid contract, share-image tests) | Exact behavior already lives there. |
| Share-image explanation | client-side "export table" description | server-side `next/og` route docs with route/query examples | The current flow is request-driven, cached, and filter-aware. |
| Verification status | hand-wavy "tests pass" statements | explicit command table with prerequisites and limits | This repo has real preconditions and one fresh-checkout failure mode. |

**Key insight:** This phase is mostly about choosing one canonical place for each maintainer question and making every statement traceable to code or executed verification.

## Common Pitfalls

### Pitfall 1: README drift against the schema and routes
**What goes wrong:** Maintainers follow README and miss `009_canonical_results_contract.sql` and the share-image workflow.
**Why it happens:** README still reflects pre-Phase-1/4 state.
**How to avoid:** Update README to list all migrations through `009`, document the image route/workflow, and link to a dedicated results-model doc.
**Warning signs:** Migration list stops at `008`; no mention of `/api/v1/results/events/:id/image`; no mention of `QS/QF/P`.

### Pitfall 2: Treating Sprint/Final as the stored model
**What goes wrong:** Docs imply only two result columns exist, which is false after Phase 1/2.
**Why it happens:** Championship labels still customize `s` and `f`, and some UI copy still says "two sessions."
**How to avoid:** State clearly that storage and APIs use `qs/s/qf/f/p`; only `s` and `f` display labels are championship-configurable.
**Warning signs:** Any doc that says "events support two sessions" without qualifying that it only refers to display labels.

### Pitfall 3: Describing ordering by race finish only
**What goes wrong:** Maintainers expect participant order to follow `F`, but public results and share images rank by `P` first when points exist.
**Why it happens:** Legacy events without points still fall back to final-race order, so both behaviors exist.
**How to avoid:** Document the exact rule: points first; if points are missing, fallback to final-race position, then driver name.
**Warning signs:** Docs use phrases like "ordered by final position" without discussing points or fallback behavior.

### Pitfall 4: Hiding verification prerequisites
**What goes wrong:** Maintainers run `npm run test` on a fresh checkout and get a red build; they assume recent changes broke the app.
**Why it happens:** `tests/history-parser.spec.ts` expects `data-source/Historia The New Project.xlsx`, which is not in the repo, and DB integration needs a live `.env` plus network.
**How to avoid:** Add a "Known verification limits" section with exact commands and prerequisites.
**Warning signs:** No mention of the workbook fixture, `RUN_DB_INTEGRATION_TESTS`, or live DB access.

### Pitfall 5: Omitting cache semantics from workflow docs
**What goes wrong:** Maintainers change admin data and think public results/share output failed because updates are not instant.
**Why it happens:** Public pages use `revalidate = 120` and public APIs/images return `public, s-maxage=120, stale-while-revalidate=600`, while admin APIs are `no-store`.
**How to avoid:** Call out cache behavior in runtime or troubleshooting docs.
**Warning signs:** Docs mention admin writes but not public cache or revalidation windows.

## Code Examples

Verified patterns from project source:

### Canonical results contract
```ts
export const CANONICAL_RESULT_FIELDS = ["qs", "s", "qf", "f", "p"] as const;
```
**Source:** `lib/server/history/types.ts`

### Results share-image link contract
```ts
function buildResultsShareImageHref(
  eventId: string,
  lang: "es" | "en",
  driver?: string,
): string {
  const path = `/api/v1/results/events/${eventId}/image`;
  const params = new URLSearchParams();

  if (driver) {
    params.set("driver", driver);
  }

  if (lang === "en") {
    params.set("lang", "en");
  }

  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
```
**Source:** `app/results/page.tsx`

### Admin results save semantics
```ts
if (isClearResultCell(row)) {
  merged.delete(key);
  continue;
}
merged.set(key, row);
```
**Source:** `lib/server/admin/service.ts`

Use this in docs as: partial admin saves preserve untouched cells, and explicit clears remove one canonical cell without wiping unrelated rows.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `primary` / `secondary` session model | canonical `qs` / `s` / `qf` / `f` / `p` contract | Phase 1, migration `009_canonical_results_contract.sql` on 2026-04-02 | Docs must separate storage contract from display labels. |
| Public ordering by final result | points-first ordering with legacy fallback | Phase 1 on 2026-04-02 | Docs must explain why some events still sort by final result. |
| No organizer metadata in maintainer docs | optional `organizerName` on championships and public/current filters | Phases 1 and 3 on 2026-04-02 | Docs need both admin-entry and public-display behavior. |
| Unfiltered share-image assumption | optional driver-aware share-image route | Phase 4 on 2026-04-02 | Docs should show exact route and query examples. |
| "Test suite should just pass" assumption | parser test requires local workbook; DB integration requires live `.env` and network; image visuals still need manual QA | observed 2026-04-02 | Docs need a known verification limits section. |

**Deprecated/outdated:**
- README migration list ending at `008_live_broadcast_config.sql`: outdated; the actual schema now includes `009_canonical_results_contract.sql`.
- Any documentation or copy that says the event results model only has Sprint and Final: outdated; that only describes configurable labels for `s` and `f`.

## Open Questions

1. **Should Phase 5 add one new doc or fold everything into README plus existing docs?**
   - What we know: README is already overloaded and drifting; `docs/admin-dashboard.md` and `docs/data-import.md` already exist.
   - What's unclear: whether maintainers prefer one more focused doc file.
   - Recommendation: add exactly one new `docs/results-model.md` and keep README as an index.

2. **Should the phase change stale in-product admin copy that still says "two sessions"?**
   - What we know: the user asked for documentation alignment, not UI copy changes.
   - What's unclear: whether product-facing copy drift is considered documentation for this milestone.
   - Recommendation: do not expand scope unless that copy is blocking; document the canonical model correctly and note the UI-copy mismatch if it remains.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest `3.2.4` |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run tests/admin-events-manager.flow.spec.ts tests/admin-championships-manager.flow.spec.ts tests/results-page.flow.spec.ts tests/history-share-image-route.spec.ts tests/championship-organizer.spec.ts tests/history-repository.spec.ts` |
| Full suite command | `npm run test && npm run typecheck && npm run lint` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DOC-01 | Documentation matches the current runtime setup and admin/results workflows | smoke + manual doc review | `npm run typecheck && npm run lint && npx vitest run tests/admin-events-manager.flow.spec.ts tests/admin-championships-manager.flow.spec.ts tests/results-page.flow.spec.ts tests/history-share-image-route.spec.ts` | ❌ Wave 0 |
| DOC-02 | Documentation covers canonical results model, ordering, organizer metadata, share-image flow, and verification limits | contract + manual doc review | `npx vitest run tests/admin-events-manager.flow.spec.ts tests/results-page.flow.spec.ts tests/history-share-image-route.spec.ts tests/championship-organizer.spec.ts tests/history-repository.spec.ts tests/history-parser.spec.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run lint` plus the smallest relevant Vitest subset for the doc section being updated.
- **Per wave merge:** `npx vitest run tests/admin-events-manager.flow.spec.ts tests/admin-championships-manager.flow.spec.ts tests/results-page.flow.spec.ts tests/history-share-image-route.spec.ts tests/championship-organizer.spec.ts tests/history-repository.spec.ts && npm run typecheck && npm run lint`
- **Phase gate:** Run the full suite, but treat the workbook-fixture failure as a documented pre-existing limit unless the fixture is added.

### Wave 0 Gaps
- [ ] `docs/results-model.md` — new maintainer reference for the canonical results contract and share-image flow
- [ ] `README.md` runtime/workflow index refresh — migrations, route inventory, cache semantics, and doc links
- [ ] `docs/admin-dashboard.md` update — organizer metadata, five-column results grid, partial-save semantics, dry-run note
- [ ] `docs/data-import.md` update — workbook path prerequisite and parser-test limitation
- [ ] No docs-lint or link-check command exists; verification is behavior-backed plus manual review

Observed verification state on 2026-04-02:
- `npm run test`: fails only in `tests/history-parser.spec.ts` because `/data-source/Historia The New Project.xlsx` is absent on a fresh checkout.
- `npm run test:db`: passes with configured `.env`, network access, and `RUN_DB_INTEGRATION_TESTS=1`.
- `npm run typecheck`: passes.
- `npm run lint`: passes.

## Sources

### Primary (HIGH confidence)
- Local repo: `package.json`, `README.md`, `docs/admin-dashboard.md`, `docs/data-import.md`
- Local repo: `lib/server/history/types.ts`, `app/results/page.tsx`, `app/api/v1/results/events/[id]/image/route.ts`, `lib/server/admin/service.ts`, `lib/server/admin/repository.ts`
- Local repo tests: `tests/admin-events-manager.flow.spec.ts`, `tests/admin-championships-manager.flow.spec.ts`, `tests/results-page.flow.spec.ts`, `tests/history-share-image-route.spec.ts`, `tests/history-repository.spec.ts`, `tests/history-parser.spec.ts`, `tests/db.integration.spec.ts`
- Next.js Route Handlers docs: https://nextjs.org/docs/app/api-reference/file-conventions/route
- Next.js Metadata / OG image docs: https://nextjs.org/docs/app/getting-started/metadata-and-og-images
- Vitest docs: https://vitest.dev and https://v2.vitest.dev/config/

### Secondary (MEDIUM confidence)
- `.planning/REQUIREMENTS.md`, `.planning/STATE.md`
- `.planning/phases/04-event-results-share-image/04-VERIFICATION.md`
- `.planning/phases/04-event-results-share-image/04-03-SUMMARY.md`

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - exact versions come from `package.json`; platform behavior was cross-checked with official docs.
- Architecture: HIGH - the recommended doc structure follows the existing repo layout and directly observed drift points.
- Pitfalls: HIGH - based on executed commands and current docs/code mismatch, not guesswork.

**Research date:** 2026-04-02
**Valid until:** 2026-05-02
