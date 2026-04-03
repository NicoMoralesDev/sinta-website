import { beforeEach, describe, expect, it, vi } from "vitest";

const queryMock = vi.fn();

vi.mock("@/lib/server/db", () => ({
  getDbPool: () => ({
    query: queryMock,
  }),
}));

import { getChampionshipById, listAdminChampionships } from "@/lib/server/admin/repository";

describe("admin repository", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it("falls back when organizer_name is missing from championships", async () => {
    queryMock
      .mockRejectedValueOnce({
        code: "42703",
        message: 'column "organizer_name" does not exist',
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "champ-1",
            season_year: 2026,
            name: "TZ 4000",
            slug: "tz-4000",
            organizer_name: null,
            primary_session_label: "Sprint",
            secondary_session_label: "Final",
            is_active: true,
            created_at: "2026-01-01T00:00:00.000Z",
            updated_at: "2026-01-02T00:00:00.000Z",
          },
        ],
      });

    const championships = await listAdminChampionships(true);

    expect(championships).toEqual([
      {
        id: "champ-1",
        seasonYear: 2026,
        name: "TZ 4000",
        slug: "tz-4000",
        organizerName: null,
        primarySessionLabel: "Sprint",
        secondarySessionLabel: "Final",
        isActive: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
    ]);
    expect(String(queryMock.mock.calls[1]?.[0] ?? "")).toContain("null::text as organizer_name");
  });

  it("falls back when loading a championship by id on a legacy schema", async () => {
    queryMock
      .mockRejectedValueOnce({
        code: "42703",
        message: 'column "organizer_name" does not exist',
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "champ-1",
            season_year: 2026,
            name: "TZ 4000",
            slug: "tz-4000",
            organizer_name: null,
            primary_session_label: "Sprint",
            secondary_session_label: "Final",
            is_active: true,
            created_at: "2026-01-01T00:00:00.000Z",
            updated_at: "2026-01-02T00:00:00.000Z",
          },
        ],
      });

    const championship = await getChampionshipById("champ-1");

    expect(championship?.organizerName).toBeNull();
    expect(String(queryMock.mock.calls[1]?.[0] ?? "")).toContain("null::text as organizer_name");
  });
});
