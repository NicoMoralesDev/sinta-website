import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
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
} = vi.hoisted(() => ({
  getEventByIdMock: vi.fn(),
  listAdminDriversMock: vi.fn(),
  listEventResultsByEventIdMock: vi.fn(),
  replaceEventResultsMock: vi.fn(),
  insertAuditLogMock: vi.fn(),
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

import { updateEventResults } from "@/lib/server/admin/service";

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

describe("admin event results preserve", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getEventByIdMock.mockResolvedValue(EVENT);
    listAdminDriversMock.mockResolvedValue([DRIVER]);
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
      requestId: null,
      createdAt: "2026-01-01T00:00:00.000Z",
    });
  });

  it("preserve untouched persisted canonical rows when a save payload omits qs, qf, or p cells for a legacy event", async () => {
    listEventResultsByEventIdMock.mockResolvedValue([
      makeStoredRow({ driverId: DRIVER.id, sessionKind: "qs", position: 8, status: null, rawValue: "8", isActive: true }, 1),
      makeStoredRow({ driverId: DRIVER.id, sessionKind: "s", position: 6, status: null, rawValue: "6", isActive: true }, 2),
      makeStoredRow({ driverId: DRIVER.id, sessionKind: "qf", position: 4, status: null, rawValue: "4", isActive: true }, 3),
      makeStoredRow({ driverId: DRIVER.id, sessionKind: "f", position: 2, status: null, rawValue: "2", isActive: true }, 4),
      makeStoredRow({ driverId: DRIVER.id, sessionKind: "p", position: 0, status: null, rawValue: "18", isActive: true }, 5),
    ]);

    await updateEventResults(ACTOR, EVENT.id, {
      rows: [
        { driverId: DRIVER.id, sessionKind: "primary", position: 5, status: null, rawValue: "5", isActive: true },
        { driverId: DRIVER.id, sessionKind: "secondary", position: 1, status: null, rawValue: "1", isActive: true },
      ],
    });

    expect(replaceEventResultsMock).toHaveBeenCalledWith(EVENT.id, [
      expect.objectContaining({ sessionKind: "qs", rawValue: "8" }),
      expect.objectContaining({ sessionKind: "s", rawValue: "5" }),
      expect.objectContaining({ sessionKind: "qf", rawValue: "4" }),
      expect.objectContaining({ sessionKind: "f", rawValue: "1" }),
      expect.objectContaining({ sessionKind: "p", rawValue: "18" }),
    ]);
  });

  it("preserve legacy omissions instead of synthesizing canonical rows during replace-all save normalization", async () => {
    listEventResultsByEventIdMock.mockResolvedValue([
      makeStoredRow({ driverId: DRIVER.id, sessionKind: "s", position: 7, status: null, rawValue: "7", isActive: true }, 1),
      makeStoredRow({ driverId: DRIVER.id, sessionKind: "f", position: 3, status: null, rawValue: "3", isActive: true }, 2),
    ]);

    await updateEventResults(ACTOR, EVENT.id, {
      rows: [
        { driverId: DRIVER.id, sessionKind: "primary", position: 6, status: null, rawValue: "6", isActive: true },
        { driverId: DRIVER.id, sessionKind: "secondary", position: 2, status: null, rawValue: "2", isActive: true },
      ],
    });

    const submittedRows = replaceEventResultsMock.mock.calls.at(0)?.[1] as EventResultCellInput[];

    expect(submittedRows).toEqual([
      expect.objectContaining({ sessionKind: "s", rawValue: "6" }),
      expect.objectContaining({ sessionKind: "f", rawValue: "2" }),
    ]);
    expect(submittedRows).toHaveLength(2);
  });

  it("preserve existing canonical raw values when an admin edit changes only one field in the save-path", async () => {
    listEventResultsByEventIdMock.mockResolvedValue([
      makeStoredRow({ driverId: DRIVER.id, sessionKind: "s", position: 5, status: null, rawValue: "5", isActive: true }, 1),
      makeStoredRow({ driverId: DRIVER.id, sessionKind: "f", position: 4, status: null, rawValue: "4", isActive: true }, 2),
      makeStoredRow({ driverId: DRIVER.id, sessionKind: "p", position: 0, status: null, rawValue: "25", isActive: true }, 3),
    ]);

    await updateEventResults(ACTOR, EVENT.id, {
      rows: [
        { driverId: DRIVER.id, sessionKind: "primary", position: 5, status: null, rawValue: "5", isActive: true },
        { driverId: DRIVER.id, sessionKind: "secondary", position: 1, status: null, rawValue: "1", isActive: true },
      ],
    });

    expect(replaceEventResultsMock).toHaveBeenCalledWith(EVENT.id, [
      expect.objectContaining({ sessionKind: "s", rawValue: "5" }),
      expect.objectContaining({ sessionKind: "f", rawValue: "1" }),
      expect.objectContaining({ sessionKind: "p", rawValue: "25", position: 0 }),
    ]);
  });

  it("removes a persisted canonical row when the incoming patch is an explicit clear tombstone", async () => {
    listEventResultsByEventIdMock.mockResolvedValue([
      makeStoredRow({ driverId: DRIVER.id, sessionKind: "s", position: 5, status: null, rawValue: "5", isActive: true }, 1),
      makeStoredRow({ driverId: DRIVER.id, sessionKind: "p", position: 18, status: null, rawValue: "18", isActive: true }, 2),
    ]);

    const result = await updateEventResults(ACTOR, EVENT.id, {
      rows: [
        {
          driverId: DRIVER.id,
          sessionKind: "s",
          position: null,
          status: null,
          rawValue: "",
          isActive: false,
        },
      ],
    });

    expect(replaceEventResultsMock).toHaveBeenCalledWith(EVENT.id, [
      expect.objectContaining({ sessionKind: "p", rawValue: "18", position: 18 }),
    ]);
    expect(replaceEventResultsMock.mock.calls.at(0)?.[1]).toHaveLength(1);
    expect(result.data.rows).toEqual([
      expect.objectContaining({ sessionKind: "p", rawValue: "18", position: 18 }),
    ]);
  });
});
