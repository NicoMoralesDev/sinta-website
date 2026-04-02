import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminValidationError } from "@/lib/server/admin/errors";
import type {
  AdminActor,
  AdminDriver,
  AdminEvent,
  AdminEventResultRow,
  EventResultCellInput,
} from "@/lib/server/admin/types";

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

import { PUT as putEventResultsRoute } from "@/app/api/v1/admin/events/[id]/results/route";
import * as adminService from "@/lib/server/admin/service";

const ACTOR: AdminActor = {
  userId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  username: "owner",
  role: "owner",
  mustChangePassword: false,
};

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
