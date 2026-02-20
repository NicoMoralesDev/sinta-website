import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const {
  getFiltersMock,
  getCurrentChampionshipMock,
  getResultsStatsMock,
  getResultsEventParticipationMock,
} = vi.hoisted(() => ({
  getFiltersMock: vi.fn(),
  getCurrentChampionshipMock: vi.fn(),
  getResultsStatsMock: vi.fn(),
  getResultsEventParticipationMock: vi.fn(),
}));

vi.mock("@/lib/server/history/service", () => ({
  getFilters: getFiltersMock,
  getCurrentChampionship: getCurrentChampionshipMock,
  getResultsStats: getResultsStatsMock,
  getResultsEventParticipation: getResultsEventParticipationMock,
}));

import ResultsPage from "@/app/results/page";

describe("results page flow", () => {
  it("keeps URL filters and cursor in pagination link", async () => {
    getFiltersMock.mockResolvedValueOnce({
      years: [2026],
      championships: [{ id: "champ-1", seasonYear: 2026, slug: "tz-4000", name: "TZ 4000" }],
      drivers: [{ slug: "kevin-fontana", canonicalName: "Kevin Fontana" }],
    });
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
    getResultsStatsMock.mockResolvedValueOnce([]);
    getResultsEventParticipationMock.mockResolvedValueOnce({
      items: [
        {
          eventId: "event-1",
          seasonYear: 2026,
          championshipSlug: "tz-4000",
          championshipName: "TZ 4000",
          roundNumber: 3,
          circuitName: "Interlagos",
          eventDate: null,
          participants: [],
        },
      ],
      nextCursor: "cursor-2",
    });

    const element = await ResultsPage({
      searchParams: {
        lang: "en",
        year: "2026",
        championshipId: "champ-1",
        driver: "kevin-fontana",
        limit: "10",
      },
    });
    const html = renderToStaticMarkup(element);

    expect(html).toContain("Browse historical race results");
    expect(html).toContain(
      "/results?year=2026&amp;championshipId=champ-1&amp;driver=kevin-fontana&amp;limit=10&amp;cursor=cursor-2&amp;lang=en",
    );
  });

  it("renders language switch hrefs preserving results filters", async () => {
    getFiltersMock.mockResolvedValueOnce({
      years: [2026],
      championships: [],
      drivers: [],
    });
    getCurrentChampionshipMock.mockResolvedValueOnce(null);
    getResultsStatsMock.mockResolvedValueOnce([]);
    getResultsEventParticipationMock.mockResolvedValueOnce({
      items: [],
      nextCursor: null,
    });

    const element = await ResultsPage({
      searchParams: {
        lang: "en",
        year: "2026",
        championshipId: "champ-1",
        limit: "10",
      },
    });
    const html = renderToStaticMarkup(element);

    expect(html).toContain("/results?year=2026&amp;championshipId=champ-1&amp;limit=10");
    expect(html).toContain("/results?year=2026&amp;championshipId=champ-1&amp;limit=10&amp;lang=en");
  });
});
