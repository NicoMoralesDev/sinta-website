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
      championships: [
        {
          id: "champ-1",
          seasonYear: 2026,
          slug: "tz-4000",
          name: "TZ 4000",
          organizerName: null,
        },
      ],
      drivers: [{ slug: "kevin-fontana", canonicalName: "Kevin Fontana" }],
    });
    getCurrentChampionshipMock.mockResolvedValueOnce({
      championship: {
        id: "champ-1",
        seasonYear: 2026,
        slug: "tz-4000",
        name: "TZ 4000",
        organizerName: null,
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

  it("renders canonical session order qs, s, qf, f, and p without inserting empty sparse historical columns", async () => {
    getFiltersMock.mockResolvedValueOnce({
      years: [2026],
      championships: [],
      drivers: [],
    });
    getCurrentChampionshipMock.mockResolvedValueOnce({
      championship: {
        id: "champ-1",
        seasonYear: 2026,
        slug: "tz-4000",
        name: "TZ 4000",
        organizerName: "SINTA",
      },
      events: [],
      leaderboard: [],
    });
    getResultsStatsMock.mockResolvedValueOnce([]);
    getResultsEventParticipationMock.mockResolvedValueOnce({
      items: [
        {
          eventId: "event-5",
          seasonYear: 2026,
          championshipSlug: "tz-4000",
          championshipName: "TZ 4000",
          roundNumber: 4,
          circuitName: "Interlagos",
          eventDate: null,
          participants: [
            {
              driverSlug: "kevin-fontana",
              driverName: "Kevin Fontana",
              sessions: [
                { sessionKind: "p", sessionLabel: "P", rawValue: "25", position: 25, status: null },
                { sessionKind: "f", sessionLabel: "F", rawValue: "1", position: 1, status: null },
                { sessionKind: "qf", sessionLabel: "QF", rawValue: "2", position: 2, status: null },
                { sessionKind: "s", sessionLabel: "S", rawValue: "3", position: 3, status: null },
                { sessionKind: "qs", sessionLabel: "QS", rawValue: "4", position: 4, status: null },
              ],
            },
          ],
        },
        {
          eventId: "event-6",
          seasonYear: 2026,
          championshipSlug: "tz-4000",
          championshipName: "TZ 4000",
          roundNumber: 3,
          circuitName: "Trelew",
          eventDate: null,
          participants: [
            {
              driverSlug: "b-driver",
              driverName: "B Driver",
              sessions: [
                { sessionKind: "f", sessionLabel: "F", rawValue: "2", position: 2, status: null },
              ],
            },
          ],
        },
      ],
      nextCursor: null,
    });

    const element = await ResultsPage({
      searchParams: {
        lang: "en",
      },
    });
    const html = renderToStaticMarkup(element);

    const qsIndex = html.indexOf(">QS<");
    const sIndex = html.indexOf(">S<");
    const qfIndex = html.indexOf(">QF<");
    const fIndex = html.indexOf(">F<");
    const pIndex = html.indexOf(">P<");
    const trelewIndex = html.indexOf("Trelew");
    const sparseSection = trelewIndex === -1 ? "" : html.slice(trelewIndex);

    expect(qsIndex).toBeGreaterThan(-1);
    expect(qsIndex).toBeLessThan(sIndex);
    expect(sIndex).toBeLessThan(qfIndex);
    expect(qfIndex).toBeLessThan(fIndex);
    expect(fIndex).toBeLessThan(pIndex);
    expect(sparseSection).toContain(">F<");
    expect(sparseSection).not.toContain(">QS<");
    expect(sparseSection).not.toContain(">QF<");
    expect(sparseSection).not.toContain(">P<");
  });

  it("renders organizer metadata for a selected championship in English and Spanish", async () => {
    getFiltersMock.mockResolvedValueOnce({
      years: [2026],
      championships: [
        {
          id: "champ-1",
          seasonYear: 2026,
          slug: "tz-4000",
          name: "TZ 4000",
          organizerName: "SINTA",
        },
      ],
      drivers: [],
    });
    getCurrentChampionshipMock.mockResolvedValueOnce({
      championship: {
        id: "champ-2",
        seasonYear: 2026,
        slug: "other-series",
        name: "Other Series",
        organizerName: null,
      },
      events: [],
      leaderboard: [],
    });
    getResultsStatsMock.mockResolvedValueOnce([]);
    getResultsEventParticipationMock.mockResolvedValueOnce({
      items: [],
      nextCursor: null,
    });

    const englishElement = await ResultsPage({
      searchParams: {
        lang: "en",
        championshipId: "champ-1",
      },
    });
    const englishHtml = renderToStaticMarkup(englishElement);

    expect(englishHtml).toContain("Organizer: SINTA");

    getFiltersMock.mockResolvedValueOnce({
      years: [2026],
      championships: [
        {
          id: "champ-1",
          seasonYear: 2026,
          slug: "tz-4000",
          name: "TZ 4000",
          organizerName: "SINTA",
        },
      ],
      drivers: [],
    });
    getCurrentChampionshipMock.mockResolvedValueOnce({
      championship: {
        id: "champ-1",
        seasonYear: 2026,
        slug: "tz-4000",
        name: "TZ 4000",
        organizerName: "SINTA",
      },
      events: [],
      leaderboard: [],
    });
    getResultsStatsMock.mockResolvedValueOnce([]);
    getResultsEventParticipationMock.mockResolvedValueOnce({
      items: [],
      nextCursor: null,
    });

    const spanishElement = await ResultsPage({
      searchParams: {
        championshipId: "champ-1",
      },
    });
    const spanishHtml = renderToStaticMarkup(spanishElement);

    expect(spanishHtml).toContain("Organizador: SINTA");
  });

  it("renders organizer metadata from the current championship when no filter is active", async () => {
    getFiltersMock.mockResolvedValueOnce({
      years: [2026],
      championships: [],
      drivers: [],
    });
    getCurrentChampionshipMock.mockResolvedValueOnce({
      championship: {
        id: "champ-1",
        seasonYear: 2026,
        slug: "tz-4000",
        name: "TZ 4000",
        organizerName: "SINTA",
      },
      events: [],
      leaderboard: [],
    });
    getResultsStatsMock.mockResolvedValueOnce([]);
    getResultsEventParticipationMock.mockResolvedValueOnce({
      items: [],
      nextCursor: null,
    });

    const element = await ResultsPage({
      searchParams: {
        lang: "en",
      },
    });
    const html = renderToStaticMarkup(element);

    expect(html).toContain("Current championship");
    expect(html).toContain("Organizer: SINTA");
  });

  it("omits organizer metadata when organizerName is null", async () => {
    getFiltersMock.mockResolvedValueOnce({
      years: [2026],
      championships: [
        {
          id: "champ-1",
          seasonYear: 2026,
          slug: "tz-4000",
          name: "TZ 4000",
          organizerName: null,
        },
      ],
      drivers: [],
    });
    getCurrentChampionshipMock.mockResolvedValueOnce({
      championship: {
        id: "champ-1",
        seasonYear: 2026,
        slug: "tz-4000",
        name: "TZ 4000",
        organizerName: null,
      },
      events: [],
      leaderboard: [],
    });
    getResultsStatsMock.mockResolvedValueOnce([]);
    getResultsEventParticipationMock.mockResolvedValueOnce({
      items: [],
      nextCursor: null,
    });

    const element = await ResultsPage({
      searchParams: {
        lang: "en",
        championshipId: "champ-1",
      },
    });
    const html = renderToStaticMarkup(element);

    expect(html).not.toContain("Organizer:");
    expect(html).not.toContain("Organizador:");
  });
});
