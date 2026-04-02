import { describe, expect, it, vi } from "vitest";

const { getResultsEventsMock, getResultsEventParticipationMock } = vi.hoisted(() => ({
  getResultsEventsMock: vi.fn(),
  getResultsEventParticipationMock: vi.fn(),
}));

vi.mock("@/lib/server/history/service", () => ({
  getResultsEvents: getResultsEventsMock,
  getResultsEventParticipation: getResultsEventParticipationMock,
}));

import { HistoryValidationError } from "@/lib/server/history/errors";
import { GET } from "@/app/api/v1/results/events/route";

describe("results events API route", () => {
  it("returns 200 with payload from service", async () => {
    getResultsEventsMock.mockResolvedValueOnce({
      items: [{ eventId: "event-1" }],
      nextCursor: "cursor-2",
    });

    const response = await GET(new Request("http://localhost/api/v1/results/events?limit=1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      items: [{ eventId: "event-1" }],
      nextCursor: "cursor-2",
    });
  });

  it("returns 400 for validation errors", async () => {
    getResultsEventsMock.mockRejectedValueOnce(new HistoryValidationError("invalid limit"));

    const response = await GET(new Request("http://localhost/api/v1/results/events?limit=-1"));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({
      ok: false,
      error: "invalid limit",
    });
  });

  it("returns participation payload when view=participation", async () => {
    getResultsEventParticipationMock.mockResolvedValueOnce({
      items: [{ eventId: "event-2" }],
      nextCursor: null,
    });

    const response = await GET(
      new Request("http://localhost/api/v1/results/events?view=participation&limit=1"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      items: [{ eventId: "event-2" }],
      nextCursor: null,
    });
  });

  it("returns canonical qs, s, qf, f, and p results in session order for event payloads", async () => {
    getResultsEventsMock.mockResolvedValueOnce({
      items: [
        {
          eventId: "event-3",
          results: [
            { sessionKind: "qs", sessionLabel: "QS", rawValue: "1" },
            { sessionKind: "s", sessionLabel: "S", rawValue: "3" },
            { sessionKind: "qf", sessionLabel: "QF", rawValue: "2" },
            { sessionKind: "f", sessionLabel: "F", rawValue: "4" },
            { sessionKind: "p", sessionLabel: "P", rawValue: "25" },
          ],
        },
      ],
      nextCursor: null,
    });

    const response = await GET(new Request("http://localhost/api/v1/results/events?limit=1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.items[0]?.results.map((entry: { sessionKind: string }) => entry.sessionKind)).toEqual([
      "qs",
      "s",
      "qf",
      "f",
      "p",
    ]);
  });

  it("preserves sparse historical event payloads without synthesizing missing canonical sessions", async () => {
    getResultsEventParticipationMock.mockResolvedValueOnce({
      items: [
        {
          eventId: "event-4",
          participants: [
            {
              driverSlug: "kevin-fontana",
              driverName: "Kevin Fontana",
              sessions: [{ sessionKind: "f", sessionLabel: "F", rawValue: "1", position: 1, status: null }],
            },
          ],
        },
      ],
      nextCursor: null,
    });

    const response = await GET(
      new Request("http://localhost/api/v1/results/events?view=participation&limit=1"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.items[0]?.participants[0]?.sessions).toEqual([
      { sessionKind: "f", sessionLabel: "F", rawValue: "1", position: 1, status: null },
    ]);
  });
});
