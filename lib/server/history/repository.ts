import type { QueryResult } from "pg";
import { getDbPool } from "@/lib/server/db";
import type {
  DriverListItem,
  DriverProfile,
  DriverResultsQuery,
  DriverStats,
  EventQuery,
  EventResultItem,
  ResultFilterSet,
  ResultHighlight,
  SessionKind,
  StatsQuery,
  TeamMemberRecord,
} from "./types";

type DbEventRow = {
  event_id: string;
  season_year: number;
  championship_slug: string;
  championship_name: string;
  round_number: number;
  circuit_name: string;
  primary_session_label: string;
  secondary_session_label: string;
};

type DbEventResultRow = {
  event_id: string;
  driver_slug: string;
  driver_name: string;
  session_kind: SessionKind;
  session_label: string;
  position: number | null;
  status: "DNF" | "DNQ" | "DSQ" | "ABSENT" | null;
  raw_value: string;
};

type DbDriverRow = {
  slug: string;
  canonical_name: string;
  sort_name: string;
  country_code: string;
  country_name_es: string;
  country_name_en: string;
  role_es: string;
  role_en: string;
  is_active: boolean;
};

type DbDriverStatsRow = {
  driver_slug: string;
  canonical_name: string;
  wins: number;
  podiums: number;
  top_5: number;
  top_10: number;
  completed: number;
  dnf: number;
  dnq: number;
  dsq: number;
  absent: number;
};

type DbFilterYearRow = {
  season_year: number;
};

type DbFilterChampionshipRow = {
  id: string;
  season_year: number;
  slug: string;
  name: string;
};

type DbHighlightRow = {
  event_id: string;
  season_year: number;
  championship_slug: string;
  championship_name: string;
  round_number: number;
  circuit_name: string;
  best_driver_name: string;
  best_position: number;
};

function toEventResultItems(eventRows: DbEventRow[], resultRows: DbEventResultRow[]): EventResultItem[] {
  const resultsByEventId = new Map<string, DbEventResultRow[]>();

  for (const row of resultRows) {
    const group = resultsByEventId.get(row.event_id) ?? [];
    group.push(row);
    resultsByEventId.set(row.event_id, group);
  }

  return eventRows.map((eventRow) => {
    const group = resultsByEventId.get(eventRow.event_id) ?? [];
    return {
      eventId: eventRow.event_id,
      seasonYear: eventRow.season_year,
      championshipSlug: eventRow.championship_slug,
      championshipName: eventRow.championship_name,
      roundNumber: eventRow.round_number,
      circuitName: eventRow.circuit_name,
      results: group.map((resultRow) => ({
        driverSlug: resultRow.driver_slug,
        driverName: resultRow.driver_name,
        sessionKind: resultRow.session_kind,
        sessionLabel: resultRow.session_label,
        position: resultRow.position,
        status: resultRow.status,
        rawValue: resultRow.raw_value,
      })),
    };
  });
}

function toDriverStats(row: DbDriverStatsRow): DriverStats {
  return {
    driverSlug: row.driver_slug,
    canonicalName: row.canonical_name,
    wins: Number(row.wins ?? 0),
    podiums: Number(row.podiums ?? 0),
    top5: Number(row.top_5 ?? 0),
    top10: Number(row.top_10 ?? 0),
    completed: Number(row.completed ?? 0),
    dnf: Number(row.dnf ?? 0),
    dnq: Number(row.dnq ?? 0),
    dsq: Number(row.dsq ?? 0),
    absent: Number(row.absent ?? 0),
  };
}

function appendEventFilters(query: EventQuery | DriverResultsQuery, values: unknown[], clauses: string[]): void {
  if (query.year !== undefined) {
    values.push(query.year);
    clauses.push(`c.season_year = $${values.length}`);
  }

  if (query.championship) {
    values.push(query.championship);
    clauses.push(`c.slug = $${values.length}`);
  }
}

function appendStatsFilters(query: StatsQuery, values: unknown[], clauses: string[]): void {
  if (query.year !== undefined) {
    values.push(query.year);
    clauses.push(`c.season_year = $${values.length}`);
  }

  if (query.championship) {
    values.push(query.championship);
    clauses.push(`c.slug = $${values.length}`);
  }

  if (query.driver) {
    values.push(query.driver);
    clauses.push(`d.slug = $${values.length}`);
  }
}

async function fetchEventRows(query: EventQuery): Promise<{ rows: DbEventRow[]; hasNext: boolean }> {
  const values: unknown[] = [];
  const whereClauses: string[] = ["1=1"];

  appendEventFilters(query, values, whereClauses);

  if (query.driver) {
    values.push(query.driver);
    whereClauses.push(
      `exists (
        select 1
        from event_results er2
        join drivers d2 on d2.id = er2.driver_id
        where er2.event_id = e.id and d2.slug = $${values.length}
      )`,
    );
  }

  values.push(query.limit + 1);
  const limitParam = values.length;
  values.push(query.offset);
  const offsetParam = values.length;

  const result: QueryResult<DbEventRow> = await getDbPool().query(
    `
      select
        e.id as event_id,
        c.season_year,
        c.slug as championship_slug,
        c.name as championship_name,
        e.round_number,
        e.circuit_name,
        c.primary_session_label,
        c.secondary_session_label
      from events e
      join championships c on c.id = e.championship_id
      where ${whereClauses.join(" and ")}
      order by c.season_year desc, c.slug asc, e.round_number desc, e.id desc
      limit $${limitParam}
      offset $${offsetParam}
    `,
    values,
  );

  const hasNext = result.rows.length > query.limit;
  const rows = hasNext ? result.rows.slice(0, query.limit) : result.rows;

  return { rows, hasNext };
}

async function fetchEventRowsForDriver(
  slug: string,
  query: DriverResultsQuery,
): Promise<{ rows: DbEventRow[]; hasNext: boolean }> {
  const values: unknown[] = [slug];
  const whereClauses: string[] = ["d.slug = $1"];

  appendEventFilters(query, values, whereClauses);

  values.push(query.limit + 1);
  const limitParam = values.length;
  values.push(query.offset);
  const offsetParam = values.length;

  const result: QueryResult<DbEventRow> = await getDbPool().query(
    `
      select distinct
        e.id as event_id,
        c.season_year,
        c.slug as championship_slug,
        c.name as championship_name,
        e.round_number,
        e.circuit_name,
        c.primary_session_label,
        c.secondary_session_label
      from event_results er
      join events e on e.id = er.event_id
      join championships c on c.id = e.championship_id
      join drivers d on d.id = er.driver_id
      where ${whereClauses.join(" and ")}
      order by c.season_year desc, c.slug asc, e.round_number desc, e.id desc
      limit $${limitParam}
      offset $${offsetParam}
    `,
    values,
  );

  const hasNext = result.rows.length > query.limit;
  const rows = hasNext ? result.rows.slice(0, query.limit) : result.rows;

  return { rows, hasNext };
}

async function fetchResultsForEvents(
  eventIds: string[],
  driverSlug?: string,
): Promise<DbEventResultRow[]> {
  if (eventIds.length === 0) {
    return [];
  }

  const values: unknown[] = [eventIds];
  const whereClauses = ["er.event_id = any($1::uuid[])"];

  if (driverSlug) {
    values.push(driverSlug);
    whereClauses.push(`d.slug = $${values.length}`);
  }

  const result: QueryResult<DbEventResultRow> = await getDbPool().query(
    `
      select
        er.event_id,
        d.slug as driver_slug,
        d.canonical_name as driver_name,
        er.session_kind,
        case
          when er.session_kind = 'primary' then c.primary_session_label
          else c.secondary_session_label
        end as session_label,
        er.position,
        er.status::text as status,
        er.raw_value
      from event_results er
      join drivers d on d.id = er.driver_id
      join events e on e.id = er.event_id
      join championships c on c.id = e.championship_id
      where ${whereClauses.join(" and ")}
      order by c.season_year desc, c.slug asc, e.round_number desc, d.sort_name asc, er.session_kind asc
    `,
    values,
  );

  return result.rows;
}

export async function getEventResultsPage(query: EventQuery): Promise<{
  items: EventResultItem[];
  hasNext: boolean;
}> {
  const { rows, hasNext } = await fetchEventRows(query);
  const eventIds = rows.map((row) => row.event_id);
  const resultRows = await fetchResultsForEvents(eventIds, query.driver);

  return {
    items: toEventResultItems(rows, resultRows),
    hasNext,
  };
}

export async function getDriverResultsPage(
  slug: string,
  query: DriverResultsQuery,
): Promise<{
  items: EventResultItem[];
  hasNext: boolean;
}> {
  const { rows, hasNext } = await fetchEventRowsForDriver(slug, query);
  const eventIds = rows.map((row) => row.event_id);
  const resultRows = await fetchResultsForEvents(eventIds, slug);

  return {
    items: toEventResultItems(rows, resultRows),
    hasNext,
  };
}

export async function getHighlights(query: {
  limit: number;
  year?: number;
  championship?: string;
  driver?: string;
}): Promise<ResultHighlight[]> {
  const values: unknown[] = [];
  const whereClauses: string[] = ["1=1"];

  if (query.year !== undefined) {
    values.push(query.year);
    whereClauses.push(`h.season_year = $${values.length}`);
  }

  if (query.championship) {
    values.push(query.championship);
    whereClauses.push(`h.championship_slug = $${values.length}`);
  }

  if (query.driver) {
    values.push(query.driver);
    whereClauses.push(
      `exists (
        select 1
        from event_results er
        join drivers d on d.id = er.driver_id
        where er.event_id = h.event_id and d.slug = $${values.length}
      )`,
    );
  }

  values.push(query.limit);

  const result: QueryResult<DbHighlightRow> = await getDbPool().query(
    `
      select
        h.event_id,
        h.season_year,
        h.championship_slug,
        h.championship_name,
        h.round_number,
        h.circuit_name,
        h.best_driver_name,
        h.best_position
      from v_event_highlights h
      where ${whereClauses.join(" and ")}
      order by h.season_year desc, h.championship_slug asc, h.round_number desc, h.event_id desc
      limit $${values.length}
    `,
    values,
  );

  return result.rows.map((row) => ({
    eventId: row.event_id,
    seasonYear: row.season_year,
    championshipSlug: row.championship_slug,
    championshipName: row.championship_name,
    roundNumber: row.round_number,
    circuitName: row.circuit_name,
    bestDriverName: row.best_driver_name,
    bestPosition: row.best_position,
  }));
}

export async function getDriverStats(query: StatsQuery): Promise<DriverStats[]> {
  const values: unknown[] = [];
  const whereClauses: string[] = ["1=1"];

  appendStatsFilters(query, values, whereClauses);

  const result: QueryResult<DbDriverStatsRow> = await getDbPool().query(
    `
      select
        d.slug as driver_slug,
        d.canonical_name,
        count(*) filter (where er.position = 1) as wins,
        count(*) filter (where er.position is not null and er.position <= 3) as podiums,
        count(*) filter (where er.position is not null and er.position <= 5) as top_5,
        count(*) filter (where er.position is not null and er.position <= 10) as top_10,
        count(*) filter (where er.position is not null) as completed,
        count(*) filter (where er.status = 'DNF') as dnf,
        count(*) filter (where er.status = 'DNQ') as dnq,
        count(*) filter (where er.status = 'DSQ') as dsq,
        count(*) filter (where er.status = 'ABSENT') as absent
      from event_results er
      join events e on e.id = er.event_id
      join championships c on c.id = e.championship_id
      join drivers d on d.id = er.driver_id
      where ${whereClauses.join(" and ")}
      group by d.id, d.slug, d.canonical_name
      order by wins desc, podiums desc, d.canonical_name asc
    `,
    values,
  );

  return result.rows.map(toDriverStats);
}

export async function getResultFilters(): Promise<ResultFilterSet> {
  const [yearsResult, championshipsResult, driversResult] = await Promise.all([
    getDbPool().query<DbFilterYearRow>(
      "select distinct season_year from championships order by season_year desc",
    ),
    getDbPool().query<DbFilterChampionshipRow>(
      "select id, season_year, slug, name from championships order by season_year desc, name asc",
    ),
    getDbPool().query<Pick<DbDriverRow, "slug" | "canonical_name">>(
      "select slug, canonical_name from drivers where is_active = true order by sort_name asc",
    ),
  ]);

  return {
    years: yearsResult.rows.map((row) => row.season_year),
    championships: championshipsResult.rows.map((row) => ({
      id: row.id,
      seasonYear: row.season_year,
      slug: row.slug,
      name: row.name,
    })),
    drivers: driversResult.rows.map((row) => ({
      slug: row.slug,
      canonicalName: row.canonical_name,
    })),
  };
}

export async function getTeamMembers(activeOnly: boolean): Promise<TeamMemberRecord[]> {
  const values: unknown[] = [activeOnly];

  const result: QueryResult<DbDriverRow> = await getDbPool().query(
    `
      select
        slug,
        canonical_name,
        sort_name,
        country_code,
        country_name_es,
        country_name_en,
        role_es,
        role_en,
        is_active
      from drivers
      where ($1::boolean = false or is_active = true)
      order by sort_name asc
    `,
    values,
  );

  return result.rows.map((row) => ({
    slug: row.slug,
    canonicalName: row.canonical_name,
    sortName: row.sort_name,
    countryCode: row.country_code,
    countryNameEs: row.country_name_es,
    countryNameEn: row.country_name_en,
    roleEs: row.role_es,
    roleEn: row.role_en,
    isActive: row.is_active,
  }));
}

export async function getDrivers(activeOnly: boolean, language: "es" | "en"): Promise<DriverListItem[]> {
  const members = await getTeamMembers(activeOnly);

  return members.map((member) => ({
    slug: member.slug,
    canonicalName: member.canonicalName,
    countryCode: member.countryCode,
    countryName: language === "es" ? member.countryNameEs : member.countryNameEn,
    role: language === "es" ? member.roleEs : member.roleEn,
  }));
}

function zeroStats(slug: string, canonicalName: string): DriverStats {
  return {
    driverSlug: slug,
    canonicalName,
    wins: 0,
    podiums: 0,
    top5: 0,
    top10: 0,
    completed: 0,
    dnf: 0,
    dnq: 0,
    dsq: 0,
    absent: 0,
  };
}

export async function getDriverBySlug(slug: string): Promise<DriverProfile | null> {
  const driverResult: QueryResult<DbDriverRow> = await getDbPool().query(
    `
      select
        slug,
        canonical_name,
        sort_name,
        country_code,
        country_name_es,
        country_name_en,
        role_es,
        role_en,
        is_active
      from drivers
      where slug = $1
      limit 1
    `,
    [slug],
  );

  const driver = driverResult.rows.at(0);
  if (!driver) {
    return null;
  }

  const stats = (await getDriverStats({ driver: slug })).at(0) ??
    zeroStats(driver.slug, driver.canonical_name);

  return {
    slug: driver.slug,
    canonicalName: driver.canonical_name,
    sortName: driver.sort_name,
    countryCode: driver.country_code,
    countryNameEs: driver.country_name_es,
    countryNameEn: driver.country_name_en,
    roleEs: driver.role_es,
    roleEn: driver.role_en,
    isActive: driver.is_active,
    stats,
  };
}

