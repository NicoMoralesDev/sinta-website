import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import type { AdminChampionship } from "@/lib/server/admin/types";

const { refreshMock } = vi.hoisted(() => ({
  refreshMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

vi.mock("next/link", () => ({
  default: "a",
}));

import {
  ChampionshipsManager,
  buildCreateChampionshipPayload,
  buildUpdateChampionshipPayload,
} from "@/app/admin/_components/championships-manager";

function makeChampionship(overrides: Partial<AdminChampionship> = {}): AdminChampionship {
  return {
    id: "champ-1",
    seasonYear: 2026,
    name: "TZ 4000",
    slug: "tz-4000",
    organizerName: null,
    primarySessionLabel: "Sprint",
    secondarySessionLabel: "Final",
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("admin championships manager flow", () => {
  it("renders organizer inputs in the existing create and edit flows", () => {
    const html = renderToStaticMarkup(
      createElement(ChampionshipsManager, {
        championships: [makeChampionship()],
      }),
    );

    expect(html).toContain("Organizador");
    expect(html).toContain('name="organizerName"');
    expect(html).toContain('aria-label="Organizador TZ 4000"');
  });

  it("includes organizerName in create and update payload shaping", () => {
    const formData = new FormData();
    formData.set("seasonYear", "2026");
    formData.set("name", "TZ 4000");
    formData.set("organizerName", "  League Ops  ");
    formData.set("primarySessionLabel", "Sprint");
    formData.set("secondarySessionLabel", "Final");

    expect(buildCreateChampionshipPayload(formData)).toEqual({
      seasonYear: 2026,
      name: "TZ 4000",
      organizerName: "League Ops",
      primarySessionLabel: "Sprint",
      secondarySessionLabel: "Final",
    });

    expect(
      buildUpdateChampionshipPayload("champ-1", {
        seasonYear: "2026",
        name: "TZ 4000",
        organizerName: "   ",
        primarySessionLabel: "Sprint",
        secondarySessionLabel: "Final",
      }),
    ).toEqual({
      id: "champ-1",
      seasonYear: 2026,
      name: "TZ 4000",
      organizerName: null,
      primarySessionLabel: "Sprint",
      secondarySessionLabel: "Final",
    });
  });
});
