import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { parseHistoryWorkbookFromBuffer } from "@/lib/server/history/parser";

describe("history parser", () => {
  it("extracts normalized event and result rows from workbook", () => {
    const workbookPath = resolve(process.cwd(), "data-source/Historia The New Project.xlsx");
    const workbook = readFileSync(workbookPath);

    const parsed = parseHistoryWorkbookFromBuffer(workbook);

    expect(parsed.sourceSheet).toBe("Estadisticas");
    expect(parsed.events.length).toBe(89);
    expect(parsed.results.length).toBe(504);

    const years = new Set(parsed.events.map((event) => event.seasonYear));
    expect(Array.from(years).sort()).toEqual([2022, 2023, 2024, 2025, 2026]);

    const statuses = new Set(
      parsed.results
        .map((result) => result.status)
        .filter((value): value is NonNullable<typeof value> => value !== null),
    );

    expect(statuses.has("DNF")).toBe(true);
    expect(statuses.has("DNQ")).toBe(true);
    expect(statuses.has("DSQ")).toBe(true);
    expect(statuses.has("ABSENT")).toBe(true);
  });
});

