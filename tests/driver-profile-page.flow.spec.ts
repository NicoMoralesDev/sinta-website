import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const {
  getFiltersMock,
  getDriverProfileBySlugMock,
  getDriverHistoryMock,
} = vi.hoisted(() => ({
  getFiltersMock: vi.fn(),
  getDriverProfileBySlugMock: vi.fn(),
  getDriverHistoryMock: vi.fn(),
}));

vi.mock("@/lib/server/history/service", () => ({
  getFilters: getFiltersMock,
  getDriverProfileBySlug: getDriverProfileBySlugMock,
  getDriverHistory: getDriverHistoryMock,
}));

import DriverProfilePage from "@/app/drivers/[slug]/page";

describe("driver profile page flow", () => {
  it("renders profile and keeps filters in next-page link", async () => {
    getFiltersMock.mockResolvedValueOnce({
      years: [2026],
      championships: [{ id: "champ-1", seasonYear: 2026, slug: "tz-4000", name: "TZ 4000" }],
      drivers: [],
    });
    getDriverProfileBySlugMock.mockResolvedValueOnce({
      slug: "kevin-fontana",
      canonicalName: "Kevin Fontana",
      sortName: "Fontana, Kevin",
      countryCode: "ar",
      countryNameEs: "Argentina",
      countryNameEn: "Argentina",
      roleEs: "Piloto",
      roleEn: "Driver",
      isActive: true,
      stats: {
        driverSlug: "kevin-fontana",
        canonicalName: "Kevin Fontana",
        wins: 2,
        podiums: 4,
        top5: 6,
        top10: 8,
        completed: 10,
        dnf: 1,
        dnq: 0,
        dsq: 0,
        absent: 0,
      },
    });
    getDriverHistoryMock.mockResolvedValueOnce({
      items: [
        {
          eventId: "event-1",
          seasonYear: 2026,
          championshipSlug: "tz-4000",
          championshipName: "TZ 4000",
          roundNumber: 1,
          circuitName: "Interlagos",
          eventDate: null,
          results: [
            {
              driverSlug: "kevin-fontana",
              driverName: "Kevin Fontana",
              sessionKind: "primary",
              sessionLabel: "Sprint",
              position: 2,
              status: null,
              rawValue: "2",
            },
          ],
        },
      ],
      nextCursor: "cursor-9",
    });

    const element = await DriverProfilePage({
      params: { slug: "kevin-fontana" },
      searchParams: {
        lang: "en",
        year: "2026",
        championship: "tz-4000",
        limit: "10",
      },
    });
    const html = renderToStaticMarkup(element);

    expect(html).toContain("Kevin Fontana");
    expect(html).toContain("Career stats");
    expect(html).toContain(
      "/drivers/kevin-fontana?year=2026&amp;championship=tz-4000&amp;limit=10&amp;cursor=cursor-9&amp;lang=en",
    );
  });

  it("shows not-found state for unknown slug", async () => {
    getFiltersMock.mockResolvedValueOnce({
      years: [],
      championships: [],
      drivers: [],
    });
    getDriverProfileBySlugMock.mockRejectedValueOnce(new Error("Driver not found: ghost-driver"));
    getDriverHistoryMock.mockResolvedValueOnce({
      items: [],
      nextCursor: null,
    });

    const element = await DriverProfilePage({
      params: { slug: "ghost-driver" },
      searchParams: { lang: "en" },
    });
    const html = renderToStaticMarkup(element);

    expect(html).toContain("Driver not found.");
    expect(html).toContain("/results?lang=en");
  });
});
