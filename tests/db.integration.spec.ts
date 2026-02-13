import { afterAll, describe, expect, it } from "vitest";
import { checkDbConnection, closeDbPool } from "@/lib/server/db";
import { readAppEnv } from "@/lib/server/env";

const runIntegrationTests = process.env.RUN_DB_INTEGRATION_TESTS === "1";
const maybeIt = runIntegrationTests ? it : it.skip;

describe("database integration", () => {
  afterAll(async () => {
    await closeDbPool();
  });

  maybeIt(
    "connects to database and runs a health query",
    { timeout: 20_000 },
    async () => {
      readAppEnv();
      const result = await checkDbConnection();

      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
      expect(result.serverTimeIso).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    },
  );
});
