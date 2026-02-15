import { Pool, type QueryResult } from "pg";
import { readAppEnv } from "./env.ts";

type HealthRow = {
  server_time: Date;
};

let pool: Pool | null = null;

function readPositiveIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export function getDbPool(): Pool {
  if (pool) {
    return pool;
  }

  const { DATABASE_URL } = readAppEnv();
  const isProduction = process.env.NODE_ENV === "production";
  const poolMax = readPositiveIntEnv("DB_POOL_MAX", isProduction ? 1 : 4);
  const idleTimeoutMillis = readPositiveIntEnv("DB_POOL_IDLE_TIMEOUT_MS", 5_000);
  const connectionTimeoutMillis = readPositiveIntEnv("DB_POOL_CONNECTION_TIMEOUT_MS", 10_000);

  pool = new Pool({
    connectionString: DATABASE_URL,
    max: poolMax,
    idleTimeoutMillis,
    connectionTimeoutMillis,
    allowExitOnIdle: true,
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
