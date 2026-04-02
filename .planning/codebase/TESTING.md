# Testing Patterns

**Analysis Date:** 2026-04-02

## Test Framework

**Runner:**
- Vitest `^3.2.4`
- Config: `vitest.config.ts`

**Assertion Library:**
- Vitest built-in `expect`

**Run Commands:**
```bash
npm run test        # Run all specs matched by vitest.config.ts
npm run test:watch  # Run Vitest in watch mode
npm run test:db     # Run only tests/db.integration.spec.ts with RUN_DB_INTEGRATION_TESTS=1
```

## Test File Organization

**Location:**
- Store automated tests in the top-level `tests/` directory.
- Do not colocate specs under `app/` or `lib/`; `vitest.config.ts` includes only `tests/**/*.spec.ts`.

**Naming:**
- Use `<feature>.spec.ts` for focused unit coverage: `tests/env.spec.ts`, `tests/admin-auth.spec.ts`, `tests/events-live-suggestions.spec.ts`.
- Use `<feature>.flow.spec.ts` for server-page rendering and navigation behavior: `tests/home-page.flow.spec.ts`, `tests/results-page.flow.spec.ts`, `tests/driver-profile-page.flow.spec.ts`.
- Use `<feature>.integration.spec.ts` for environment-backed checks: `tests/db.integration.spec.ts`.

**Structure:**
```text
tests/
  *.spec.ts
  *.flow.spec.ts
  *.integration.spec.ts
```

## Test Structure

**Suite Organization:**
- Import explicit Vitest APIs because `globals` is disabled in `vitest.config.ts`.
- Keep one `describe()` block per module or flow.
- Use short, behavior-focused `it()` descriptions.

```typescript
import { describe, expect, it, vi } from "vitest";

describe("results events API route", () => {
  it("returns 200 with payload from service", async () => {
    // arrange
    // act
    // assert
  });
});
```

- Follow `tests/history-api.spec.ts`, `tests/history-service-v2.spec.ts`, and `tests/admin-event-stream-validation.spec.ts`.

**Patterns:**
- Use `beforeEach()` to reset mocks and shared state: `tests/history-repository.spec.ts`, `tests/home-page.flow.spec.ts`, `tests/admin-auth.spec.ts`.
- Use `afterEach()` or `afterAll()` for cleanup when timers or connections are involved: `tests/home-page.flow.spec.ts`, `tests/db.integration.spec.ts`.
- Keep assertions concrete and output-oriented. Most specs assert on response payloads, rendered HTML fragments, thrown error types, or SQL text.

## Mocking

**Framework:** Vitest `vi`

**Patterns:**
- Mock a dependency boundary before importing the subject under test. For page and route tests, define hoisted mocks first, then call `vi.mock()`, then import the page or route module.

```typescript
const { getResultsOverviewMock } = vi.hoisted(() => ({
  getResultsOverviewMock: vi.fn(),
}));

vi.mock("@/lib/server/history/service", () => ({
  getResultsOverview: getResultsOverviewMock,
}));

import { GET as getOverviewRoute } from "@/app/api/v1/results/overview/route";
```

- This pattern is used in `tests/history-api.spec.ts`, `tests/history-api-v2.spec.ts`, `tests/home-page.flow.spec.ts`, `tests/results-page.flow.spec.ts`, and `tests/driver-profile-page.flow.spec.ts`.
- For repository tests, mock the database adapter instead of the repository internals. `tests/history-repository.spec.ts` replaces `@/lib/server/db` with a fake `query` function and then inspects both results and generated SQL.

```typescript
const queryMock = vi.fn();

vi.mock("@/lib/server/db", () => ({
  getDbPool: () => ({ query: queryMock }),
}));
```

**What to Mock:**
- Mock `@/lib/server/history/service` when testing pages or API routes under `app/`.
- Mock `@/lib/server/db` when testing repository logic under `lib/server/history/repository.ts`.
- Mock time with `vi.useFakeTimers()` and `vi.setSystemTime()` when rendering date-sensitive UI. See `tests/home-page.flow.spec.ts`.

**What NOT to Mock:**
- Do not mock pure validation and parsing helpers. Test them directly in `tests/env.spec.ts`, `tests/events-live-suggestions.spec.ts`, `tests/admin-event-stream-validation.spec.ts`, and `tests/history-service-v2.spec.ts`.
- Do not mock rendering helpers when a server component can be rendered directly with `renderToStaticMarkup()`. See `tests/hero-live-render.spec.ts`.

## Fixtures and Factories

**Test Data:**
- Prefer inline object literals for compact, behavior-specific fixtures.
- Add small local factory helpers inside the spec when a domain object is reused multiple times, such as `createCurrentChampionship()` in `tests/home-page.flow.spec.ts`.

```typescript
function createCurrentChampionship(events: Array<{ roundNumber: number; circuitName: string; eventDate: string | null }>) {
  return {
    championship: { id: "champ-1", seasonYear: 2026, slug: "tz-4000", name: "TZ 4000" },
    events: events.map((event) => ({ ...event, eventId: `event-${event.roundNumber}`, participants: [] })),
    leaderboard: [],
  };
}
```

- Use explicit domain-shaped fixtures rather than generic builders in page-flow specs such as `tests/results-page.flow.spec.ts` and `tests/driver-profile-page.flow.spec.ts`.
- One test depends on an external workbook fixture at `data-source/Historia The New Project.xlsx`: `tests/history-parser.spec.ts`.

**Location:**
- There is no shared `tests/fixtures/` or `tests/factories/` directory.
- Keep fixtures local to the spec unless multiple files start sharing the same shape repeatedly.

## Coverage

**Requirements:** None enforced.
- No coverage thresholds or coverage script were detected in `package.json` or `vitest.config.ts`.

**View Coverage:**
```bash
Not configured
```

## Test Types

**Unit Tests:**
- Pure helpers and validation functions are tested directly with no mocks: `tests/env.spec.ts`, `tests/events-live-suggestions.spec.ts`, `tests/admin-event-stream-validation.spec.ts`, `tests/history-service-v2.spec.ts`, `tests/admin-auth.spec.ts`.
- Repository unit tests isolate SQL and row mapping by mocking the DB adapter: `tests/history-repository.spec.ts`.

**Integration Tests:**
- `tests/db.integration.spec.ts` performs a real DB health query through `checkDbConnection()` in `lib/server/db.ts`.
- The integration spec is opt-in. `scripts/run-db-test.mjs` sets `RUN_DB_INTEGRATION_TESTS=1`, and the spec uses `const maybeIt = runIntegrationTests ? it : it.skip`.

**E2E Tests:**
- Browser E2E tests are not used.
- Page flow tests render server components to static HTML instead of driving a browser: `tests/home-page.flow.spec.ts`, `tests/drivers-page.flow.spec.ts`, `tests/results-page.flow.spec.ts`, `tests/driver-profile-page.flow.spec.ts`.

## Common Patterns

**Async Testing:**
- Await route handlers, async services, and async pages directly.
- Use `.resolves` and `.rejects` for promise assertions when the result shape matters.

```typescript
await expect(verifyAdminPassword("super-secure-password", hash)).resolves.toBe(true);
await expect(getResultsOverview(new URLSearchParams("year=foo"))).rejects.toBeInstanceOf(
  HistoryValidationError,
);
```

- Follow `tests/admin-auth.spec.ts` and `tests/history-service-v2.spec.ts`.

**Error Testing:**
- Assert on custom error classes for validation logic.
- Assert on HTTP status and JSON payload for route error handling.

```typescript
expect(() => parseYouTubeVideoId("https://example.com/watch?v=x")).toThrow(AdminValidationError);

const response = await GET(new Request("http://localhost/api/v1/results/events?limit=-1"));
expect(response.status).toBe(400);
expect(await response.json()).toEqual({ ok: false, error: "invalid limit" });
```

- Follow `tests/admin-event-stream-validation.spec.ts` and `tests/history-api.spec.ts`.

**Server component rendering:**
- Render server components with `renderToStaticMarkup()` and assert on generated HTML fragments instead of DOM queries.
- Import the page or component after mocks are registered when the component pulls data on evaluation.
- See `tests/hero-live-render.spec.ts`, `tests/home-page.flow.spec.ts`, `tests/results-page.flow.spec.ts`, and `tests/driver-profile-page.flow.spec.ts`.

**Time-dependent behavior:**
- Use fake timers and a fixed system clock for date-sensitive UI and scheduling helpers.
- `tests/home-page.flow.spec.ts` and `tests/events-live-suggestions.spec.ts` are the reference patterns.

## Verification Notes

- `npm run lint` passed in this checkout.
- `npm run typecheck` passed in this checkout.
- `npm run test` failed because `tests/history-parser.spec.ts` expects `data-source/Historia The New Project.xlsx`, and that file is not present in this checkout.
- `npm run test:db` is environment-dependent and requires a valid `DATABASE_URL` plus the opt-in wrapper in `scripts/run-db-test.mjs`.

---

*Testing analysis: 2026-04-02*
