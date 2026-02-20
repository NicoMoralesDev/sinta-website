import { describe, expect, it } from "vitest";

import {
  isHomeLiveBroadcastVisible,
  resolveHomeLiveBroadcastStatus,
} from "@/lib/server/history/service";
import type { HomeLiveBroadcast } from "@/lib/server/history/types";

const BASE_BROADCAST: HomeLiveBroadcast = {
  eventId: "event-1",
  seasonYear: 2026,
  championshipSlug: "tz-4000",
  championshipName: "TZ 4000",
  roundNumber: 2,
  circuitName: "Interlagos",
  streamVideoId: "dQw4w9WgXcQ",
  streamStartAt: "2026-03-01T21:00:00.000Z",
  streamEndAt: "2026-03-01T23:00:00.000Z",
  streamOverrideMode: "auto",
  status: "upcoming",
};

describe("home live broadcast visibility and status", () => {
  it("shows upcoming inside pre-live window", () => {
    const nowIso = "2026-03-01T20:30:00.000Z";
    expect(isHomeLiveBroadcastVisible(BASE_BROADCAST, nowIso)).toBe(true);
    expect(resolveHomeLiveBroadcastStatus(BASE_BROADCAST, nowIso)).toBe("upcoming");
  });

  it("shows live during event window", () => {
    const nowIso = "2026-03-01T21:10:00.000Z";
    expect(isHomeLiveBroadcastVisible(BASE_BROADCAST, nowIso)).toBe(true);
    expect(resolveHomeLiveBroadcastStatus(BASE_BROADCAST, nowIso)).toBe("live");
  });

  it("hides auto stream after end time", () => {
    const nowIso = "2026-03-01T23:00:01.000Z";
    expect(isHomeLiveBroadcastVisible(BASE_BROADCAST, nowIso)).toBe(false);
  });

  it("force_on always shows and force_off always hides", () => {
    const nowIso = "2026-03-02T07:00:00.000Z";
    expect(
      isHomeLiveBroadcastVisible({ ...BASE_BROADCAST, streamOverrideMode: "force_on" }, nowIso),
    ).toBe(true);
    expect(
      isHomeLiveBroadcastVisible({ ...BASE_BROADCAST, streamOverrideMode: "force_off" }, nowIso),
    ).toBe(false);
  });
});
