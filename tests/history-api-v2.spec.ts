import { describe, expect, it, vi } from "vitest";

const { getResultsOverviewMock, getCurrentChampionshipMock } = vi.hoisted(() => ({
  getResultsOverviewMock: vi.fn(),
  getCurrentChampionshipMock: vi.fn(),
}));

vi.mock("@/lib/server/history/service", () => ({
  getResultsOverview: getResultsOverviewMock,
  getCurrentChampionship: getCurrentChampionshipMock,
}));

import { HistoryValidationError } from "@/lib/server/history/errors";
import { GET as getOverviewRoute } from "@/app/api/v1/results/overview/route";
import { GET as getCurrentRoute } from "@/app/api/v1/results/current/route";

describe("results v2 API routes", () => {
  it("returns overview payload", async () => {
    getResultsOverviewMock.mockResolvedValueOnce({
      racesCompleted: 200,
      podiums: 80,
      wins: 30,
      activeDrivers: 10,
    });

    const response = await getOverviewRoute(
      new Request("http://localhost/api/v1/results/overview?year=2026"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      overview: {
        racesCompleted: 200,
        podiums: 80,
        wins: 30,
        activeDrivers: 10,
      },
    });
  });

  it("returns current championship payload", async () => {
    getCurrentChampionshipMock.mockResolvedValueOnce({
      championship: {
        id: "champ-1",
        seasonYear: 2026,
        slug: "tz-4000",
        name: "TZ 4000",
      },
      events: [],
      leaderboard: [],
    });

    const response = await getCurrentRoute(new Request("http://localhost/api/v1/results/current"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      current: {
        championship: {
          id: "champ-1",
          seasonYear: 2026,
          slug: "tz-4000",
          name: "TZ 4000",
        },
        events: [],
        leaderboard: [],
      },
    });
  });

  it("returns 400 for overview validation errors", async () => {
    getResultsOverviewMock.mockRejectedValueOnce(new HistoryValidationError("year must be a number"));

    const response = await getOverviewRoute(
      new Request("http://localhost/api/v1/results/overview?year=foo"),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: "year must be a number",
    });
  });
});
