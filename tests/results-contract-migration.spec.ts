import { afterAll, beforeAll, describe, it } from "vitest";

import { closeDbPool } from "@/lib/server/db";
import { readAppEnv } from "@/lib/server/env";

const runIntegrationTests = process.env.RUN_DB_INTEGRATION_TESTS === "1";
const maybeDescribe = runIntegrationTests ? describe : describe.skip;

maybeDescribe("results contract migration", () => {
  beforeAll(() => {
    readAppEnv();
  });

  afterAll(async () => {
    await closeDbPool();
  });

  it.todo(
    "verifies the canonical session_kind enum accepts qs, s, qf, and f without preserving legacy primary or secondary labels",
  );

  it.todo(
    "verifies the canonical points column uses a points-safe numeric constraint for p values and keeps legacy rows nullable",
  );

  it.todo("verifies championships exposes a nullable organizer_name column for later organizer metadata work");
});
