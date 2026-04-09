import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { HistoryNotFoundError, HistoryValidationError } from "@/lib/server/history/errors";
import {
  formatEventParticipationSessionValue,
  getEventParticipationSessionColumns,
} from "@/app/components/event-participation-helpers";

const { getResultsEventParticipationByIdMock, imageResponseMock } = vi.hoisted(() => ({
  getResultsEventParticipationByIdMock: vi.fn(),
  imageResponseMock: vi.fn((element: React.ReactElement, options: { headers?: HeadersInit }) => {
    return new Response("image-binary", {
      status: 200,
      headers: options.headers,
    });
  }),
}));

vi.mock("@/lib/server/history/service", () => ({
  getResultsEventParticipationById: getResultsEventParticipationByIdMock,
}));

vi.mock("next/og", () => ({
  ImageResponse: imageResponseMock,
}));

import { GET } from "@/app/api/v1/results/events/[id]/image/route";

function buildEvent(participantCount = 2) {
  return {
    eventId: "550e8400-e29b-41d4-a716-446655440000",
    seasonYear: 2026,
    championshipSlug: "tz-4000",
    championshipName: "TZ 4000",
    roundNumber: 4,
    circuitName: "Interlagos",
    eventDate: "2026-03-11T00:00:00.000Z",
    participants: Array.from({ length: participantCount }, (_, index) => ({
      driverSlug: `driver-${index + 1}`,
      driverName: `Driver ${index + 1}`,
      sessions: [
        { sessionKind: "qs" as const, sessionLabel: "QS", rawValue: "4", position: 4, status: null },
        { sessionKind: "s" as const, sessionLabel: "S", rawValue: "3", position: 3, status: null },
        { sessionKind: "qf" as const, sessionLabel: "QF", rawValue: "2", position: 2, status: null },
        { sessionKind: "f" as const, sessionLabel: "F", rawValue: "1", position: index + 1, status: null },
        { sessionKind: "p" as const, sessionLabel: "P", rawValue: "25", position: 25 - index, status: null },
      ],
    })),
  };
}

describe("history share image helpers", () => {
  it("keeps canonical QS, S, QF, F, and P column order and omits sparse historical gaps", () => {
    const denseEvent = buildEvent(1);
    const sparseEvent = {
      ...buildEvent(1),
      eventId: "660e8400-e29b-41d4-a716-446655440000",
      participants: [
        {
          driverSlug: "legacy-driver",
          driverName: "Legacy Driver",
          sessions: [
            { sessionKind: "f" as const, sessionLabel: "F", rawValue: "2", position: 2, status: null },
          ],
        },
      ],
    };

    expect(getEventParticipationSessionColumns(denseEvent).map((column) => column.sessionLabel)).toEqual([
      "QS",
      "S",
      "QF",
      "F",
      "P",
    ]);
    expect(
      formatEventParticipationSessionValue(
        {
          sessionKind: "p",
          sessionLabel: "P",
          rawValue: "25.5",
          position: 25.5,
          status: null,
        },
        "en",
      ),
    ).toBe("25.5");

    const sparseColumns = getEventParticipationSessionColumns(sparseEvent).map(
      (column) => column.sessionLabel,
    );
    expect(sparseColumns).toContain("F");
    expect(sparseColumns).not.toContain("QS");
    expect(sparseColumns).not.toContain("QF");
    expect(sparseColumns).not.toContain("P");
  });
});

describe("results event share image route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("forwards the optional driver slug and renders only the selected driver set", async () => {
    getResultsEventParticipationByIdMock.mockResolvedValueOnce({
      ...buildEvent(1),
      participants: [
        {
          driverSlug: "kevin-fontana",
          driverName: "Kevin Fontana",
          sessions: [
            { sessionKind: "f", sessionLabel: "F", rawValue: "1", position: 1, status: null },
            { sessionKind: "p", sessionLabel: "P", rawValue: "25", position: 25, status: null },
          ],
        },
      ],
    });

    const response = await GET(
      new Request(
        "http://localhost/api/v1/results/events/550e8400-e29b-41d4-a716-446655440000/image?driver=kevin-fontana&lang=en",
      ),
      {
        params: Promise.resolve({
          id: "550e8400-e29b-41d4-a716-446655440000",
        }),
      },
    );

    expect(response.status).toBe(200);
    expect(getResultsEventParticipationByIdMock).toHaveBeenCalledWith(
      "550e8400-e29b-41d4-a716-446655440000",
      "kevin-fontana",
    );

    const [element] = imageResponseMock.mock.calls[0] as [
      React.ReactElement,
      { headers?: HeadersInit },
    ];
    const markup = renderToStaticMarkup(element);

    expect(markup).toContain("Kevin Fontana");
    expect(markup).not.toContain("Driver 2");
  });

  it("returns an image response with public cache headers and preserves participant order", async () => {
    getResultsEventParticipationByIdMock.mockResolvedValueOnce({
      ...buildEvent(2),
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
            { sessionKind: "p", sessionLabel: "P", rawValue: "18.5", position: 18.5, status: null },
          ],
        },
      ],
    });

    const response = await GET(
      new Request("http://localhost/api/v1/results/events/550e8400-e29b-41d4-a716-446655440000/image?lang=en"),
      {
        params: Promise.resolve({
          id: "550e8400-e29b-41d4-a716-446655440000",
        }),
      },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe(
      "public, s-maxage=120, stale-while-revalidate=600",
    );
    expect(getResultsEventParticipationByIdMock).toHaveBeenCalledWith(
      "550e8400-e29b-41d4-a716-446655440000",
      undefined,
    );

    const [element, options] = imageResponseMock.mock.calls[0] as [
      React.ReactElement,
      { width: number; height: number },
    ];
    const markup = renderToStaticMarkup(element);

    expect(markup.indexOf("Zeta Driver")).toBeLessThan(markup.indexOf("Alpha Driver"));
    expect(markup).toContain("F");
    expect(markup).toContain("PTS");
    expect(markup).toContain("18.5");
    expect(markup).not.toContain("P25");
    expect(options.height).toBe(1350);
  });

  it("falls back to the simplified image layout when the primary ImageResponse render fails", async () => {
    getResultsEventParticipationByIdMock.mockResolvedValueOnce({
      ...buildEvent(1),
      participants: [
        {
          driverSlug: "kevin-fontana",
          driverName: "Kevin Fontana",
          sessions: [
            { sessionKind: "f", sessionLabel: "F", rawValue: "1", position: 1, status: null },
            { sessionKind: "p", sessionLabel: "P", rawValue: "18.5", position: 18.5, status: null },
          ],
        },
      ],
    });
    imageResponseMock
      .mockImplementationOnce(() => {
        throw new Error("Primary layout failed");
      })
      .mockImplementationOnce((element: React.ReactElement, options: { headers?: HeadersInit }) => {
        return new Response(renderToStaticMarkup(element), {
          status: 200,
          headers: options.headers,
        });
      });

    const response = await GET(
      new Request("http://localhost/api/v1/results/events/550e8400-e29b-41d4-a716-446655440000/image"),
      {
        params: Promise.resolve({
          id: "550e8400-e29b-41d4-a716-446655440000",
        }),
      },
    );
    const markup = await response.text();

    expect(response.status).toBe(200);
    expect(imageResponseMock).toHaveBeenCalledTimes(2);
    expect(markup).toContain("Kevin Fontana");
    expect(markup).toContain("18.5");
    expect(markup).toContain("PTS");
  });

  it("returns 400 for invalid event ids", async () => {
    getResultsEventParticipationByIdMock.mockRejectedValueOnce(
      new HistoryValidationError("eventId must be a UUID."),
    );

    const response = await GET(
      new Request("http://localhost/api/v1/results/events/not-a-uuid/image"),
      {
        params: Promise.resolve({
          id: "not-a-uuid",
        }),
      },
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: "eventId must be a UUID.",
    });
  });

  it("returns 404 for missing public events", async () => {
    getResultsEventParticipationByIdMock.mockRejectedValueOnce(
      new HistoryNotFoundError("Event not found: 550e8400-e29b-41d4-a716-446655440000"),
    );

    const response = await GET(
      new Request("http://localhost/api/v1/results/events/550e8400-e29b-41d4-a716-446655440000/image"),
      {
        params: Promise.resolve({
          id: "550e8400-e29b-41d4-a716-446655440000",
        }),
      },
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      ok: false,
      error: "Event not found: 550e8400-e29b-41d4-a716-446655440000",
    });
  });

  it("returns 404 when the requested driver does not belong to the event", async () => {
    getResultsEventParticipationByIdMock.mockRejectedValueOnce(
      new HistoryNotFoundError("Event not found: 550e8400-e29b-41d4-a716-446655440000"),
    );

    const response = await GET(
      new Request(
        "http://localhost/api/v1/results/events/550e8400-e29b-41d4-a716-446655440000/image?driver=kevin-fontana",
      ),
      {
        params: Promise.resolve({
          id: "550e8400-e29b-41d4-a716-446655440000",
        }),
      },
    );
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({
      ok: false,
      error: "Event not found: 550e8400-e29b-41d4-a716-446655440000",
    });
  });

  it("grows image height for dense events so lower rows do not clip", async () => {
    getResultsEventParticipationByIdMock.mockResolvedValueOnce(buildEvent(14));

    await GET(
      new Request("http://localhost/api/v1/results/events/550e8400-e29b-41d4-a716-446655440000/image"),
      {
        params: Promise.resolve({
          id: "550e8400-e29b-41d4-a716-446655440000",
        }),
      },
    );

    const [, options] = imageResponseMock.mock.calls[0] as [
      React.ReactElement,
      { width: number; height: number },
    ];

    expect(options.height).toBeGreaterThan(1350);
  });
});
