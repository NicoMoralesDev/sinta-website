import { describe, expect, it } from "vitest";

import {
  isEventCloseInNext24Hours,
  suggestLiveWindowForEventDate,
} from "@/app/admin/_components/events-live-suggestions";

describe("events live suggestions", () => {
  it("detects event date inside the next 24 hours window", () => {
    const now = new Date("2026-03-10T14:00:00.000Z");

    expect(isEventCloseInNext24Hours("2026-03-10", now)).toBe(true);
    expect(isEventCloseInNext24Hours("2026-03-11", now)).toBe(true);
    expect(isEventCloseInNext24Hours("2026-03-12", now)).toBe(false);
  });

  it("builds default suggestion at 20:00 ART for future event dates", () => {
    const now = new Date("2026-03-10T14:00:00.000Z");
    const suggestion = suggestLiveWindowForEventDate("2026-03-11", now);

    expect(suggestion).toEqual({
      startAtArtLocal: "2026-03-11T20:00",
      endAtArtLocal: "2026-03-11T22:00",
    });
  });

  it("uses a near-future fallback when default start has already passed", () => {
    const now = new Date("2026-03-10T23:58:00.000Z");
    const suggestion = suggestLiveWindowForEventDate("2026-03-10", now);

    expect(suggestion?.startAtArtLocal).toBe("2026-03-10T21:15");
    expect(suggestion?.endAtArtLocal).toBe("2026-03-10T23:15");
  });
});
