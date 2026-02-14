import { beforeEach, describe, expect, it, vi } from "vitest";

const queryMock = vi.fn();

vi.mock("@/lib/server/db", () => ({
  getDbPool: () => ({
    query: queryMock,
  }),
}));

import { getEventResultsPage } from "@/lib/server/history/repository";

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
});

