import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AdminActor, AdminChampionship } from "@/lib/server/admin/types";

const {
  createChampionshipRecordMock,
  getChampionshipByIdMock,
  insertAuditLogMock,
  listAdminChampionshipsMock,
  parseAdminJsonBodyMock,
  readRequestIdMock,
  requireAdminActorMock,
  updateChampionshipRecordMock,
} = vi.hoisted(() => ({
  createChampionshipRecordMock: vi.fn(),
  getChampionshipByIdMock: vi.fn(),
  insertAuditLogMock: vi.fn(),
  listAdminChampionshipsMock: vi.fn(),
  parseAdminJsonBodyMock: vi.fn(),
  readRequestIdMock: vi.fn(),
  requireAdminActorMock: vi.fn(),
  updateChampionshipRecordMock: vi.fn(),
}));

vi.mock("@/lib/server/admin/repository", async () => {
  const actual = await vi.importActual<typeof import("@/lib/server/admin/repository")>(
    "@/lib/server/admin/repository",
  );

  return {
    ...actual,
    createChampionshipRecord: createChampionshipRecordMock,
    getChampionshipById: getChampionshipByIdMock,
    insertAuditLog: insertAuditLogMock,
    listAdminChampionships: listAdminChampionshipsMock,
    updateChampionshipRecord: updateChampionshipRecordMock,
  };
});

vi.mock("@/app/api/v1/admin/_utils", () => ({
  adminJsonOk: (payload: unknown) =>
    new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  handleAdminApiError: (error: unknown) =>
    new Response(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    }),
  parseAdminJsonBody: parseAdminJsonBodyMock,
  readRequestId: readRequestIdMock,
  requireAdminActor: requireAdminActorMock,
}));

import { GET, PATCH, POST } from "@/app/api/v1/admin/championships/route";
import { createChampionship, listChampionships, updateChampionship } from "@/lib/server/admin/service";

const ACTOR: AdminActor = {
  userId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  username: "owner",
  role: "owner",
  mustChangePassword: false,
};
const CHAMPIONSHIP_ID = "44444444-4444-4444-8444-444444444444";

function makeChampionship(overrides: Partial<AdminChampionship> = {}): AdminChampionship {
  return {
    id: CHAMPIONSHIP_ID,
    seasonYear: 2026,
    name: "TZ 4000",
    slug: "tz-4000",
    organizerName: "SINTA eSports",
    primarySessionLabel: "Sprint",
    secondarySessionLabel: "Final",
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("championship organizer", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    listAdminChampionshipsMock.mockResolvedValue([]);
    createChampionshipRecordMock.mockImplementation(async (input) => makeChampionship({
      id: "champ-created",
      seasonYear: input.seasonYear,
      name: input.name,
      slug: input.slug,
      organizerName: input.organizerName,
      primarySessionLabel: input.primarySessionLabel,
      secondarySessionLabel: input.secondarySessionLabel,
    }));
    getChampionshipByIdMock.mockResolvedValue(makeChampionship());
    updateChampionshipRecordMock.mockImplementation(async (_id, input) => makeChampionship({
      seasonYear: input.seasonYear ?? 2026,
      name: input.name ?? "TZ 4000",
      organizerName: input.organizerName ?? "SINTA eSports",
      primarySessionLabel: input.primarySessionLabel ?? "Sprint",
      secondarySessionLabel: input.secondarySessionLabel ?? "Final",
    }));
    insertAuditLogMock.mockResolvedValue({
      id: "audit-1",
      actorUserId: ACTOR.userId,
      actorUsername: ACTOR.username,
      entityType: "championship",
      entityId: CHAMPIONSHIP_ID,
      action: "update",
      before: {},
      after: {},
      requestId: "req-1",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    parseAdminJsonBodyMock.mockResolvedValue({});
    readRequestIdMock.mockReturnValue("req-1");
    requireAdminActorMock.mockResolvedValue({ actor: ACTOR });
  });

  it("persists SINTA eSports through createChampionship and updateChampionship", async () => {
    const created = await createChampionship(ACTOR, {
      seasonYear: 2026,
      name: "TZ 4000",
      slug: "",
      organizerName: "  SINTA eSports  ",
      primarySessionLabel: "Sprint",
      secondarySessionLabel: "Final",
    });

    expect(createChampionshipRecordMock).toHaveBeenCalledWith(expect.objectContaining({
      organizerName: "SINTA eSports",
    }));
    expect(created.data.championship.organizerName).toBe("SINTA eSports");

    const updated = await updateChampionship(ACTOR, CHAMPIONSHIP_ID, {
      organizerName: "  League Ops  ",
    });

    expect(updateChampionshipRecordMock).toHaveBeenCalledWith(CHAMPIONSHIP_ID, expect.objectContaining({
      organizerName: "League Ops",
    }));
    expect(updated.data.championship.organizerName).toBe("League Ops");
  });

  it("returns organizerName from listChampionships and the admin championships route", async () => {
    listAdminChampionshipsMock.mockResolvedValueOnce([
      makeChampionship({ id: CHAMPIONSHIP_ID, organizerName: "SINTA eSports" }),
    ]).mockResolvedValueOnce([
      makeChampionship({ id: CHAMPIONSHIP_ID, organizerName: "SINTA eSports" }),
    ]);

    const championships = await listChampionships(ACTOR, true);

    expect(championships).toEqual([
      expect.objectContaining({ organizerName: "SINTA eSports" }),
    ]);

    const response = await GET(new Request("http://localhost/api/v1/admin/championships?includeInactive=1"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      championships: [
        expect.objectContaining({ organizerName: "SINTA eSports" }),
      ],
    });
  });

  it("treats organizerName as optional trimmed metadata and preserves null when updates are blank", async () => {
    parseAdminJsonBodyMock
      .mockResolvedValueOnce({
        seasonYear: 2026,
        name: "TZ 4000",
        organizerName: "  SINTA eSports  ",
        primarySessionLabel: "Sprint",
        secondarySessionLabel: "Final",
      })
      .mockResolvedValueOnce({
        id: CHAMPIONSHIP_ID,
        organizerName: "   ",
      });

    updateChampionshipRecordMock.mockResolvedValueOnce(makeChampionship({ organizerName: null }));

    const postResponse = await POST(new Request("http://localhost/api/v1/admin/championships", {
      method: "POST",
    }));
    const postBody = await postResponse.json();

    expect(postResponse.status).toBe(200);
    expect(createChampionshipRecordMock).toHaveBeenCalledWith(expect.objectContaining({
      organizerName: "SINTA eSports",
    }));
    expect(postBody).toEqual({
      ok: true,
      dryRun: false,
      data: {
        championship: expect.objectContaining({ organizerName: "SINTA eSports" }),
      },
      warnings: [],
    });

    const patchResponse = await PATCH(new Request("http://localhost/api/v1/admin/championships", {
      method: "PATCH",
    }));
    const patchBody = await patchResponse.json();

    expect(patchResponse.status).toBe(200);
    expect(updateChampionshipRecordMock).toHaveBeenCalledWith(CHAMPIONSHIP_ID, expect.objectContaining({
      organizerName: null,
    }));
    expect(patchBody).toEqual({
      ok: true,
      dryRun: false,
      data: {
        championship: expect.objectContaining({ organizerName: null }),
      },
      warnings: [],
    });
  });
});
