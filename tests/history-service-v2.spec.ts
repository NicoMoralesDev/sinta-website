import { describe, expect, it } from "vitest";

import { HistoryValidationError } from "@/lib/server/history/errors";
import {
  getCurrentChampionship,
  getResultsEventParticipation,
  getResultsOverview,
} from "@/lib/server/history/service";

describe("history service v2 query parsing", () => {
  it("rejects invalid overview year", async () => {
    await expect(getResultsOverview(new URLSearchParams("year=foo"))).rejects.toBeInstanceOf(
      HistoryValidationError,
    );
  });

  it("rejects invalid current limit", async () => {
    await expect(getCurrentChampionship(new URLSearchParams("limit=500"))).rejects.toBeInstanceOf(
      HistoryValidationError,
    );
  });

  it("rejects invalid cursor for participation queries", async () => {
    await expect(
      getResultsEventParticipation(new URLSearchParams("cursor=invalid-base64")),
    ).rejects.toBeInstanceOf(HistoryValidationError);
  });
});
