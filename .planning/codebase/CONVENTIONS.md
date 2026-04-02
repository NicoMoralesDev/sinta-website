# Coding Conventions

**Analysis Date:** 2026-04-02

## Naming Patterns

**Files:**
- Use Next.js reserved names for route entrypoints: `app/page.tsx`, `app/layout.tsx`, and `app/api/v1/results/overview/route.ts`.
- Use lowercase kebab-case for multiword component and helper files: `app/components/event-participation-list.tsx`, `app/admin/_components/live-broadcast-manager.tsx`, `lib/server/history/service.ts`.
- Use `_components` and `_lib.ts` to mark admin-only internal implementation details under `app/admin/`.
- Use `.spec.ts` suffixes for tests, with an additional behavior qualifier when useful: `tests/home-page.flow.spec.ts`, `tests/db.integration.spec.ts`.

**Functions:**
- Use PascalCase for React components: `Hero` in `app/components/hero.tsx`, `AdminLoginForm` in `app/admin/_components/admin-login-form.tsx`, `RootLayout` in `app/layout.tsx`.
- Use camelCase for helpers, validators, and service/repository functions: `readAppEnv` in `lib/server/env.ts`, `parseYouTubeVideoId` in `lib/server/admin/service.ts`, `getResultsOverview` in `lib/server/history/service.ts`.
- Use verb-first names for async operations and route-facing work: `getAdminPageContext` in `app/admin/_lib.ts`, `listUsers` in `lib/server/admin/service.ts`, `checkDbConnection` in `lib/server/db.ts`.

**Variables:**
- Use camelCase for local variables and state: `todayIso` in `app/page.tsx`, `mobileOpen` in `app/components/navbar.tsx`, `queryMock` in `tests/history-repository.spec.ts`.
- Use UPPER_SNAKE_CASE for module constants and regexes: `DEFAULT_LIMIT` in `lib/server/history/service.ts`, `ADMIN_CACHE_CONTROL` in `app/api/v1/admin/_utils.ts`, `EVENT_DATE_REGEX` in `app/admin/_components/events-live-suggestions.ts`.
- Use descriptive boolean names with `is`, `has`, `show`, or `allow`: `isProduction` in `lib/server/db.ts`, `showCalendarSection` in `app/page.tsx`, `allowMustChangePassword` in `app/api/v1/admin/_utils.ts`.

**Types:**
- Use PascalCase for all type aliases and domain models: `AdminUser` in `lib/server/admin/types.ts`, `CurrentChampionshipSummary` in `lib/server/history/types.ts`, `PageProps` in `app/page.tsx`.
- Use `Props` suffix for React prop shapes and `Row` suffix for database result types: `NavbarProps` in `app/components/navbar.tsx`, `DbEventRow` in `lib/server/history/repository.ts`, `AdminAuditRow` in `lib/server/admin/repository.ts`.

## Code Style

**Formatting:**
- Use Prettier from `.prettierrc.json`.
- Use `semi: true`, `singleQuote: false`, `trailingComma: "all"`, `printWidth: 100`, `tabWidth: 2`, and LF line endings.
- Follow `.editorconfig`: UTF-8, spaces, final newline, and trimmed trailing whitespace except in Markdown.
- Preserve multi-line object literals, JSX props, and long function calls instead of compressing dense logic onto one line. See `app/page.tsx` and `lib/server/history/service.ts`.

**Linting:**
- Use the flat ESLint config in `eslint.config.mjs`.
- Extend `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`.
- Respect the TypeScript strict-mode baseline from `tsconfig.json`; the repo uses `strict: true` and `noEmit: true`.
- Avoid suppression comments. No active `eslint-disable` or `@ts-ignore` usage was detected in `app/`, `lib/`, or `tests/`.

## Import Organization

**Order:**
1. External packages and framework imports first: `next`, `react`, `pg`, `vitest`, `react-dom/server`.
2. Blank line.
3. Internal imports from the same area or the `@/` alias.

**Path Aliases:**
- Use `@/*` from `tsconfig.json` for cross-directory imports rooted at the project root.
- Prefer direct module imports instead of barrel files. Examples: `@/lib/server/history/service` in `app/api/v1/results/overview/route.ts` and `@/app/components/hero` in `tests/hero-live-render.spec.ts`.
- When both relative and aliased internal imports exist, keep nearby relative imports together and use `@/` for cross-cutting modules. See `app/page.tsx`, `app/components/hero.tsx`, and `lib/server/db.ts`.

## Error Handling

**Patterns:**
- Encode domain failures with custom error classes instead of ad hoc string checks: `lib/server/history/errors.ts` and `lib/server/admin/errors.ts`.
- Centralize HTTP error mapping in route utilities: `handleApiError` in `app/api/v1/_utils.ts` and `handleAdminApiError` in `app/api/v1/admin/_utils.ts`.
- Validate inputs early and throw typed validation errors from service-layer helpers such as `parseInteger` in `lib/server/history/service.ts` and `validateUuid` in `lib/server/admin/service.ts`.
- Return `null` for expected "not found / unavailable" states in non-API code when the UI can degrade gracefully. Examples: `getAdminPageContext` in `app/admin/_lib.ts` and the home page data loaders in `app/page.tsx`.
- Catch broad failures only at boundaries. Route handlers in `app/api/v1/**/route.ts` wrap service calls in `try/catch`; lower layers mostly throw.

## Logging

**Framework:** None detected.

**Patterns:**
- No structured logging layer is present in `app/`, `lib/`, or `tests/`.
- `console.*` usage was not detected in the application code searched for this analysis.
- Error handling relies on exceptions and HTTP responses rather than logging side effects.

## Comments

**When to Comment:**
- Keep comments rare. The codebase prefers descriptive names and small helper functions over inline commentary.
- Use names and extracted helpers to explain intent, as in `hasUpcomingEventDate` in `app/page.tsx` and `normalizeEventStreamPatch` in `lib/server/admin/service.ts`.

**JSDoc/TSDoc:**
- Not used in the scanned application and test files.
- Prefer explicit TypeScript signatures over docblocks. Examples: `AdminPageContext` in `app/admin/_lib.ts` and `AppEnv` in `lib/server/env.ts`.

## Function Design

**Size:** Keep exported units focused and push repeated logic into local helpers.
- Validation and normalization helpers live at the top of service modules: `lib/server/history/service.ts` and `lib/server/admin/service.ts`.
- UI route entrypoints stay thin and delegate to helpers/services: `app/api/v1/results/overview/route.ts`, `app/api/health/db/route.ts`.

**Parameters:** Favor typed object inputs and `URLSearchParams` over long positional signatures.
- Route-facing services accept `URLSearchParams`: `getResultsOverview` and `getCurrentChampionship` in `lib/server/history/service.ts`.
- Repository and admin write functions accept typed input objects: `CreateDriverInput` in `lib/server/admin/types.ts`, `getEventResultsPage(query)` in `lib/server/history/repository.ts`.

**Return Values:** Prefer typed objects and explicit nullable returns.
- Use `Promise<T | null>` for missing records: `getDriverBySlug` in `lib/server/history/repository.ts`, `getCurrentChampionship` in `lib/server/history/service.ts`.
- Use structured success payloads for writes: `AdminWriteResult` in `lib/server/admin/types.ts`.
- Keep API responses consistent with `{ ok: true, ... }` or `{ ok: false, error }` via the route utilities in `app/api/v1/_utils.ts` and `app/api/v1/admin/_utils.ts`.

## Module Design

**Exports:** Prefer named exports for reusable functions, components, constants, and types.
- Components use named exports in shared modules: `app/components/about.tsx`, `app/components/team.tsx`, `app/admin/_components/users-manager.tsx`.
- Service, repository, env, and helper modules use named exports exclusively: `lib/server/env.ts`, `lib/server/history/service.ts`, `lib/server/admin/auth.ts`.
- Use default exports only where Next.js expects them: `app/page.tsx`, `app/results/page.tsx`, `app/drivers/[slug]/page.tsx`, `app/layout.tsx`.

**Barrel Files:** Not used.
- Import from concrete modules instead of `index.ts` barrels.
- Add new exports directly to the owning file unless a framework convention requires a specific filename.

## Practical Patterns

**Server page composition:**
- Fetch multiple resources in parallel with `Promise.all`, tolerate optional data with `.catch(() => null)`, then map results into presentation props. See `app/page.tsx`.

**Route handler shape:**
- Use the same boundary pattern across API files:

```typescript
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const data = await someService(url.searchParams);
    return jsonOk({ ok: true, data });
  } catch (error) {
    return handleApiError(error);
  }
}
```

- Follow the public route version in `app/api/v1/results/overview/route.ts` and the admin variant in `app/api/v1/admin/live-broadcast/route.ts`.

**Validation helper layout:**
- Group constants, regexes, and narrow helpers before exported functions. See `lib/server/history/service.ts`, `lib/server/admin/service.ts`, and `app/admin/_components/events-live-suggestions.ts`.

---

*Convention analysis: 2026-04-02*
