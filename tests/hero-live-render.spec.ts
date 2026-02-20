import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { Hero } from "@/app/components/hero";
import { siteCopy } from "@/app/content/site-content";
import type { HomeLiveBroadcast } from "@/lib/server/history/types";

const LIVE_BROADCAST: HomeLiveBroadcast = {
  eventId: "event-1",
  seasonYear: 2026,
  championshipSlug: "tz-4000",
  championshipName: "TZ 4000",
  roundNumber: 4,
  circuitName: "Interlagos",
  streamVideoId: "dQw4w9WgXcQ",
  streamStartAt: "2026-03-01T21:00:00.000Z",
  streamEndAt: "2026-03-01T23:00:00.000Z",
  streamOverrideMode: "auto",
  status: "live",
};

describe("hero live render", () => {
  it("renders embedded player when live broadcast is available", () => {
    const html = renderToStaticMarkup(
      React.createElement(Hero, { copy: siteCopy.en.hero, lang: "en", liveBroadcast: LIVE_BROADCAST }),
    );

    expect(html).toContain("youtube.com/embed/dQw4w9WgXcQ");
    expect(html).toContain("LIVE");
    expect(html).toContain("Watch on YouTube");
    expect(html).toContain("Starts (Argentina Time, UTC-3)");
    expect(html).toContain("Starts (Universal Time, UTC)");
    expect(html).not.toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
  });

  it("does not render embedded player when no live broadcast is available", () => {
    const html = renderToStaticMarkup(
      React.createElement(Hero, { copy: siteCopy.en.hero, lang: "en", liveBroadcast: null }),
    );

    expect(html).not.toContain("youtube.com/embed/");
    expect(html).not.toContain("Watch on YouTube");
  });
});
