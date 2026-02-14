import { describe, expect, it, vi } from "vitest";

const { getResultsEventsMock } = vi.hoisted(() => ({
  getResultsEventsMock: vi.fn(),
}));

vi.mock("@/lib/server/history/service", () => ({
  getResultsEvents: getResultsEventsMock,
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
});
