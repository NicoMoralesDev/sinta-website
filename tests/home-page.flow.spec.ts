import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { CurrentChampionshipSummary } from "@/lib/server/history/types";

const {
  getHomeCurrentChampionshipMock,
  getHomeLiveBroadcastMock,
  getHomeOverviewKpisMock,
  getHomeRecentEventParticipationMock,
  getHomeTeamMembersMock,
} = vi.hoisted(() => ({
  getHomeCurrentChampionshipMock: vi.fn(),
  getHomeLiveBroadcastMock: vi.fn(),
  getHomeOverviewKpisMock: vi.fn(),
  getHomeRecentEventParticipationMock: vi.fn(),
  getHomeTeamMembersMock: vi.fn(),
}));

vi.mock("@/lib/server/history/service", () => ({
  getHomeCurrentChampionship: getHomeCurrentChampionshipMock,
  getHomeLiveBroadcast: getHomeLiveBroadcastMock,
  getHomeOverviewKpis: getHomeOverviewKpisMock,
  getHomeRecentEventParticipation: getHomeRecentEventParticipationMock,
  getHomeTeamMembers: getHomeTeamMembersMock,
}));

import HomePage from "@/app/page";

function createCurrentChampionship(
  events: Array<{
    roundNumber: number;
    circuitName: string;
    eventDate: string | null;
    championshipName?: string;
  }>,
): CurrentChampionshipSummary {
  const fallbackChampionshipName = events[0]?.championshipName ?? "TZ 4000";

  return {
    championship: {
      id: "champ-1",
      seasonYear: 2026,
      slug: "tz-4000",
      name: fallbackChampionshipName,
    },
    events: events.map((event) => ({
      eventId: `event-${event.roundNumber}`,
      seasonYear: 2026,
      championshipSlug: "tz-4000",
      championshipName: event.championshipName ?? fallbackChampionshipName,
      roundNumber: event.roundNumber,
      circuitName: event.circuitName,
      eventDate: event.eventDate,
      participants: [],
    })),
    leaderboard: [],
  };
}

describe("home page flow", () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();

    getHomeCurrentChampionshipMock.mockResolvedValue(null);
    getHomeLiveBroadcastMock.mockResolvedValue(null);
    getHomeOverviewKpisMock.mockResolvedValue(null);
    getHomeRecentEventParticipationMock.mockResolvedValue([]);
    getHomeTeamMembersMock.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows only today and future calendar events", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-10T12:00:00.000Z"));
    getHomeCurrentChampionshipMock.mockResolvedValueOnce(
      createCurrentChampionship([
        { roundNumber: 1, circuitName: "Interlagos", eventDate: "2026-03-09" },
        { roundNumber: 2, circuitName: "Autodromo de Imola", eventDate: "2026-03-10" },
        { roundNumber: 3, circuitName: "Silverstone Circuit", eventDate: "2026-03-15" },
        { roundNumber: 4, circuitName: "Suzuka Circuit", eventDate: null },
      ]),
    );

    const element = await HomePage({
      searchParams: {},
    });
    const html = renderToStaticMarkup(element);
    const [headerHtml] = html.split("<main>");

    expect(html).toContain('id="calendar"');
    expect(html).toContain("Fecha 2");
    expect(html).toContain("Fecha 3");
    expect(html).toContain("Autodromo de Imola");
    expect(html).toContain("Silverstone Circuit");
    expect(html).not.toContain("Interlagos");
    expect(html).not.toContain("Watkins Glen 2H");
    expect(headerHtml).toContain("/#calendar");
  });

  it("hides calendar section and home calendar menu item when no upcoming events remain", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-01T03:00:00.000Z"));
    getHomeCurrentChampionshipMock.mockResolvedValueOnce(
      createCurrentChampionship([
        { roundNumber: 1, circuitName: "Interlagos", eventDate: "2026-03-09" },
        { roundNumber: 2, circuitName: "Autodromo de Imola", eventDate: null },
      ]),
    );

    const element = await HomePage({
      searchParams: {},
    });
    const html = renderToStaticMarkup(element);
    const [headerHtml] = html.split("<main>");

    expect(html).not.toContain('id="calendar"');
    expect(headerHtml).not.toContain("/#calendar");
    expect(html).not.toContain("Watkins Glen 2H");
  });
});
