import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { AdminEventResultsGrid } from "@/lib/server/admin/types";
import {
  EventResultsEditorPanel,
  createEditableResultRows,
  getInvalidResultCellKeys,
  getResultFieldLabel,
  parseResultInput,
  serializeDirtyResultCells,
} from "@/app/admin/_components/events-manager";

function makeGrid(): AdminEventResultsGrid {
  return {
    event: {
      id: "event-1",
      championshipId: "champ-1",
      championshipName: "TZ 4000",
      championshipSlug: "tz-4000",
      seasonYear: 2026,
      roundNumber: 3,
      circuitName: "Interlagos",
      eventDate: "2026-03-01",
      streamVideoId: null,
      streamStartAt: null,
      streamEndAt: null,
      streamOverrideMode: "auto",
      isActive: true,
      sourceSheet: "admin",
      sourceRow: 1,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    fieldOrder: ["qs", "s", "qf", "f", "p"],
    fieldLabels: {
      qs: "Qualy Sprint",
      s: "Sprint",
      qf: "Qualy Final",
      f: "Final",
      p: "Points",
    },
    drivers: [
      {
        driverId: "driver-1",
        driverSlug: "driver-one",
        driverName: "Driver One",
        results: {
          qs: { position: 4, status: null, rawValue: "4", isActive: true },
          s: { position: null, status: "DNF", rawValue: "DNF", isActive: true },
          f: { position: 1, status: null, rawValue: "1", isActive: true },
          p: { position: 18, status: null, rawValue: "18", isActive: true },
        },
      },
    ],
  };
}

describe("admin events manager flow", () => {
  it("renders canonical labels, helper copy, compact fallbacks, and invalid cells inline", () => {
    const grid = makeGrid();
    const rows = createEditableResultRows(grid);
    rows[0].values.p = "DNF";

    const html = renderToStaticMarkup(
      createElement(EventResultsEditorPanel, {
        event: grid.event,
        grid,
        rows,
        invalidCellKeys: getInvalidResultCellKeys(rows, grid.fieldOrder),
        isSaving: false,
        onCellChange: () => undefined,
        onSave: () => undefined,
      }),
    );

    expect(html).toContain("Qualy Sprint");
    expect(html).toContain("Sprint");
    expect(html).toContain("Qualy Final");
    expect(html).toContain("Final");
    expect(html).toContain("Points");
    expect(html).toContain(">QS<");
    expect(html).toContain(">S<");
    expect(html).toContain(">QF<");
    expect(html).toContain(">F<");
    expect(html).toContain(">P<");
    expect(html).toContain("Race fields accept positive integers or DNF / DNQ / DSQ / ABSENT.");
    expect(html).toContain("Points accepts whole numbers &gt;= 0.");
    expect(html).toContain('aria-invalid="true"');
  });

  it("selects friendly and compact labels from the canonical field contract", () => {
    const { fieldLabels } = makeGrid();

    expect(getResultFieldLabel("qs", fieldLabels, false)).toBe("Qualy Sprint");
    expect(getResultFieldLabel("qs", fieldLabels, true)).toBe("QS");
    expect(getResultFieldLabel("p", fieldLabels, true)).toBe("P");
  });

  it("parses race and points inputs with distinct rules", () => {
    expect(parseResultInput("s", "DNF")).toEqual({
      kind: "value",
      value: { position: null, status: "DNF", rawValue: "DNF" },
    });
    expect(parseResultInput("s", "0")).toEqual({ kind: "invalid" });
    expect(parseResultInput("p", "0")).toEqual({
      kind: "value",
      value: { position: 0, status: null, rawValue: "0" },
    });
    expect(parseResultInput("p", "DNF")).toEqual({ kind: "invalid" });
  });

  it("serializes only dirty cells and emits explicit clear tombstones", () => {
    const grid = makeGrid();
    const rows = createEditableResultRows(grid);

    rows[0].values.f = "";
    rows[0].values.p = "21";

    expect(serializeDirtyResultCells(rows, grid.fieldOrder)).toEqual([
      {
        driverId: "driver-1",
        sessionKind: "f",
        position: null,
        status: null,
        rawValue: "",
        isActive: false,
      },
      {
        driverId: "driver-1",
        sessionKind: "p",
        position: 21,
        status: null,
        rawValue: "21",
        isActive: true,
      },
    ]);
  });
});
