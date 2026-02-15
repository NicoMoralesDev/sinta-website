import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import type { PoolClient } from "pg";

import { closeDbPool, getDbPool } from "../lib/server/db.ts";
import {
  normalizeAlias,
  parseHistoryWorkbookFromBuffer,
} from "../lib/server/history/parser.ts";
import { DRIVER_SEEDS } from "../lib/server/history/seeds.ts";
import type { ParsedRaceEvent, ParsedRaceResult } from "../lib/server/history/types.ts";

type CliOptions = {
  apply: boolean;
  filePath: string;
  debug: boolean;
};

type ImportContext = {
  championshipIds: Map<string, string>;
  eventIds: Map<string, string>;
  aliasToDriverId: Map<string, string>;
};

type ImportSummary = {
  sourceFile: string;
  sourceSha256: string;
  mode: "dry-run" | "apply";
  events: number;
  results: number;
  championships: number;
  warnings: number;
  unknownAliases: string[];
};

type DebugFn = (message: string) => void;

function createDebugLogger(enabled: boolean): DebugFn {
  if (!enabled) {
    return () => {};
  }

  return (message: string) => {
    console.log(`[debug ${new Date().toISOString()}] ${message}`);
  };
}

async function withDebugTiming<T>(
  debug: DebugFn,
  label: string,
  action: () => Promise<T>,
): Promise<T> {
  const startedAt = Date.now();
  debug(`start ${label}`);

  try {
    const result = await action();
    debug(`done ${label} (${Date.now() - startedAt}ms)`);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    debug(`error ${label} (${Date.now() - startedAt}ms): ${message}`);
    throw error;
  }
}

function printUsage(): void {
  console.log(
    [
      "Usage: npm run import:results -- [--apply] [--file data-source/Historia The New Project.xlsx]",
      "",
      "Options:",
      "  --apply       Persist to database (default is dry-run).",
      "  --file <path> Workbook path (.xlsx).",
      "  --debug       Print stage-level debug logs and timings.",
    ].join("\n"),
  );
}

function parseCliArgs(argv: string[]): CliOptions {
  let apply = false;
  let filePath = "data-source/Historia The New Project.xlsx";
  let debug = false;

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];

    if (!current) {
      continue;
    }

    if (current === "--help" || current === "-h") {
      printUsage();
      process.exit(0);
    }

    if (current === "--apply") {
      apply = true;
      continue;
    }

    if (current === "--dry-run") {
      apply = false;
      continue;
    }

    if (current === "--file") {
      const next = argv[index + 1];
      if (!next) {
        throw new Error("--file requires a value.");
      }

      filePath = next;
      index += 1;
      continue;
    }

    if (current === "--debug") {
      debug = true;
      continue;
    }

    throw new Error(`Unknown argument: ${current}`);
  }

  return {
    apply,
    filePath,
    debug,
  };
}

function toEventKey(event: ParsedRaceEvent): string {
  return `${event.seasonYear}:${event.championshipSlug}:${event.sourceRow}`;
}

function toResultEventKey(result: ParsedRaceResult): string {
  return `${result.seasonYear}:${result.championshipSlug}:${result.sourceRow}`;
}

function toChampionshipKey(seasonYear: number, championshipSlug: string): string {
  return `${seasonYear}:${championshipSlug}`;
}

function findUnknownAliases(results: ParsedRaceResult[]): string[] {
  const knownAliases = new Set<string>();
  for (const seed of DRIVER_SEEDS) {
    for (const alias of seed.aliases) {
      knownAliases.add(normalizeAlias(alias));
    }
  }

  const unknown = new Set<string>();

  for (const result of results) {
    const normalized = normalizeAlias(result.driverAlias);
    if (!knownAliases.has(normalized)) {
      unknown.add(result.driverAlias);
    }
  }

  return Array.from(unknown).sort((left, right) => left.localeCompare(right));
}

async function seedDriversAndAliases(client: PoolClient): Promise<void> {
  for (const seed of DRIVER_SEEDS) {
    await client.query(
      `
        insert into drivers (
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
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, true, now())
        on conflict (slug)
        do update set
          canonical_name = excluded.canonical_name,
          sort_name = excluded.sort_name,
          country_code = excluded.country_code,
          country_name_es = excluded.country_name_es,
          country_name_en = excluded.country_name_en,
          role_es = excluded.role_es,
          role_en = excluded.role_en,
          is_active = true,
          updated_at = now()
      `,
      [
        seed.slug,
        seed.canonicalName,
        seed.sortName,
        seed.countryCode,
        seed.countryNameEs,
        seed.countryNameEn,
        seed.roleEs,
        seed.roleEn,
      ],
    );

    for (const alias of seed.aliases) {
      const aliasNormalized = normalizeAlias(alias);

      await client.query(
        `
          insert into driver_aliases (driver_id, alias_original, alias_normalized)
          values ((select id from drivers where slug = $1), $2, $3)
          on conflict (alias_normalized)
          do update set
            driver_id = excluded.driver_id,
            alias_original = excluded.alias_original
        `,
        [seed.slug, alias, aliasNormalized],
      );
    }
  }
}

async function loadAliasToDriverIdMap(client: PoolClient): Promise<Map<string, string>> {
  const aliasResult = await client.query<{
    alias_normalized: string;
    driver_id: string;
  }>("select alias_normalized, driver_id from driver_aliases");

  const map = new Map<string, string>();
  for (const row of aliasResult.rows) {
    map.set(row.alias_normalized, row.driver_id);
  }

  return map;
}

async function upsertChampionships(
  client: PoolClient,
  events: ParsedRaceEvent[],
): Promise<Map<string, string>> {
  const uniqueChampionships = new Map<string, { seasonYear: number; name: string; slug: string }>();

  for (const event of events) {
    const key = toChampionshipKey(event.seasonYear, event.championshipSlug);
    uniqueChampionships.set(key, {
      seasonYear: event.seasonYear,
      name: event.championshipName,
      slug: event.championshipSlug,
    });
  }

  for (const championship of uniqueChampionships.values()) {
    await client.query(
      `
        insert into championships (
          season_year,
          name,
          slug,
          primary_session_label,
          secondary_session_label
        )
        values ($1, $2, $3, 'Sprint', 'Final')
        on conflict (season_year, slug)
        do update set
          name = excluded.name
      `,
      [championship.seasonYear, championship.name, championship.slug],
    );
  }

  const rows = await client.query<{
    id: string;
    season_year: number;
    slug: string;
  }>("select id, season_year, slug from championships");

  const ids = new Map<string, string>();
  for (const row of rows.rows) {
    ids.set(toChampionshipKey(row.season_year, row.slug), row.id);
  }

  return ids;
}

async function upsertEvents(
  client: PoolClient,
  events: ParsedRaceEvent[],
  championshipIds: Map<string, string>,
): Promise<Map<string, string>> {
  const eventIds = new Map<string, string>();

  for (const event of events) {
    const championshipId = championshipIds.get(
      toChampionshipKey(event.seasonYear, event.championshipSlug),
    );

    if (!championshipId) {
      throw new Error(
        `Missing championship id for ${event.seasonYear}/${event.championshipSlug}.`,
      );
    }

    const result = await client.query<{ id: string }>(
      `
        insert into events (
          championship_id,
          round_number,
          circuit_name,
          source_sheet,
          source_row
        )
        values ($1, $2, $3, $4, $5)
        on conflict (championship_id, source_row)
        do update set
          round_number = excluded.round_number,
          circuit_name = excluded.circuit_name,
          source_sheet = excluded.source_sheet
        returning id
      `,
      [
        championshipId,
        event.roundNumber,
        event.circuitName,
        event.sourceSheet,
        event.sourceRow,
      ],
    );

    const eventId = result.rows.at(0)?.id;
    if (!eventId) {
      throw new Error(`Failed to upsert event at row ${event.sourceRow}.`);
    }

    eventIds.set(toEventKey(event), eventId);
  }

  return eventIds;
}

async function upsertResults(
  client: PoolClient,
  results: ParsedRaceResult[],
  context: ImportContext,
  debug: DebugFn,
): Promise<void> {
  for (let index = 0; index < results.length; index += 1) {
    const result = results[index];
    if (!result) {
      continue;
    }

    const aliasNormalized = normalizeAlias(result.driverAlias);
    const driverId = context.aliasToDriverId.get(aliasNormalized);

    if (!driverId) {
      throw new Error(`Missing alias mapping for ${result.driverAlias}.`);
    }

    const eventId = context.eventIds.get(toResultEventKey(result));
    if (!eventId) {
      throw new Error(`Missing event for result at row ${result.sourceRow}.`);
    }

    await client.query(
      `
        insert into event_results (
          event_id,
          driver_id,
          session_kind,
          position,
          status,
          raw_value
        )
        values ($1, $2, $3::session_kind, $4, $5::result_status, $6)
        on conflict (event_id, driver_id, session_kind)
        do update set
          position = excluded.position,
          status = excluded.status,
          raw_value = excluded.raw_value
      `,
      [
        eventId,
        driverId,
        result.sessionKind,
        result.position,
        result.status,
        result.rawValue,
      ],
    );

    if ((index + 1) % 100 === 0 || index + 1 === results.length) {
      debug(`upserted results ${index + 1}/${results.length}`);
    }
  }
}

async function insertImportRun(client: PoolClient, summary: ImportSummary, warnings: string[]): Promise<void> {
  await client.query(
    `
      insert into import_runs (
        source_filename,
        source_sha256,
        mode,
        summary_json,
        warnings_json
      )
      values ($1, $2, $3, $4::jsonb, $5::jsonb)
    `,
    [
      summary.sourceFile,
      summary.sourceSha256,
      summary.mode,
      JSON.stringify({
        events: summary.events,
        results: summary.results,
        championships: summary.championships,
        warnings: summary.warnings,
        unknownAliases: summary.unknownAliases,
      }),
      JSON.stringify(warnings),
    ],
  );
}

function computeSha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

function createSummary(options: {
  sourceFile: string;
  sourceSha256: string;
  mode: "dry-run" | "apply";
  events: ParsedRaceEvent[];
  results: ParsedRaceResult[];
  warnings: string[];
  unknownAliases: string[];
}): ImportSummary {
  const championshipKeys = new Set(
    options.events.map((event) => toChampionshipKey(event.seasonYear, event.championshipSlug)),
  );

  return {
    sourceFile: options.sourceFile,
    sourceSha256: options.sourceSha256,
    mode: options.mode,
    events: options.events.length,
    results: options.results.length,
    championships: championshipKeys.size,
    warnings: options.warnings.length,
    unknownAliases: options.unknownAliases,
  };
}

async function runApplyImport(
  events: ParsedRaceEvent[],
  results: ParsedRaceResult[],
  summary: ImportSummary,
  warnings: string[],
  debug: DebugFn,
): Promise<void> {
  debug("db: creating pool");
  const pool = getDbPool();
  debug("db: acquiring connection");
  const client = await withDebugTiming(debug, "db.connect", () => pool.connect());

  try {
    await withDebugTiming(debug, "tx.begin", () => client.query("begin"));
    await withDebugTiming(debug, "tx.set_statement_timeout", () =>
      client.query("set local statement_timeout = '120s'"),
    );

    await withDebugTiming(debug, "seed drivers + aliases", () =>
      seedDriversAndAliases(client),
    );
    const aliasToDriverId = await withDebugTiming(debug, "load alias map", () =>
      loadAliasToDriverIdMap(client),
    );
    const championshipIds = await withDebugTiming(debug, "upsert championships", () =>
      upsertChampionships(client, events),
    );
    const eventIds = await withDebugTiming(debug, "upsert events", () =>
      upsertEvents(client, events, championshipIds),
    );

    await withDebugTiming(debug, "upsert results", () =>
      upsertResults(
        client,
        results,
        {
          championshipIds,
          eventIds,
          aliasToDriverId,
        },
        debug,
      ),
    );

    await withDebugTiming(debug, "insert import_run", () =>
      insertImportRun(client, summary, warnings),
    );

    await withDebugTiming(debug, "tx.commit", () => client.query("commit"));
    debug("apply import completed");
  } catch (error) {
    await withDebugTiming(debug, "tx.rollback", () => client.query("rollback"));
    throw error;
  } finally {
    debug("db: releasing connection");
    client.release();
  }
}

async function main(): Promise<void> {
  const options = parseCliArgs(process.argv.slice(2));
  const debug = createDebugLogger(options.debug);
  const filePath = resolve(process.cwd(), options.filePath);

  debug(`mode=${options.apply ? "apply" : "dry-run"} file=${filePath}`);
  const workbookBuffer = await withDebugTiming(debug, "read workbook", async () =>
    readFileSync(filePath),
  );
  const sourceSha256 = computeSha256(workbookBuffer);
  debug(`source sha256=${sourceSha256}`);

  const parsed = await withDebugTiming(debug, "parse workbook", async () =>
    parseHistoryWorkbookFromBuffer(workbookBuffer),
  );

  const unknownAliases = findUnknownAliases(parsed.results);
  debug(
    `parsed events=${parsed.events.length} results=${parsed.results.length} warnings=${parsed.warnings.length}`,
  );

  const summary = createSummary({
    sourceFile: basename(filePath),
    sourceSha256,
    mode: options.apply ? "apply" : "dry-run",
    events: parsed.events,
    results: parsed.results,
    warnings: parsed.warnings,
    unknownAliases,
  });

  if (unknownAliases.length > 0) {
    console.error(`Unknown aliases detected: ${unknownAliases.join(", ")}`);
    if (options.apply) {
      throw new Error("Cannot apply import with unknown aliases.");
    }
  }

  if (!options.apply) {
    console.log(JSON.stringify(summary, null, 2));
    if (parsed.warnings.length > 0) {
      console.log("Warnings:");
      for (const warning of parsed.warnings) {
        console.log(`- ${warning}`);
      }
    }
    return;
  }

  await runApplyImport(parsed.events, parsed.results, summary, parsed.warnings, debug);

  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDbPool();
  });

