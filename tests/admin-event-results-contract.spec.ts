import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminValidationError } from "@/lib/server/admin/errors";
import type {
  AdminDriver,
  AdminEvent,
  AdminEventResultRow,
  EventResultCellInput,
} from "@/lib/server/admin/types";

const queryMock = vi.fn();

vi.mock("@/lib/server/db", () => ({
  getDbPool: () => ({
    query: queryMock,
  }),
}));

const {
  getEventByIdMock,
  listAdminDriversMock,
  listEventResultsByEventIdMock,
  replaceEventResultsMock,
  insertAuditLogMock,
  parseAdminJsonBodyMock,
  readRequestIdMock,
  requireAdminActorMock,
} = vi.hoisted(() => ({
  getEventByIdMock: vi.fn(),
  listAdminDriversMock: vi.fn(),
  listEventResultsByEventIdMock: vi.fn(),
  replaceEventResultsMock: vi.fn(),
  insertAuditLogMock: vi.fn(),
  parseAdminJsonBodyMock: vi.fn(),
  readRequestIdMock: vi.fn(),
  requireAdminActorMock: vi.fn(),
}));

vi.mock("@/lib/server/admin/repository", async () => {
  const actual = await vi.importActual<typeof import("@/lib/server/admin/repository")>(
    "@/lib/server/admin/repository",
  );

  return {
    ...actual,
    getEventById: getEventByIdMock,
    listAdminDrivers: listAdminDriversMock,
    listEventResultsByEventId: listEventResultsByEventIdMock,
    replaceEventResults: replaceEventResultsMock,
    insertAuditLog: insertAuditLogMock,
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

import { GET as getEventResultsRoute, PUT as putEventResultsRoute } from "@/app/api/v1/admin/events/[id]/results/route";
import * as adminService from "@/lib/server/admin/service";

const ACTOR = {
  userId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  username: "owner",
  role: "owner",
  mustChangePassword: false,
} as const;

const DRIVER: AdminDriver = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "driver-one",
  canonicalName: "Driver One",
  sortName: "One, Driver",
  countryCode: "ar",
  countryNameEs: "Argentina",
  countryNameEn: "Argentina",
  roleEs: "Piloto",
  roleEn: "Driver",
  isActive: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const EVENT: AdminEvent = {
  id: "22222222-2222-4222-8222-222222222222",
  championshipId: "33333333-3333-4333-8333-333333333333",
  championshipName: "TZ 4000",
  championshipSlug: "tz-4000",
  seasonYear: 2026,
  roundNumber: 1,
  circuitName: "Interlagos",
  eventDate: "2026-03-01",
  streamVideoId: null,
  streamStartAt: null,
  streamEndAt: null,
  streamOverrideMode: "auto",
  isActive: true,
  sourceSheet: "results",
  sourceRow: 2,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

function makeStoredRow(row: EventResultCellInput, index: number): AdminEventResultRow {
  return {
    id: `result-${index}`,
    eventId: EVENT.id,
    driverId: row.driverId,
    driverSlug: DRIVER.slug,
    driverName: DRIVER.canonicalName,
    sessionKind: row.sessionKind,
    position: row.position,
    status: row.status,
    rawValue: row.rawValue,
    isActive: row.isActive,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("admin event results contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryMock.mockReset();

    getEventByIdMock.mockResolvedValue(EVENT);
    listAdminDriversMock.mockResolvedValue([DRIVER]);
    listEventResultsByEventIdMock.mockResolvedValue([]);
    replaceEventResultsMock.mockImplementation(async (_eventId: string, rows: EventResultCellInput[]) =>
      rows.map((row, index) => makeStoredRow(row, index)),
    );
    insertAuditLogMock.mockResolvedValue({
      id: "audit-1",
      actorUserId: ACTOR.userId,
      actorUsername: ACTOR.username,
      entityType: "event_results",
      entityId: EVENT.id,
      action: "replace",
      before: {},
      after: {},
      requestId: "req-1",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
    parseAdminJsonBodyMock.mockResolvedValue({ rows: [] });
    readRequestIdMock.mockReturnValue("req-1");
    requireAdminActorMock.mockResolvedValue({ actor: ACTOR });
  });

  it("returns canonical field metadata and per-driver canonical result maps from the admin GET contract", async () => {
    queryMock
      .mockResolvedValueOnce({
        rows: [
          {
            id: EVENT.id,
            championship_id: EVENT.championshipId,
            championship_name: EVENT.championshipName,
            championship_slug: EVENT.championshipSlug,
            season_year: EVENT.seasonYear,
            round_number: EVENT.roundNumber,
            circuit_name: EVENT.circuitName,
            event_date: EVENT.eventDate,
            stream_video_id: EVENT.streamVideoId,
            stream_start_at: EVENT.streamStartAt,
            stream_end_at: EVENT.streamEndAt,
            stream_override_mode: EVENT.streamOverrideMode,
            is_active: EVENT.isActive,
            source_sheet: EVENT.sourceSheet,
            source_row: EVENT.sourceRow,
            created_at: EVENT.createdAt,
            updated_at: EVENT.updatedAt,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: EVENT.championshipId,
            season_year: EVENT.seasonYear,
            name: EVENT.championshipName,
            slug: EVENT.championshipSlug,
            organizer_name: null,
            primary_session_label: "Sprint",
            secondary_session_label: "Final",
            is_active: true,
            created_at: "2026-01-01T00:00:00.000Z",
            updated_at: "2026-01-01T00:00:00.000Z",
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: DRIVER.id,
            slug: DRIVER.slug,
            canonical_name: DRIVER.canonicalName,
            sort_name: DRIVER.sortName,
            country_code: DRIVER.countryCode,
            country_name_es: DRIVER.countryNameEs,
            country_name_en: DRIVER.countryNameEn,
            role_es: DRIVER.roleEs,
            role_en: DRIVER.roleEn,
            is_active: DRIVER.isActive,
            created_at: DRIVER.createdAt,
            updated_at: DRIVER.updatedAt,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            id: "result-1",
            event_id: EVENT.id,
            driver_id: DRIVER.id,
            driver_slug: DRIVER.slug,
            driver_name: DRIVER.canonicalName,
            session_kind: "qs",
            position: 4,
            status: null,
            raw_value: "4",
            is_active: true,
            created_at: "2026-01-01T00:00:00.000Z",
            updated_at: "2026-01-01T00:00:00.000Z",
          },
          {
            id: "result-2",
            event_id: EVENT.id,
            driver_id: DRIVER.id,
            driver_slug: DRIVER.slug,
            driver_name: DRIVER.canonicalName,
            session_kind: "s",
            position: 2,
            status: null,
            raw_value: "2",
            is_active: true,
            created_at: "2026-01-01T00:00:00.000Z",
            updated_at: "2026-01-01T00:00:00.000Z",
          },
          {
            id: "result-3",
            event_id: EVENT.id,
            driver_id: DRIVER.id,
            driver_slug: DRIVER.slug,
            driver_name: DRIVER.canonicalName,
            session_kind: "p",
            position: 18,
            status: null,
            raw_value: "18",
            is_active: true,
            created_at: "2026-01-01T00:00:00.000Z",
            updated_at: "2026-01-01T00:00:00.000Z",
          },
        ],
      });

    const response = await getEventResultsRoute(new Request("http://localhost/api/v1/admin/events/results"), {
      params: Promise.resolve({ id: EVENT.id }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      grid: {
        event: expect.objectContaining({ id: EVENT.id }),
        fieldOrder: ["qs", "s", "qf", "f", "p"],
        fieldLabels: {
          qs: "Qualy Sprint",
          s: "Sprint",
          qf: "Qualy Final",
          f: "Final",
          p: "Puntos",
        },
        drivers: [
          {
            driverId: DRIVER.id,
            driverSlug: DRIVER.slug,
            driverName: DRIVER.canonicalName,
            results: {
              qs: { position: 4, status: null, rawValue: "4", isActive: true },
              s: { position: 2, status: null, rawValue: "2", isActive: true },
              p: { position: 18, status: null, rawValue: "18", isActive: true },
            },
          },
        ],
      },
    });
  });

  it("normalizes legacy primary and secondary payload rows into the canonical field contract before validation", async () => {
    const result = await adminService.updateEventResults(
      ACTOR,
      EVENT.id,
      {
        rows: [
          {
            driverId: DRIVER.id,
            sessionKind: "primary",
            position: 2,
            status: null,
            rawValue: "2",
            isActive: true,
          },
          {
            driverId: DRIVER.id,
            sessionKind: "secondary",
            position: 1,
            status: null,
            rawValue: "1",
            isActive: true,
          },
        ],
      },
      { requestId: "req-1" },
    );

    expect(replaceEventResultsMock).toHaveBeenCalledWith(EVENT.id, [
      expect.objectContaining({ driverId: DRIVER.id, sessionKind: "s" }),
      expect.objectContaining({ driverId: DRIVER.id, sessionKind: "f" }),
    ]);
    expect(result.data.rows).toEqual([
      expect.objectContaining({ driverId: DRIVER.id, sessionKind: "s" }),
      expect.objectContaining({ driverId: DRIVER.id, sessionKind: "f" }),
    ]);
  });

  it("rejects duplicate canonical rows once s, f, qs, qf, and p inputs are normalized", async () => {
    await expect(
      adminService.updateEventResults(
        ACTOR,
        EVENT.id,
        {
          rows: [
            {
              driverId: DRIVER.id,
              sessionKind: "primary",
              position: 3,
              status: null,
              rawValue: "3",
              isActive: true,
            },
            {
              driverId: DRIVER.id,
              sessionKind: "s",
              position: 2,
              status: null,
              rawValue: "2",
              isActive: true,
            },
          ],
        },
      ),
    ).rejects.toThrow(AdminValidationError);

    expect(replaceEventResultsMock).not.toHaveBeenCalled();
  });

  it("rejects points rows that use status tokens instead of integer values", async () => {
    await expect(
      adminService.updateEventResults(
        ACTOR,
        EVENT.id,
        {
          rows: [
            {
              driverId: DRIVER.id,
              sessionKind: "p",
              position: null,
              status: "DNF",
              rawValue: "DNF",
              isActive: true,
            },
          ],
        },
      ),
    ).rejects.toThrow(AdminValidationError);

    expect(replaceEventResultsMock).not.toHaveBeenCalled();
  });

  it("rejects points rows that are negative or non-integer", async () => {
    await expect(
      adminService.updateEventResults(
        ACTOR,
        EVENT.id,
        {
          rows: [
            {
              driverId: DRIVER.id,
              sessionKind: "p",
              position: -1,
              status: null,
              rawValue: "-1",
              isActive: true,
            },
          ],
        },
      ),
    ).rejects.toThrow(AdminValidationError);

    await expect(
      adminService.updateEventResults(
        ACTOR,
        EVENT.id,
        {
          rows: [
            {
              driverId: DRIVER.id,
              sessionKind: "p",
              position: 2.5,
              status: null,
              rawValue: "2.5",
              isActive: true,
            },
          ],
        },
      ),
    ).rejects.toThrow(AdminValidationError);

    expect(replaceEventResultsMock).not.toHaveBeenCalled();
  });

  it("accepts explicit clear tombstones through the admin results route adapter", async () => {
    const updateEventResultsSpy = vi.spyOn(adminService, "updateEventResults").mockResolvedValueOnce({
      ok: true,
      dryRun: false,
      data: {
        rows: [],
      },
      warnings: [],
    });

    parseAdminJsonBodyMock.mockResolvedValueOnce({
      rows: [
        {
          driverId: DRIVER.id,
          sessionKind: "qf",
          position: null,
          status: null,
          rawValue: "",
          isActive: false,
        },
      ],
    });

    const response = await putEventResultsRoute(new Request("http://localhost/api/v1/admin/events/results", {
      method: "PUT",
    }), {
      params: Promise.resolve({ id: EVENT.id }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(updateEventResultsSpy).toHaveBeenCalledWith(ACTOR, EVENT.id, {
      rows: [
        {
          driverId: DRIVER.id,
          sessionKind: "qf",
          position: null,
          status: null,
          rawValue: "",
          isActive: false,
        },
      ],
    }, {
      requestId: "req-1",
    });
    expect(body).toEqual({
      ok: true,
      dryRun: false,
      data: {
        rows: [],
      },
      warnings: [],
    });
  });

  it("accepts canonical qs, s, qf, f, and p raw values through updateEventResults and the admin results route adapter", async () => {
    const updateEventResultsSpy = vi.spyOn(adminService, "updateEventResults").mockResolvedValueOnce({
      ok: true,
      dryRun: false,
      data: {
        rows: [
          { driverId: DRIVER.id, sessionKind: "qs", position: 4, status: null, rawValue: "4", isActive: true },
          { driverId: DRIVER.id, sessionKind: "s", position: 3, status: null, rawValue: "3", isActive: true },
          { driverId: DRIVER.id, sessionKind: "qf", position: 2, status: null, rawValue: "2", isActive: true },
          { driverId: DRIVER.id, sessionKind: "f", position: 1, status: null, rawValue: "1", isActive: true },
          { driverId: DRIVER.id, sessionKind: "p", position: 0, status: null, rawValue: "25", isActive: true },
        ],
      },
      warnings: [],
    });

    parseAdminJsonBodyMock.mockResolvedValueOnce({
      rows: [
        { driverId: DRIVER.id, sessionKind: "qs", position: 4, status: null, rawValue: "4", isActive: true },
        { driverId: DRIVER.id, sessionKind: "s", position: 3, status: null, rawValue: "3", isActive: true },
        { driverId: DRIVER.id, sessionKind: "qf", position: 2, status: null, rawValue: "2", isActive: true },
        { driverId: DRIVER.id, sessionKind: "f", position: 1, status: null, rawValue: "1", isActive: true },
        { driverId: DRIVER.id, sessionKind: "p", position: 0, status: null, rawValue: "25", isActive: true },
      ],
    });

    const response = await putEventResultsRoute(new Request("http://localhost/api/v1/admin/events/results", {
      method: "PUT",
    }), {
      params: Promise.resolve({ id: EVENT.id }),
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(updateEventResultsSpy).toHaveBeenCalledWith(ACTOR, EVENT.id, {
      rows: [
        { driverId: DRIVER.id, sessionKind: "qs", position: 4, status: null, rawValue: "4", isActive: true },
        { driverId: DRIVER.id, sessionKind: "s", position: 3, status: null, rawValue: "3", isActive: true },
        { driverId: DRIVER.id, sessionKind: "qf", position: 2, status: null, rawValue: "2", isActive: true },
        { driverId: DRIVER.id, sessionKind: "f", position: 1, status: null, rawValue: "1", isActive: true },
        { driverId: DRIVER.id, sessionKind: "p", position: 0, status: null, rawValue: "25", isActive: true },
      ],
    }, {
      requestId: "req-1",
    });
    expect(body).toEqual({
      ok: true,
      dryRun: false,
      data: {
        rows: [
          expect.objectContaining({ sessionKind: "qs" }),
          expect.objectContaining({ sessionKind: "s" }),
          expect.objectContaining({ sessionKind: "qf" }),
          expect.objectContaining({ sessionKind: "f" }),
          expect.objectContaining({ sessionKind: "p", position: 0 }),
        ],
      },
      warnings: [],
    });
  });
});
