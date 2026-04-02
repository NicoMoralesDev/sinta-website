# Stack Research

**Domain:** Brownfield motorsport results website and admin platform
**Researched:** 2026-04-02
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Next.js | 16.1.6 | App Router pages, route handlers, server rendering, and image generation routes | The app already uses a server-first Next.js structure, and Next 16 officially supports route handlers plus `ImageResponse` from `next/og`, which is the lowest-risk way to add a shareable results image without a separate rendering service. |
| React | 19.2.4 | UI composition for public pages, admin client islands, and server-rendered share-image JSX | The current component model already fits the milestone. `qualy` support and the chart fix are incremental component and type changes, not a reason to introduce a new UI layer. |
| TypeScript | 5.9.3 | Shared domain typing across pages, APIs, services, repositories, and tests | The main risk in this milestone is optional data compatibility. TypeScript is the right guardrail for widening session/result shapes while keeping historical events safe. |
| PostgreSQL via `pg` | `pg` ^8.16.3 | Persist event results and serve both public and admin read/write flows | The repository and service layers are already built around direct SQL. Adding optional `qualy` support is a schema-and-query extension, not a case for a new ORM or data store. |
| Tailwind CSS | 4.1.18 | Existing styling system for public results views, admin editing UI, and share-image visual parity | The public and admin UI already use Tailwind utilities. Small layout changes for an extra optional session column and share CTA can stay consistent without adding another styling layer. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `next/og` | Bundled with Next.js 16.1.6 | Generate the shareable event-results image on the server from JSX and CSS | Use for a dedicated read-only image route per event. Keep the layout flexbox-based and asset-light because Next.js documents `ImageResponse` as PNG output with limited CSS support and no CSS grid. |
| `react-dom` | 19.2.4 | JSX rendering support for the existing React/Next runtime | Use as-is. No direct changes should be needed beyond normal component rendering already handled by Next.js. |
| `lucide-react` | 0.554.0 | Small UI affordances such as a share/download icon in public results views | Use only for lightweight UI polish around the new share action. Do not let icon work expand into broader UI redesign. |
| SQL migrations in `db/migrations/` | Existing project pattern | Evolve the results schema for optional `qualy` storage | Use one focused migration to extend the current results model. Keep backward compatibility by making `qualy` optional and by preserving existing rows unchanged. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Vitest 3.2.4 | Regression coverage for session ordering, optional `qualy` rendering, and the chart-axis fix | Add focused tests around widened session kinds, public column visibility, and the image route response contract if the route is added. |
| ESLint 9.39.2 + `eslint-config-next` 16.1.6 | Keep route handlers, React components, and server modules aligned with the current code style | No config expansion is needed for this milestone. |
| TypeScript compiler (`tsc --noEmit`) | Verify that widened result/session types remain coherent across history and admin domains | This is the fastest way to catch incomplete `qualy` wiring in shared types and route payloads. |

## Installation

```bash
# Core
# No new core packages are recommended for this milestone.

# Supporting
# No new runtime packages are required. Use next/og from the existing next dependency.

# Dev dependencies
# No new dev dependencies are required.
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `next/og` image route inside the existing Next.js app | Browser-side DOM capture (`html2canvas`, `dom-to-image`) | Only if a later milestone explicitly needs client-only ad hoc sharing of user-customized UI state. That is not this milestone. |
| Extend the existing service + repository + SQL flow | Introduce Prisma or Drizzle now | Only if a future milestone is already budgeted to standardize all database access. For one optional result dimension, the migration cost is not justified. |
| Keep the custom SVG chart and correct the Y-axis mapping | Add Recharts, Chart.js, or another charting library | Only if the product expands into multiple interactive analytics charts. A single axis fix does not justify a new visualization dependency. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `html2canvas`, `dom-to-image`, or similar browser screenshot libraries | They depend on client rendering, are inconsistent across devices, and add avoidable runtime weight for a server-renderable table | A server-side `next/og` image route fed by the existing history service |
| Puppeteer/Playwright screenshot generation for this feature | It adds heavy operational cost, slower cold starts, and more failure modes than the requirement needs | `ImageResponse` from `next/og` inside the current Next.js app |
| Recharts, Chart.js, or any new charting package | The chart problem is a coordinate bug in an existing SVG sparkline, not a missing chart platform | Fix the SVG scale logic in `app/components/visualizations.tsx` so lower race positions render higher on the chart |
| Any social SDK, social auth, or native share integration | The requirement is limited to generating a shareable image, not publishing it or integrating with specific networks | A plain image URL or download/open action from the existing public results flow |
| Re-platforming the results model around a new generic schema or a separate microservice | The milestone is intentionally incremental and the current architecture already has clear extension points | Extend the current history/admin types, SQL, services, and route handlers in place |

## Stack Patterns by Variant

**If the event has `qualy` results:**
- Add `qualy` as an optional third session kind in shared domain types and database rows.
- Keep ordering explicit as `qualy -> primary -> secondary`.
- Prefer making admin result rows shape-driven (`cells` keyed by session kind, or equivalent) instead of adding more one-off booleans or duplicated branch logic.
- Because the public event participation UI already derives visible columns from present sessions, it can show `qualy` naturally once the data model exposes it.

**If the event does not have `qualy` results:**
- Omit `qualy` rows entirely from repository output and admin payloads when no data exists.
- Do not render an empty `qualy` column in public or admin views.
- Because backward compatibility matters more than uniformity for this milestone, historical events should continue behaving exactly like today's two-session events.

**If a shareable image is requested for a specific event:**
- Add one dedicated server route handler that fetches a single event result table through the existing history service and returns `image/png`.
- Keep the image view model separate from page JSX, but reuse the same normalized event/session data source so public page and share image cannot drift.
- Because Next.js metadata image files are cached by default, prefer an explicit image route for user-triggered sharing first, and only add route-segment metadata later if link-preview behavior becomes a separate requirement.

**If the admin result editor is touched:**
- Refactor the current fixed `primary`/`secondary` grid shape to one session-ordered collection before adding `qualy` UI.
- Keep validation in `lib/server/admin/service.ts` and keep route handlers thin.
- Because the admin grid is the least flexible part of the current result flow, this is the one place where a small internal reshaping pays off immediately.

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| `next@16.1.6` | `react@19.2.4`, `react-dom@19.2.4` | This is the repo's pinned runtime set and already supports the App Router and route-handler patterns used throughout the codebase. |
| `next@16.1.6` | `next/og` | Official Next.js docs for the current App Router document `ImageResponse` from `next/og` and dynamic metadata image routes in the same version line. |
| `tailwindcss@4.1.18` | `@tailwindcss/postcss@4.1.18` | Keep the matched Tailwind/PostCSS pair already in the repo. No styling-tool change is needed for this milestone. |
| `typescript@5.9.3` | Current Next.js route-handler typing style | Next.js docs for current route handlers and metadata image routes use promise-based `params`, which matches the repo's current TypeScript usage. |

## Sources

- `/home/nico/projects/sinta-website/package.json` - verified pinned runtime and tooling versions used by the repo
- `/home/nico/projects/sinta-website/.planning/PROJECT.md` - verified milestone scope, constraints, and out-of-scope boundaries
- `/home/nico/projects/sinta-website/.planning/codebase/STACK.md` - verified the current stack and deployment assumptions already in use
- `/home/nico/projects/sinta-website/.planning/codebase/ARCHITECTURE.md` - verified the existing service/repository architecture to extend instead of replace
- `/home/nico/projects/sinta-website/app/components/visualizations.tsx` - verified the chart is custom SVG and only needs a coordinate fix, not a charting dependency
- `/home/nico/projects/sinta-website/app/components/event-participation-list.tsx` - verified the public results UI already derives columns from present sessions, which fits optional `qualy`
- `/home/nico/projects/sinta-website/app/admin/_components/events-manager.tsx` - verified the admin results editor is currently the main fixed two-session constraint
- https://nextjs.org/docs/app/api-reference/functions/image-response - verified `ImageResponse` in current Next.js docs, including server-side JSX-to-PNG generation and CSS limitations
- https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image - verified current metadata-image conventions, `contentType`, promise-based `params`, and default caching behavior
- https://nextjs.org/docs/app/getting-started/route-handlers-and-middleware - verified current route-handler behavior, supported methods, and caching model

---
*Stack research for: Brownfield motorsport results website and admin platform*
*Researched: 2026-04-02*
