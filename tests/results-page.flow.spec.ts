import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { EventParticipationCard } from "@/lib/server/history/types";

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
import { EventParticipationList } from "@/app/components/event-participation-list";
import {
  formatEventParticipationDate,
  formatEventParticipationRoundLabel,
  formatEventParticipationSeasonLabel,
  formatEventParticipationSessionValue,
  getEventParticipationSessionColumns,
  getEventParticipationSessionPresentation,
} from "@/app/components/event-participation-helpers";

describe("results page flow", () => {
  it("uses shared event participation helpers for canonical columns and labels", () => {
    const event: EventParticipationCard = {
      eventId: "event-helpers",
      seasonYear: 2026,
      championshipSlug: "tz-4000",
      championshipName: "TZ 4000",
      roundNumber: 6,
      circuitName: "Interlagos",
      eventDate: "2026-03-11T00:00:00.000Z",
      participants: [
        {
          driverSlug: "driver-1",
          driverName: "Driver One",
          sessions: [
            { sessionKind: "f", sessionLabel: "F", rawValue: "1", position: 1, status: null },
            { sessionKind: "p", sessionLabel: "P", rawValue: "25", position: 25, status: null },
            { sessionKind: "qf", sessionLabel: "QF", rawValue: "2", position: 2, status: null },
            { sessionKind: "s", sessionLabel: "S", rawValue: "3", position: 3, status: null },
            { sessionKind: "qs", sessionLabel: "QS", rawValue: "4", position: 4, status: null },
          ],
        },
      ],
    };

    expect(getEventParticipationSessionColumns(event).map((column) => column.sessionLabel)).toEqual([
      "QS",
      "S",
      "QF",
      "F",
      "P",
    ]);
    expect(getEventParticipationSessionPresentation(getEventParticipationSessionColumns(event)[4]!, "en")).toEqual({
      compactLabel: "PTS",
      fullLabelLines: ["Points"],
      accessibilityLabel: "Points",
    });
    expect(
      formatEventParticipationSessionValue(
        { sessionKind: "f", sessionLabel: "F", rawValue: "DNF", position: null, status: "DNF" },
        "en",
      ),
    ).toBe("DNF");
    expect(
      formatEventParticipationSessionValue(
        { sessionKind: "p", sessionLabel: "P", rawValue: "25", position: 25, status: null },
        "en",
      ),
    ).toBe("25");
    expect(formatEventParticipationSeasonLabel(event, "en")).toBe("Season 2026 - TZ 4000");
    expect(formatEventParticipationRoundLabel(event)).toBe("R6 - Interlagos");
    expect(formatEventParticipationDate(event, "en")).toBeTruthy();
  });

  it("renders optional event header actions beside the shared event date", () => {
    const html = renderToStaticMarkup(
      createElement(EventParticipationList, {
        lang: "en",
        emptyMessage: "No events",
        linkDrivers: false,
        events: [
          {
            eventId: "event-actions",
            seasonYear: 2026,
            championshipSlug: "tz-4000",
            championshipName: "TZ 4000",
            roundNumber: 2,
            circuitName: "Trelew",
            eventDate: "2026-02-01T00:00:00.000Z",
            participants: [],
          },
        ],
        renderEventActions: (event) =>
          createElement("a", { href: `/share/${event.eventId}` }, "Share image"),
      }),
    );

    expect(html).toContain("Share image");
    expect(html).toContain("/share/event-actions");
  });

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

  it("renders share image links for results events using the canonical event id", async () => {
    getFiltersMock.mockResolvedValueOnce({
      years: [2026],
      championships: [],
      drivers: [],
    });
    getCurrentChampionshipMock.mockResolvedValueOnce(null);
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
        {
          eventId: "event-2",
          seasonYear: 2026,
          championshipSlug: "tz-4000",
          championshipName: "TZ 4000",
          roundNumber: 4,
          circuitName: "Trelew",
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
        limit: "10",
      },
    });
    const html = renderToStaticMarkup(element);

    expect(html).toContain("Share image");
    expect(html).toContain("/api/v1/results/events/event-1/image?lang=en");
    expect(html).toContain("/api/v1/results/events/event-2/image?lang=en");
    expect(html).toContain("/results?year=2026&amp;limit=10&amp;cursor=cursor-2&amp;lang=en");
  });

  it("preserves the active driver filter in english share image links", async () => {
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
    getCurrentChampionshipMock.mockResolvedValueOnce(null);
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

    expect(html).toContain("/api/v1/results/events/event-1/image?driver=kevin-fontana&amp;lang=en");
    expect(html).toContain(
      "/results?year=2026&amp;championshipId=champ-1&amp;driver=kevin-fontana&amp;limit=10&amp;cursor=cursor-2&amp;lang=en",
    );
  });

  it("renders spanish share image links without deriving the route from active filters", async () => {
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
    getCurrentChampionshipMock.mockResolvedValueOnce(null);
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
      nextCursor: null,
    });

    const element = await ResultsPage({
      searchParams: {
        championshipId: "champ-1",
        year: "2026",
      },
    });
    const html = renderToStaticMarkup(element);

    expect(html).toContain("Imagen para compartir");
    expect(html).toContain("/api/v1/results/events/event-1/image");
    expect(html).not.toContain("/api/v1/results/events/tz-4000/image");
    expect(html).not.toContain("/api/v1/results/events/3/image");
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
    const pIndex = html.indexOf(">PTS<");
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
    expect(sparseSection).not.toContain(">PTS<");
  });

  it("renders full desktop labels, compact points labels, and total points in both sidebar summaries", async () => {
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
      leaderboard: [
        {
          driverSlug: "current-driver",
          driverName: "Current Driver",
          wins: 1,
          podiums: 2,
          top10: 3,
          totalPoints: 64,
          completed: 3,
          avgPosition: 4.5,
        },
      ],
    });
    getResultsStatsMock.mockResolvedValueOnce([
      {
        driverSlug: "rank-driver",
        canonicalName: "Rank Driver",
        wins: 3,
        podiums: 5,
        top5: 6,
        top10: 8,
        totalPoints: 88,
        completed: 8,
        dnf: 0,
        dnq: 0,
        dsq: 0,
        absent: 0,
      },
    ]);
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
                { sessionKind: "qs", sessionLabel: "QS", rawValue: "4", position: 4, status: null },
                { sessionKind: "s", sessionLabel: "S", rawValue: "3", position: 3, status: null },
                { sessionKind: "qf", sessionLabel: "QF", rawValue: "2", position: 2, status: null },
                { sessionKind: "f", sessionLabel: "F", rawValue: "1", position: 1, status: null },
                { sessionKind: "p", sessionLabel: "P", rawValue: "25", position: 25, status: null },
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

    expect(html).toContain("Qualy");
    expect(html).toContain("Sprint");
    expect(html).toContain("Points");
    expect(html).toContain(">PTS<");
    expect(html).toContain(">25<");
    expect(html).not.toContain(">P25<");
    expect(html).toContain("Podiums");
    expect(html).toContain("Rank Driver");
    expect(html).toContain("Current Driver");
    expect(html).toContain(">88<");
    expect(html).toContain(">64<");
  });

  it("preserves service participant order in rendered markup", async () => {
    getFiltersMock.mockResolvedValueOnce({
      years: [2026],
      championships: [],
      drivers: [],
    });
    getCurrentChampionshipMock.mockResolvedValueOnce(null);
    getResultsStatsMock.mockResolvedValueOnce([]);
    getResultsEventParticipationMock.mockResolvedValueOnce({
      items: [
        {
          eventId: "event-7",
          seasonYear: 2026,
          championshipSlug: "tz-4000",
          championshipName: "TZ 4000",
          roundNumber: 5,
          circuitName: "San Juan",
          eventDate: null,
          participants: [
            {
              driverSlug: "zeta-driver",
              driverName: "Zeta Driver",
              sessions: [
                { sessionKind: "f", sessionLabel: "F", rawValue: "10", position: 10, status: null },
                { sessionKind: "p", sessionLabel: "P", rawValue: "25", position: 25, status: null },
              ],
            },
            {
              driverSlug: "alpha-driver",
              driverName: "Alpha Driver",
              sessions: [
                { sessionKind: "f", sessionLabel: "F", rawValue: "1", position: 1, status: null },
                { sessionKind: "p", sessionLabel: "P", rawValue: "18", position: 18, status: null },
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

    expect(html.indexOf("Zeta Driver")).toBeLessThan(html.indexOf("Alpha Driver"));
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
