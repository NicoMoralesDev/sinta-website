# Phase 4: Event Results Share Image - Research

**Researched:** 2026-04-02
**Domain:** Next.js 16 App Router image generation for a single public event results table
**Confidence:** HIGH

## User Constraints

- No phase-specific `*-CONTEXT.md` exists for Phase 4.

### Locked Decisions

- Scope is one generated image for one public event results table.
- The trigger must live in the public `/results` experience.
- The image must preserve the canonical event table semantics already shipped in Phase 3.
- The phase must address `SHARE-01` and `SHARE-02`.
- Research must validate Next.js `16.1.6` `next/og` / `ImageResponse` constraints before planning.

### Claude's Discretion

- Exact image dimensions and whether height should be fixed or computed from participant count.
- Whether the single-event lookup stays internal to the image route or also gets a public JSON-by-id route.
- Exact trigger wording (`Share image`, `Open image`, `Download image`) and whether it opens or downloads by default.

### Deferred Ideas (OUT OF SCOPE)

- Direct social platform integrations or native publish flows.
- Multiple branded share-image layouts or aspect ratios.
- Broad redesign of the `/results` page.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SHARE-01 | Visitor can generate a shareable image for a specific event results table from the public results experience | Add a per-event trigger in `EventParticipationList`, backed by a dedicated `GET /api/v1/results/events/[id]/image` route running on `nodejs` |
| SHARE-02 | Generated share image includes all drivers in the selected event table and preserves the canonical column order and points-based ranking shown to the visitor | Reuse the existing `EventParticipationCard` DTO, existing points-first participant ordering, and shared session-column/value helpers between `/results` and the image renderer |
</phase_requirements>

## Summary

The safest implementation is a narrow public image route that renders from the same event-participation DTO already used by `/results`, not from a second SQL path and not from browser screenshot tooling. The current public stack already gives you the right model boundary: `app/results/page.tsx` renders `EventParticipationList` from `getResultsEventParticipation(...)`, and `lib/server/history/repository.ts` already enforces canonical session ordering plus points-first participant ordering when it builds `EventParticipationCard`.

Next.js `ImageResponse` is the right rendering primitive for this phase, but it has real constraints. Official docs say it supports only flexbox plus a subset of CSS, has a `500KB` bundle limit, and supports only `ttf`, `otf`, and `woff` fonts. That means Phase 4 should not try to reuse Tailwind classes or the existing page JSX directly. Build a dedicated image JSX tree with inline styles, keep it simple, and reuse only the normalized event/session data plus a small shared presentation helper layer.

Because the feature is user-triggered sharing, prefer an explicit route handler over `opengraph-image.tsx`. Metadata image files are cached by default and are optimized for head metadata, while regular route handlers are not cached by default. For this repo, an explicit `nodejs` route with an explicit `Cache-Control` header is the lower-risk fit.

**Primary recommendation:** Use `app/api/v1/results/events/[id]/image/route.ts` on `nodejs`, fetch one active public `EventParticipationCard` by `eventId`, and render it with `ImageResponse` using shared column/value helpers so `/results` and the PNG cannot drift.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next` | `16.1.6` (repo-pinned) | App Router route handler + `next/og` image generation | Already in the repo; `ImageResponse` is built in, so Phase 4 does not need a new dependency |
| `react` / `react-dom` | `19.2.4` (repo-pinned) | JSX tree for the image renderer | Already used everywhere in the app |
| `next/og` `ImageResponse` | bundled with `next@16.1.6` | PNG generation from JSX | Official Next.js path for OG/social-style dynamic images |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Existing history service/repository | local code | One-event public results lookup | Always; do not bypass `lib/server/history/*` |
| `vitest` | `3.2.4` in lockfile | Route and page-flow coverage | Use for route handler selection/parity and `/results` trigger coverage |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Explicit image route | `opengraph-image.tsx` metadata file | Metadata files are cached by default and better suited to head metadata than user-triggered share/download flows |
| `ImageResponse` | Browser screenshot tooling (`html2canvas`, Playwright, Puppeteer) | Higher complexity, extra runtime/dependency surface, and unnecessary brownfield risk |
| Internal one-event service lookup | New public JSON `/api/v1/results/events/[id]` route | Useful later, but Phase 4 does not need to widen the public API surface if the image route can call the service directly |

**Installation:**

```bash
# No new packages recommended for Phase 4.
```

**Version verification:**

- Repo versions were detected from [package.json](/home/nico/projects/sinta-website/package.json) and [package-lock.json](/home/nico/projects/sinta-website/package-lock.json).
- Official Next.js docs available during research were on `16.2.2` and are the nearest compatible reference for repo-pinned `16.1.6`.
- No extra dependency is recommended, so there is no package-registry churn to plan around.

## Architecture Patterns

### Recommended Project Structure

```text
app/
├── api/v1/results/events/[id]/image/route.ts   # New PNG route
├── components/event-participation-list.tsx     # Existing public table; add share trigger
└── results/page.tsx                            # Thread share-copy/lang into the list
lib/server/history/
├── repository.ts                               # New active-only single-event fetch
├── service.ts                                  # New getResultsEventParticipationById()
└── share-image.tsx                             # New image-only JSX renderer
tests/
├── results-share-image-route.spec.ts           # New route test
└── results-page.flow.spec.ts                   # Extend existing flow coverage
```

### Pattern 1: Add A Narrow Event-By-Id Public Read

**What:** Introduce a single-event history read that returns one `EventParticipationCard` using the same active-only event/result/driver constraints already used by the paginated results flow.

**When to use:** The image route needs deterministic lookup by `eventId`; cursor-based page APIs are the wrong boundary for this.

**Example:**

```typescript
// Source: repo pattern in app/api/v1/results/events/route.ts + lib/server/history/service.ts
export async function getResultsEventParticipationById(eventId: string) {
  const event = await getEventParticipationById(eventId);
  if (!event) {
    throw new HistoryNotFoundError("event not found");
  }
  return event;
}
```

### Pattern 2: Share Presentation Helpers, Not JSX

**What:** Extract small pure helpers for session-column derivation and cell formatting from `EventParticipationList`, then consume them from both the existing page component and the image-only renderer.

**When to use:** When page parity matters but the render environments differ.

**Example:**

```typescript
// Source: current logic in app/components/event-participation-list.tsx
const columns = getSessionColumns(event);
const displayValue = formatSessionValue(session, lang);
```

### Pattern 3: Keep The Image Route Explicitly `nodejs`

**What:** Use `export const runtime = "nodejs"` in the new route, matching the rest of the repo's public API surface.

**When to use:** Always for this phase.

**Why:** The repo already uses `pg`-backed Node route handlers, and official Next.js docs show Node.js runtime as the default route-segment runtime and the simplest option when local assets are needed.

### Anti-Patterns to Avoid

- **Do not duplicate SQL for the image route:** fetch one event through the existing history layer.
- **Do not try to render Tailwind page markup in `ImageResponse`:** use inline styles and flexbox only.
- **Do not key the image off filter/cursor state:** use `eventId`.
- **Do not make metadata files the first implementation:** their default caching behavior is a bad fit for a user-triggered brownfield feature.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Share image generation | Browser screenshot pipeline | `next/og` `ImageResponse` | Already built into Next.js; lower dependency and runtime risk |
| Event table parity | A second ad hoc table model | `EventParticipationCard` + shared helpers | Existing DTO already encodes canonical sessions and points-first ordering |
| User-triggered sharing | Social SDK / publish integration | Same-origin PNG route opened from `/results` | Matches v1 scope and keeps auth/platform concerns out |
| Route caching | Static metadata image route by default | Explicit route handler + explicit cache header | Better control over freshness for DB-backed public results |

**Key insight:** The hard part is not PNG encoding. It is keeping the image semantically identical to the public event table while staying inside `ImageResponse`'s layout limits.

## Common Pitfalls

### Pitfall 1: Assuming the image renderer can reuse Tailwind/page markup

**What goes wrong:** The PNG route looks broken or incomplete because `display: grid`, Tailwind utility classes, animations, or CSS variables do not behave like the page.

**Why it happens:** `ImageResponse` uses `@vercel/og` + Satori/Resvg and supports only flexbox plus a CSS subset.

**How to avoid:** Build a dedicated image JSX tree with inline styles and fixed color tokens from [app/globals.css](/home/nico/projects/sinta-website/app/globals.css).

**Warning signs:** The route tries to import page markup verbatim, uses Tailwind class strings as the primary layout system, or relies on CSS grid.

### Pitfall 2: The image route returns a different row order than `/results`

**What goes wrong:** The page and image disagree on participant order or visible columns.

**Why it happens:** One side uses shared DTO ordering while the other re-sorts or derives columns differently.

**How to avoid:** Trust repository ordering for participants, and share column/value helpers between `EventParticipationList` and the image renderer.

**Warning signs:** New sorting code appears in the image route or image renderer.

### Pitfall 3: A fixed OG-style canvas cannot fit every driver

**What goes wrong:** Lower rows are clipped, unreadable, or omitted, violating `SHARE-02`.

**Why it happens:** The common `1200x630` OG size is landscape-first and not sized for long motorsport tables.

**How to avoid:** Use a mobile-friendly width and compute height from participant count, or choose a tall fixed aspect ratio that still fits the longest expected table.

**Warning signs:** The implementation hard-codes `1200x630` before checking the largest event table in the dataset.

### Pitfall 4: The image route becomes stale or unpredictable

**What goes wrong:** Shared URLs do not reflect current public data, or regeneration hammers the DB on repeated reads.

**Why it happens:** Route handlers are not cached by default, while metadata files are cached by default.

**How to avoid:** Keep a normal route handler, set explicit `Cache-Control`, and start with the same short public cache window already used in [app/api/v1/_utils.ts](/home/nico/projects/sinta-website/app/api/v1/_utils.ts).

**Warning signs:** No cache header is set, or the implementation silently switches to metadata-file generation.

### Pitfall 5: Typography/assets become a hidden blocker

**What goes wrong:** The route tries to match `next/font/google` typography exactly and stalls on asset plumbing.

**Why it happens:** The page uses Google fonts in [app/layout.tsx](/home/nico/projects/sinta-website/app/layout.tsx), but the repo currently has no local font assets checked in for `ImageResponse`.

**How to avoid:** Treat custom font parity as optional for Phase 4. Start with system fonts or add a small local font asset only if visual QA shows it is necessary.

**Warning signs:** The phase plan adds font-asset work before the data/route parity work is done.

## Code Examples

Verified patterns from official sources:

### Route Handler With `ImageResponse`

```typescript
// Source: https://nextjs.org/docs/app/api-reference/functions/image-response
import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export async function GET() {
  return new ImageResponse(<div style={{ display: "flex" }}>Share image</div>, {
    width: 1080,
    height: 1350,
    headers: {
      "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
    },
  });
}
```

### Node Runtime Local Asset Pattern

```typescript
// Source: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const logoData = await readFile(join(process.cwd(), "public", "some-asset.png"), "base64");
const logoSrc = `data:image/png;base64,${logoData}`;
```

### Shared DTO Reuse Pattern For Phase 4

```typescript
// Source: local repo patterns in lib/server/history/service.ts and app/components/event-participation-list.tsx
const event = await getResultsEventParticipationById(eventId);
const columns = getSessionColumns(event);

return new ImageResponse(
  <EventResultsShareImage event={event} columns={columns} lang={lang} />,
  { width, height, headers: cacheHeaders },
);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Browser screenshot or external social-card service | Built-in `next/og` `ImageResponse` in App Router | Current Next.js 16 docs | No new dependency or browser automation required |
| Metadata-file-first image generation | Explicit route handler for user-triggered sharing | Current Phase 4 scope | Better cache/freshness control for DB-backed public assets |
| Duplicate table rendering logic per surface | Shared DTO + small shared presentation helpers | Needed now for Phase 4 | Lowest drift risk between page and image |

**Deprecated/outdated:**

- Treating an OG/social image as if it can reuse normal page CSS directly: outdated for `ImageResponse`; Satori layout constraints are stricter.

## Open Questions

1. **Should the image height be fully dynamic or chosen from one tall fixed size?**
   - What we know: `SHARE-02` requires all drivers to fit, and the repo currently has no evidence that a landscape `1200x630` canvas is sufficient.
   - What's unclear: The maximum participant count for the largest real event in production.
   - Recommendation: Plan for computed height from participant count first; if the team wants stricter asset sizing later, validate against real max row counts.

2. **Should Phase 4 add a public JSON-by-id event route or keep the lookup internal?**
   - What we know: The image route needs by-id lookup, but the public API currently exposes only paginated `/api/v1/results/events`.
   - What's unclear: Whether another consumer needs single-event JSON immediately.
   - Recommendation: Keep the lookup internal to the service/repository unless planning uncovers another concrete consumer.

3. **How much branding should the first image include?**
   - What we know: Current public colors are defined in [app/globals.css](/home/nico/projects/sinta-website/app/globals.css), but there is no dedicated logo/font asset pipeline for image generation.
   - What's unclear: Whether exact font/logo parity matters for acceptance.
   - Recommendation: Keep branding to colors and clear headers in v1; do not let asset work block the share flow.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest `3.2.4` |
| Config file | [vitest.config.ts](/home/nico/projects/sinta-website/vitest.config.ts) |
| Quick run command | `npm run test -- tests/results-page.flow.spec.ts tests/results-share-image-route.spec.ts` |
| Full suite command | `npm run test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SHARE-01 | `/results` exposes a per-event share trigger that targets the image route for that event | flow | `npm run test -- tests/results-page.flow.spec.ts` | ✅ |
| SHARE-01 | `GET /api/v1/results/events/[id]/image` returns success for a valid public event and `404` for a missing event | route | `npm run test -- tests/results-share-image-route.spec.ts` | ❌ Wave 0 |
| SHARE-02 | Image route uses the same participant order and visible columns as the selected public event table | route/unit | `npm run test -- tests/results-share-image-route.spec.ts` | ❌ Wave 0 |
| SHARE-02 | Long event tables remain legible and include all drivers | manual visual | Manual QA in browser against at least one dense event and one sparse historical event | ❌ Manual only |

### Sampling Rate

- **Per task commit:** `npm run test -- tests/results-page.flow.spec.ts tests/results-share-image-route.spec.ts`
- **Per wave merge:** `npm run lint` and `npm run typecheck`
- **Phase gate:** Targeted phase suite green, plus manual visual QA for dense and sparse events. `npm run test` remains a known repo-level risk on clean checkout because `tests/history-parser.spec.ts` depends on a missing workbook fixture.

### Wave 0 Gaps

- [ ] `tests/results-share-image-route.spec.ts` — covers SHARE-01 and SHARE-02 route selection, cache headers, missing-event handling, and parity inputs
- [ ] Manual QA checklist for at least:
- [ ] one event with `QS/S/QF/F/P`
- [ ] one sparse historical event with only `F`
- [ ] one dense event with the largest participant count available

## Sources

### Primary (HIGH confidence)

- Local repo: [package.json](/home/nico/projects/sinta-website/package.json) - pinned runtime versions and scripts
- Local repo: [app/results/page.tsx](/home/nico/projects/sinta-website/app/results/page.tsx) - current `/results` flow and trigger insertion point
- Local repo: [app/components/event-participation-list.tsx](/home/nico/projects/sinta-website/app/components/event-participation-list.tsx) - current event table column/value rendering
- Local repo: [lib/server/history/service.ts](/home/nico/projects/sinta-website/lib/server/history/service.ts) - public DTO entry points
- Local repo: [lib/server/history/repository.ts](/home/nico/projects/sinta-website/lib/server/history/repository.ts) - participant ordering and session ordering rules
- Next.js `ImageResponse` docs - behavior, CSS/font limits, response headers: https://nextjs.org/docs/app/api-reference/functions/image-response
- Next.js `opengraph-image` docs - static optimization notes and Node.js local asset example: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image
- Next.js metadata files docs - metadata routes cached by default: https://nextjs.org/docs/app/api-reference/file-conventions/metadata
- Next.js route segment config docs - `runtime` defaults and options: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
- Next.js route handlers docs - GET route handlers are not cached by default: https://nextjs.org/docs/app/getting-started/route-handlers-and-middleware
- Satori official README - supported HTML/CSS subset and rendering limitations: https://github.com/vercel/satori

### Secondary (MEDIUM confidence)

- Existing planning research notes:
  - [SUMMARY.md](/home/nico/projects/sinta-website/.planning/research/SUMMARY.md)
  - [ARCHITECTURE.md](/home/nico/projects/sinta-website/.planning/research/ARCHITECTURE.md)
  - [PITFALLS.md](/home/nico/projects/sinta-website/.planning/research/PITFALLS.md)

### Tertiary (LOW confidence)

- None

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - repo-pinned versions are clear and the recommended image stack is built into Next.js
- Architecture: HIGH - the current `EventParticipationCard` flow gives a direct extension path with low surface area
- Pitfalls: HIGH - core rendering and caching constraints are documented officially; only the final image dimensions remain product-specific

**Research date:** 2026-04-02
**Valid until:** 2026-04-16
