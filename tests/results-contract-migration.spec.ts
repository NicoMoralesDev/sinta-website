import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { PoolClient } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { closeDbPool, getDbPool } from "@/lib/server/db";
import { readAppEnv } from "@/lib/server/env";

const runIntegrationTests = process.env.RUN_DB_INTEGRATION_TESTS === "1";
const maybeDescribe = runIntegrationTests ? describe : describe.skip;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

async function readMigrationSql(filename: string): Promise<string> {
  const migrationPath = path.join(repoRoot, "db", "migrations", filename);
  const contents = await readFile(migrationPath, "utf8");
  return contents.replace(/^\uFEFF/, "");
}

async function applyMigration(client: PoolClient, filename: string): Promise<void> {
  await client.query(await readMigrationSql(filename));
}

function normalizeConstraintDefinition(definition: string): string {
  return definition.replaceAll('"', "").replace(/\s+/g, "").toLowerCase();
}

async function expectQueryToFail(
  client: PoolClient,
  sql: string,
  values: unknown[],
  expectedPattern: RegExp,
): Promise<void> {
  await client.query("savepoint migration_expect_failure");

  try {
    await client.query(sql, values);
    throw new Error(`Expected query to fail: ${sql}`);
  } catch (error) {
    expect(String(error)).toMatch(expectedPattern);
  } finally {
    await client.query("rollback to savepoint migration_expect_failure");
    await client.query("release savepoint migration_expect_failure");
  }
}

maybeDescribe("results contract migration", () => {
  let client: PoolClient;
  let schemaName: string;

  beforeAll(() => {
    readAppEnv();
  });

  beforeAll(async () => {
    client = await getDbPool().connect();
    schemaName = `migration_009_${Date.now()}`;

    await client.query("begin");
    await client.query(`create schema "${schemaName}"`);
    await client.query(`set local search_path to "${schemaName}", public`);
    await client.query(
      `create type "${schemaName}".result_status as enum ('DNF', 'DNQ', 'DSQ', 'ABSENT')`,
    );
    await client.query(
      `create type "${schemaName}".session_kind as enum ('primary', 'secondary')`,
    );

    await applyMigration(client, "001_results_schema.sql");
    await applyMigration(client, "004_admin_auth_softdelete_audit.sql");

    await client.query(
      `insert into championships (
        id,
        season_year,
        name,
        slug,
        primary_session_label,
        secondary_session_label,
        is_active,
        updated_at
      ) values ($1, 2026, 'Summer Cup', 'summer-cup', 'Sprint', 'Final', true, now())`,
      ["00000000-0000-0000-0000-000000000001"],
    );
    await client.query(
      `insert into events (
        id,
        championship_id,
        round_number,
        circuit_name,
        source_sheet,
        source_row,
        is_active,
        updated_at
      ) values ($1, $2, 1, 'Test Circuit', 'sheet-1', 1, true, now())`,
      [
        "00000000-0000-0000-0000-000000000010",
        "00000000-0000-0000-0000-000000000001",
      ],
    );
    await client.query(
      `insert into drivers (
        id,
        slug,
        canonical_name,
        sort_name,
        country_code,
        country_name_es,
        country_name_en,
        role_es,
        role_en,
        is_active,
        updated_at
      ) values
        ($1, 'legacy-driver-1', 'Legacy Driver 1', 'Driver 1, Legacy', 'AR', 'Argentina', 'Argentina', 'Piloto', 'Driver', true, now()),
        ($2, 'legacy-driver-2', 'Legacy Driver 2', 'Driver 2, Legacy', 'AR', 'Argentina', 'Argentina', 'Piloto', 'Driver', true, now()),
        ($3, 'points-driver', 'Points Driver', 'Driver, Points', 'AR', 'Argentina', 'Argentina', 'Piloto', 'Driver', true, now()),
        ($4, 'status-driver', 'Status Driver', 'Driver, Status', 'AR', 'Argentina', 'Argentina', 'Piloto', 'Driver', true, now())`,
      [
        "00000000-0000-0000-0000-000000000101",
        "00000000-0000-0000-0000-000000000102",
        "00000000-0000-0000-0000-000000000103",
        "00000000-0000-0000-0000-000000000104",
      ],
    );
    await client.query(
      `insert into event_results (
        event_id,
        driver_id,
        session_kind,
        position,
        status,
        raw_value,
        is_active,
        updated_at
      ) values
        ($1, $2, 'primary', 2, null, '2', true, now()),
        ($1, $3, 'secondary', 4, null, '4', true, now())`,
      [
        "00000000-0000-0000-0000-000000000010",
        "00000000-0000-0000-0000-000000000101",
        "00000000-0000-0000-0000-000000000102",
      ],
    );

    await applyMigration(client, "009_canonical_results_contract.sql");
  });

  afterAll(async () => {
    if (client) {
      await client.query("rollback");
      client.release();
    }

    await closeDbPool();
  });

  it(
    "verifies the canonical session_kind enum exposes canonical labels and remaps legacy rows",
    async () => {
      const enumResult = await client.query<{ enumlabel: string }>(
        `select e.enumlabel
         from pg_type t
         join pg_namespace n on n.oid = t.typnamespace
         join pg_enum e on e.enumtypid = t.oid
         where t.typname = 'session_kind'
           and n.nspname = current_schema()
         order by e.enumsortorder`,
      );

      expect(enumResult.rows.map((row) => row.enumlabel)).toEqual(["qs", "s", "qf", "f", "p"]);

      const remappedRows = await client.query<{ session_kind: string; raw_value: string }>(
        `select session_kind::text as session_kind, raw_value
         from event_results
         order by raw_value asc`,
      );

      expect(remappedRows.rows).toEqual([
        { session_kind: "s", raw_value: "2" },
        { session_kind: "f", raw_value: "4" },
      ]);
    },
  );

  it("verifies the applied schema accepts canonical rows, allows zero-point rows, and preserves numeric/status exclusivity", async () => {
    const constraintResult = await client.query<{ conname: string; definition: string }>(
      `select conname, pg_get_constraintdef(oid) as definition
       from pg_constraint
       where conrelid = 'event_results'::regclass
         and conname in ('event_results_position_check', 'event_results_check')
       order by conname asc`,
    );

    expect(constraintResult.rows.map((row) => row.conname)).toEqual([
      "event_results_check",
      "event_results_position_check",
    ]);

    const exclusivityConstraint = normalizeConstraintDefinition(
      constraintResult.rows[0]?.definition ?? "",
    );
    const pointsConstraint = normalizeConstraintDefinition(
      constraintResult.rows[1]?.definition ?? "",
    );

    expect(exclusivityConstraint).toContain("(positionisnotnull)and(statusisnull)");
    expect(exclusivityConstraint).toContain("(positionisnull)and(statusisnotnull)");
    expect(pointsConstraint).toContain("positionisnull");
    expect(pointsConstraint).toContain("position>0");
    expect(pointsConstraint).toContain("position=0");
    expect(pointsConstraint).toMatch(/session_kind=.*'p'/);

    await client.query(
      `insert into event_results (
        event_id,
        driver_id,
        session_kind,
        position,
        status,
        raw_value,
        is_active,
        updated_at
      ) values ($1, $2, 'p', 0, null, '0', true, now())`,
      [
        "00000000-0000-0000-0000-000000000010",
        "00000000-0000-0000-0000-000000000103",
      ],
    );

    await client.query(
      `insert into event_results (
        event_id,
        driver_id,
        session_kind,
        position,
        status,
        raw_value,
        is_active,
        updated_at
      ) values
        ($1, $2, 'qs', 1, null, '1', true, now()),
        ($1, $3, 'qf', 3, null, '3', true, now())`,
      [
        "00000000-0000-0000-0000-000000000010",
        "00000000-0000-0000-0000-000000000104",
        "00000000-0000-0000-0000-000000000101",
      ],
    );

    const canonicalRows = await client.query<{ session_kind: string; position: number | null }>(
      `select session_kind::text as session_kind, position
       from event_results
       where session_kind in ('qs', 'qf', 'p')
       order by session_kind asc`,
    );

    expect(canonicalRows.rows).toEqual([
      { session_kind: "p", position: 0 },
      { session_kind: "qf", position: 3 },
      { session_kind: "qs", position: 1 },
    ]);

    await expectQueryToFail(
      client,
      `insert into event_results (
        event_id,
        driver_id,
        session_kind,
        position,
        status,
        raw_value,
        is_active,
        updated_at
      ) values ($1, $2, 's', 0, null, '0', true, now())`,
      [
        "00000000-0000-0000-0000-000000000010",
        "00000000-0000-0000-0000-000000000104",
      ],
      /event_results_position_check/,
    );

    await expectQueryToFail(
      client,
      `insert into event_results (
        event_id,
        driver_id,
        session_kind,
        position,
        status,
        raw_value,
        is_active,
        updated_at
      ) values ($1, $2, 'qf', 7, 'DNF', 'DNF', true, now())`,
      [
        "00000000-0000-0000-0000-000000000010",
        "00000000-0000-0000-0000-000000000104",
      ],
      /event_results_check/,
    );
  });

  it("verifies championships exposes a nullable organizer_name column", async () => {
    const columnResult = await client.query<{
      column_name: string;
      is_nullable: "YES" | "NO";
      data_type: string;
    }>(
      `select column_name, is_nullable, data_type
       from information_schema.columns
       where table_schema = current_schema()
         and table_name = 'championships'
         and column_name = 'organizer_name'`,
    );

    expect(columnResult.rows).toEqual([
      {
        column_name: "organizer_name",
        is_nullable: "YES",
        data_type: "text",
      },
    ]);
  });
});
