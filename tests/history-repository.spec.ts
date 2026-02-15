import { beforeEach, describe, expect, it, vi } from "vitest";

const queryMock = vi.fn();

vi.mock("@/lib/server/db", () => ({
  getDbPool: () => ({
    query: queryMock,
  }),
}));

import {
  getCurrentChampionshipSummary,
  getEventResultsPage,
  getResultsOverview,
} from "@/lib/server/history/repository";

describe("history repository", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it("groups query rows by event and maps result entries", async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [
          {
            event_id: "event-1",
            season_year: 2026,
            championship_slug: "tz-4000",
            championship_name: "TZ 4000",
            round_number: 1,
            circuit_name: "La Plata",
            event_date: null,
            primary_session_label: "Sprint",
            secondary_session_label: "Final",
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            event_id: "event-1",
            driver_slug: "kevin-fontana",
            driver_name: "Kevin Fontana",
            session_kind: "primary",
            session_label: "Sprint",
            position: 2,
            status: null,
            raw_value: "2",
          },
          {
            event_id: "event-1",
            driver_slug: "kevin-fontana",
            driver_name: "Kevin Fontana",
            session_kind: "secondary",
            session_label: "Final",
            position: null,
            status: "DNF",
            raw_value: "DNF",
          },
        ],
      });

    const page = await getEventResultsPage({
      year: 2026,
      championship: "tz-4000",
      driver: undefined,
      limit: 10,
      offset: 0,
    });

    expect(page.hasNext).toBe(false);
    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.eventId).toBe("event-1");
    expect(page.items[0]?.results).toHaveLength(2);
    expect(page.items[0]?.results[1]?.status).toBe("DNF");
  });

  it("marks hasNext when query receives more than limit rows", async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [
          {
            event_id: "event-1",
            season_year: 2026,
            championship_slug: "tz-4000",
            championship_name: "TZ 4000",
            round_number: 1,
            circuit_name: "La Plata",
            event_date: null,
            primary_session_label: "Sprint",
            secondary_session_label: "Final",
          },
          {
            event_id: "event-2",
            season_year: 2026,
            championship_slug: "tz-4000",
            championship_name: "TZ 4000",
            round_number: 2,
            circuit_name: "Trelew",
            event_date: null,
            primary_session_label: "Sprint",
            secondary_session_label: "Final",
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [],
      });

    const page = await getEventResultsPage({
      year: undefined,
      championship: undefined,
      driver: undefined,
      limit: 1,
      offset: 0,
    });

    expect(page.hasNext).toBe(true);
    expect(page.items).toHaveLength(1);
  });

  it("uses active drivers table for global overview", async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [
          {
            races_completed: 120,
            podiums: 44,
            wins: 12,
            active_drivers: 8,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [{ active_drivers: 10 }],
      });

    const overview = await getResultsOverview({});

    expect(overview).toEqual({
      racesCompleted: 120,
      podiums: 44,
      wins: 12,
      activeDrivers: 10,
    });
    expect(queryMock).toHaveBeenCalledTimes(2);
  });

  it("builds current championship summary from latest event", async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [
          {
            championship_id: "champ-1",
            season_year: 2026,
            championship_slug: "tz-4000",
            championship_name: "TZ 4000",
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            event_id: "event-1",
            season_year: 2026,
            championship_slug: "tz-4000",
            championship_name: "TZ 4000",
            round_number: 5,
            circuit_name: "Interlagos",
            event_date: null,
            primary_session_label: "Sprint",
            secondary_session_label: "Final",
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            event_id: "event-1",
            driver_slug: "kevin-fontana",
            driver_name: "Kevin Fontana",
            session_kind: "primary",
            session_label: "Sprint",
            position: 1,
            status: null,
            raw_value: "1",
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            driver_slug: "kevin-fontana",
            driver_name: "Kevin Fontana",
            wins: 2,
            podiums: 4,
            top_10: 5,
            completed: 5,
            avg_position: 2.4,
          },
        ],
      });

    const summary = await getCurrentChampionshipSummary(3);

    expect(summary).not.toBeNull();
    expect(summary?.championship.slug).toBe("tz-4000");
    expect(summary?.events).toHaveLength(1);
    expect(summary?.leaderboard[0]?.driverSlug).toBe("kevin-fontana");
  });
});

