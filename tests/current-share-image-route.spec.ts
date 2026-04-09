import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const { getCurrentChampionshipMock, imageResponseMock } = vi.hoisted(() => ({
  getCurrentChampionshipMock: vi.fn(),
  imageResponseMock: vi.fn((element: React.ReactElement, options: { headers?: HeadersInit }) => {
    return new Response("image-binary", {
      status: 200,
      headers: options.headers,
    });
  }),
}));

vi.mock("@/lib/server/history/service", () => ({
  getCurrentChampionship: getCurrentChampionshipMock,
}));

vi.mock("next/og", () => ({
  ImageResponse: imageResponseMock,
}));

import { GET } from "@/app/api/v1/results/current/image/route";

describe("current championship share image route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the current leaderboard image with cache headers", async () => {
    getCurrentChampionshipMock.mockResolvedValueOnce({
      championship: {
        id: "champ-1",
        seasonYear: 2026,
        slug: "clase-3",
        name: "Clase 3",
        organizerName: "SINTA",
      },
      events: [],
      leaderboard: [
        {
          driverSlug: "driver-1",
          driverName: "Driver 1",
          wins: 3,
          podiums: 4,
          top10: 5,
          totalPoints: 92.5,
          completed: 5,
          avgPosition: 4.2,
        },
        {
          driverSlug: "driver-2",
          driverName: "Driver 2",
          wins: 1,
          podiums: 2,
          top10: 3,
          totalPoints: 64,
          completed: 5,
          avgPosition: 8.1,
        },
      ],
    });

    const response = await GET(new Request("http://localhost/api/v1/results/current/image?lang=en"));

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe(
      "public, s-maxage=120, stale-while-revalidate=600",
    );
    expect(getCurrentChampionshipMock.mock.calls[0]?.[0]?.toString()).toBe("limit=8");

    const [element, options] = imageResponseMock.mock.calls[0] as [
      React.ReactElement,
      { width: number; height: number },
    ];
    const markup = renderToStaticMarkup(element);

    expect(markup).toContain("Current championship - Clase 3");
    expect(markup).toContain("Driver 1");
    expect(markup).toContain("92.5");
    expect(options.width).toBe(1080);
    expect(options.height).toBeGreaterThanOrEqual(420);
  });

  it("returns 404 when no current championship exists", async () => {
    getCurrentChampionshipMock.mockResolvedValueOnce(null);

    const response = await GET(new Request("http://localhost/api/v1/results/current/image"));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      ok: false,
      error: "Current championship not found.",
    });
  });
});
