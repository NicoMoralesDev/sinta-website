import { spawn } from "node:child_process";

const child = spawn(
  process.execPath,
  ["./node_modules/vitest/vitest.mjs", "run", "tests/db.integration.spec.ts"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      RUN_DB_INTEGRATION_TESTS: "1",
    },
  },
);

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
