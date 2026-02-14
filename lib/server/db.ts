import { Pool, type QueryResult } from "pg";
import { readAppEnv } from "./env.ts";

type HealthRow = {
  server_time: Date;
};

let pool: Pool | null = null;

export function getDbPool(): Pool {
  if (pool) {
    return pool;
  }

  const { DATABASE_URL } = readAppEnv();

  pool = new Pool({
    connectionString: DATABASE_URL,
    max: 4,
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 10_000,
    ssl: { rejectUnauthorized: false },
  });

  return pool;
}

export async function closeDbPool(): Promise<void> {
  if (!pool) {
    return;
  }

  const current = pool;
  pool = null;
  await current.end();
}

export async function checkDbConnection(): Promise<{
  latencyMs: number;
  serverTimeIso: string;
}> {
  const startedAt = performance.now();
  const connection = getDbPool();
  const result: QueryResult<HealthRow> = await connection.query(
    "select now() as server_time",
  );
  const latencyMs = Math.round(performance.now() - startedAt);

  const row = result.rows.at(0);
  if (!row) {
    throw new Error("Database health query returned no rows.");
  }

  return {
    latencyMs,
    serverTimeIso: row.server_time.toISOString(),
  };
}
