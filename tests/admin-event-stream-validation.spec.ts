import { describe, expect, it } from "vitest";

import { AdminValidationError } from "@/lib/server/admin/errors";
import {
  normalizeEventStreamPatch,
  parseStreamDateTimeInput,
  parseYouTubeVideoId,
} from "@/lib/server/admin/service";

const BASE_STREAM_STATE = {
  streamVideoId: null,
  streamStartAt: null,
  streamEndAt: null,
  streamOverrideMode: "auto" as const,
};

describe("admin event stream validation", () => {
  it("accepts valid YouTube URL and raw ID inputs", () => {
    expect(parseYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(parseYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(parseYouTubeVideoId("https://www.youtube.com/live/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(parseYouTubeVideoId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("rejects non-youtube URLs", () => {
    expect(() => parseYouTubeVideoId("https://example.com/watch?v=dQw4w9WgXcQ")).toThrow(AdminValidationError);
  });

  it("converts ART datetime-local input to UTC ISO", () => {
    expect(parseStreamDateTimeInput("2026-03-01T18:00", "streamStartAt")).toBe("2026-03-01T21:00:00.000Z");
  });

  it("rejects partial stream windows", () => {
    expect(() =>
      normalizeEventStreamPatch(BASE_STREAM_STATE, {
        streamVideoId: "dQw4w9WgXcQ",
        streamStartAt: "2026-03-01T18:00",
      }),
    ).toThrow("streamStartAt and streamEndAt must be provided together.");
  });

  it("rejects end before or equal to start", () => {
    expect(() =>
      normalizeEventStreamPatch(BASE_STREAM_STATE, {
        streamVideoId: "dQw4w9WgXcQ",
        streamStartAt: "2026-03-01T18:00",
        streamEndAt: "2026-03-01T18:00",
      }),
    ).toThrow("streamEndAt must be greater than streamStartAt.");
  });

  it("allows clearing stream fields on update", () => {
    const before = {
      streamVideoId: "dQw4w9WgXcQ",
      streamStartAt: "2026-03-01T21:00:00.000Z",
      streamEndAt: "2026-03-01T23:00:00.000Z",
      streamOverrideMode: "auto" as const,
    };

    const result = normalizeEventStreamPatch(before, {
      streamVideoId: null,
      streamStartAt: null,
      streamEndAt: null,
      streamOverrideMode: "auto",
    });

    expect(result.next).toEqual(BASE_STREAM_STATE);
  });
});
