import type { QueryResult } from "pg";
import { getDbPool } from "@/lib/server/db";
import type {
  CurrentChampionshipSummary,
  DriverListItem,
  DriverProfile,
  DriverResultsQuery,
  DriverStats,
  EventQuery,
  EventParticipationCard,
  EventResultItem,
  HomeLiveBroadcast,
  OverviewQuery,
  ResultFilterSet,
  ResultHighlight,
  SessionKind,
  StatsQuery,
  TeamMemberRecord,
  TeamOverviewKpis,
} from "./types";

type DbEventRow = {
  event_id: string;
  season_year: number;
  championship_slug: string;
  championship_name: string;
  round_number: number;
  circuit_name: string;
  event_date: string | null;
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
  championship_id: string;
  season_year: number;
  championship_slug: string;
  championship_name: string;
  round_number: number;
  circuit_name: string;
  best_driver_name: string;
  best_position: number;
};

type DbOverviewRow = {
  races_completed: number;
  podiums: number;
  wins: number;
  active_drivers: number;
};

type DbCurrentChampionshipRow = {
  championship_id: string;
  season_year: number;
  championship_slug: string;
  championship_name: string;
};

type DbCurrentLeaderboardRow = {
  driver_slug: string;
  driver_name: string;
  wins: number;
  podiums: number;
  top_10: number;
  completed: number;
  avg_position: number | null;
};

type DbHomeLiveBroadcastRow = {
  event_id: string;
  season_year: number;
  championship_slug: string;
  championship_name: string;
  round_number: number;
  circuit_name: string;
  stream_video_id: string;
  stream_start_at: string | null;
  stream_end_at: string | null;
  stream_override_mode: "auto" | "force_on" | "force_off";
};

function isMissingLiveBroadcastConfigSchemaError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeCode = (error as { code?: unknown }).code;
  const maybeMessage = (error as { message?: unknown }).message;
  if ((maybeCode !== "42P01" && maybeCode !== "42703") || typeof maybeMessage !== "string") {
    return false;
  }

  return /\blive_broadcast_config\b/.test(maybeMessage);
}

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
      eventDate: eventRow.event_date,
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

function toParticipationCards(events: EventResultItem[]): EventParticipationCard[] {
  return events.map((event) => {
    const grouped = new Map<
      string,
      {
        driverSlug: string;
        driverName: string;
        sessions: EventParticipationCard["participants"][number]["sessions"];
        bestPosition: number | null;
      }
    >();

    for (const entry of event.results) {
      const current = grouped.get(entry.driverSlug) ?? {
        driverSlug: entry.driverSlug,
        driverName: entry.driverName,
        sessions: [],
        bestPosition: null,
      };

      current.sessions.push({
        sessionKind: entry.sessionKind,
        sessionLabel: entry.sessionLabel,
        position: entry.position,
        status: entry.status,
        rawValue: entry.rawValue,
      });

      if (entry.position !== null) {
        current.bestPosition =
          current.bestPosition === null ? entry.position : Math.min(current.bestPosition, entry.position);
      }

      grouped.set(entry.driverSlug, current);
    }

    const participants = Array.from(grouped.values())
      .sort((left, right) => {
        const leftSort = left.bestPosition ?? Number.MAX_SAFE_INTEGER;
        const rightSort = right.bestPosition ?? Number.MAX_SAFE_INTEGER;
        if (leftSort !== rightSort) {
          return leftSort - rightSort;
        }
        return left.driverName.localeCompare(right.driverName);
      })
      .map((participant) => ({
        driverSlug: participant.driverSlug,
        driverName: participant.driverName,
        sessions: participant.sessions.sort((left, right) => left.sessionKind.localeCompare(right.sessionKind)),
      }));

    return {
      eventId: event.eventId,
      seasonYear: event.seasonYear,
      championshipSlug: event.championshipSlug,
      championshipName: event.championshipName,
      roundNumber: event.roundNumber,
      circuitName: event.circuitName,
      eventDate: event.eventDate,
      participants,
    };
  });
}

function appendEventFilters(query: EventQuery | DriverResultsQuery, values: unknown[], clauses: string[]): void {
  if (query.year !== undefined) {
    values.push(query.year);
    clauses.push(`c.season_year = $${values.length}`);
  }

  if (query.championshipId) {
    values.push(query.championshipId);
    clauses.push(`c.id = $${values.length}::uuid`);
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

  if (query.championshipId) {
    values.push(query.championshipId);
    clauses.push(`c.id = $${values.length}::uuid`);
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

function appendOverviewFilters(query: OverviewQuery, values: unknown[], clauses: string[]): void {
  if (query.year !== undefined) {
    values.push(query.year);
    clauses.push(`c.season_year = $${values.length}`);
  }

  if (query.championshipId) {
    values.push(query.championshipId);
    clauses.push(`c.id = $${values.length}::uuid`);
  }

  if (query.championship) {
    values.push(query.championship);
    clauses.push(`c.slug = $${values.length}`);
  }
}

async function fetchEventRows(query: EventQuery): Promise<{ rows: DbEventRow[]; hasNext: boolean }> {
  const values: unknown[] = [];
  const whereClauses: string[] = ["e.is_active = true", "c.is_active = true"];

  appendEventFilters(query, values, whereClauses);

  if (query.driver) {
    values.push(query.driver);
    whereClauses.push(
      `exists (
        select 1
        from event_results er2
        join drivers d2 on d2.id = er2.driver_id
        where er2.event_id = e.id and d2.slug = $${values.length} and er2.is_active = true and d2.is_active = true
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
        e.event_date::text as event_date,
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
  const whereClauses: string[] = [
    "d.slug = $1",
    "d.is_active = true",
    "er.is_active = true",
    "e.is_active = true",
    "c.is_active = true",
  ];

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
        e.event_date::text as event_date,
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
  const whereClauses = [
    "er.event_id = any($1::uuid[])",
    "er.is_active = true",
    "d.is_active = true",
    "e.is_active = true",
    "c.is_active = true",
  ];

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

export async function getEventParticipationPage(query: EventQuery): Promise<{
  items: EventParticipationCard[];
  hasNext: boolean;
}> {
  const page = await getEventResultsPage(query);
  return {
    items: toParticipationCards(page.items),
    hasNext: page.hasNext,
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
  championshipId?: string;
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

  if (query.championshipId) {
    values.push(query.championshipId);
    whereClauses.push(`h.championship_id = $${values.length}::uuid`);
  }

  if (query.driver) {
    values.push(query.driver);
    whereClauses.push(
      `exists (
        select 1
        from event_results er
        join drivers d on d.id = er.driver_id
        where er.event_id = h.event_id and d.slug = $${values.length} and er.is_active = true and d.is_active = true
      )`,
    );
  }

  values.push(query.limit);

  const result: QueryResult<DbHighlightRow> = await getDbPool().query(
    `
      with ranked as (
        select
          e.id as event_id,
          c.id as championship_id,
          c.season_year,
          c.slug as championship_slug,
          c.name as championship_name,
          e.round_number,
          e.circuit_name,
          d.canonical_name as best_driver_name,
          er.position as best_position,
          row_number() over (
            partition by e.id
            order by er.position asc nulls last, d.canonical_name asc
          ) as rank_in_event
        from events e
        join championships c on c.id = e.championship_id
        join event_results er on er.event_id = e.id
        join drivers d on d.id = er.driver_id
        where
          e.is_active = true
          and c.is_active = true
          and er.is_active = true
          and d.is_active = true
          and er.position is not null
      )
      select
        event_id,
        championship_id,
        season_year,
        championship_slug,
        championship_name,
        round_number,
        circuit_name,
        best_driver_name,
        best_position
      from ranked h
      where rank_in_event = 1 and ${whereClauses.join(" and ")}
      order by season_year desc, championship_slug asc, round_number desc, event_id desc
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
  const whereClauses: string[] = [
    "er.is_active = true",
    "e.is_active = true",
    "c.is_active = true",
    "d.is_active = true",
  ];

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

export async function getResultsOverview(query: OverviewQuery): Promise<TeamOverviewKpis> {
  const values: unknown[] = [];
  const whereClauses: string[] = [
    "er.is_active = true",
    "e.is_active = true",
    "c.is_active = true",
    "d.is_active = true",
  ];

  appendOverviewFilters(query, values, whereClauses);

  const scopedResult: QueryResult<DbOverviewRow> = await getDbPool().query(
    `
      with scoped as (
        select
          er.event_id,
          er.driver_id,
          er.position
        from event_results er
        join events e on e.id = er.event_id
        join championships c on c.id = e.championship_id
        join drivers d on d.id = er.driver_id
        where ${whereClauses.join(" and ")}
      )
      select
        count(distinct event_id) as races_completed,
        count(*) filter (where position is not null and position <= 3) as podiums,
        count(*) filter (where position = 1) as wins,
        count(distinct driver_id) as active_drivers
      from scoped
    `,
    values,
  );

  const activeDriversScopeResult =
    query.year !== undefined || query.championship || query.championshipId
      ? scopedResult.rows.at(0)?.active_drivers ?? 0
      : (
          await getDbPool().query<{ active_drivers: number }>(
            "select count(*)::int as active_drivers from drivers where is_active = true",
          )
        ).rows.at(0)?.active_drivers ?? 0;

  const row = scopedResult.rows.at(0);

  return {
    racesCompleted: Number(row?.races_completed ?? 0),
    podiums: Number(row?.podiums ?? 0),
    wins: Number(row?.wins ?? 0),
    activeDrivers: Number(activeDriversScopeResult ?? 0),
  };
}

export async function getCurrentChampionshipSummary(
  limitEvents = 5,
): Promise<CurrentChampionshipSummary | null> {
  const latestResult: QueryResult<DbCurrentChampionshipRow> = await getDbPool().query(
    `
      select
        c.id as championship_id,
        c.season_year,
        c.slug as championship_slug,
        c.name as championship_name
      from events e
      join championships c on c.id = e.championship_id
      where e.is_active = true and c.is_active = true
      order by
        case
          when e.event_date is not null and e.event_date <= current_date then 0
          when e.event_date is not null then 1
          else 2
        end asc,
        e.event_date desc nulls last,
        c.season_year desc,
        e.round_number desc,
        e.id desc
      limit 1
    `,
  );

  const latest = latestResult.rows.at(0);
  if (!latest) {
    return null;
  }

  const eventRowsResult: QueryResult<DbEventRow> = await getDbPool().query(
    `
      select
        e.id as event_id,
        c.season_year,
        c.slug as championship_slug,
        c.name as championship_name,
        e.round_number,
        e.circuit_name,
        e.event_date::text as event_date,
        c.primary_session_label,
        c.secondary_session_label
      from events e
      join championships c on c.id = e.championship_id
      where c.id = $1 and e.is_active = true and c.is_active = true
      order by e.round_number desc
      limit $2
    `,
    [latest.championship_id, limitEvents],
  );

  const eventRows = eventRowsResult.rows;
  const eventIds = eventRows.map((row) => row.event_id);
  const resultRows = await fetchResultsForEvents(eventIds);
  const eventResultItems = toEventResultItems(eventRows, resultRows);
  const events = toParticipationCards(eventResultItems);

  const leaderboardResult: QueryResult<DbCurrentLeaderboardRow> = await getDbPool().query(
    `
      select
        d.slug as driver_slug,
        d.canonical_name as driver_name,
        count(*) filter (where er.position = 1) as wins,
        count(*) filter (where er.position is not null and er.position <= 3) as podiums,
        count(*) filter (where er.position is not null and er.position <= 10) as top_10,
        count(*) filter (where er.position is not null) as completed,
        avg(er.position::numeric) filter (where er.position is not null) as avg_position
      from event_results er
      join drivers d on d.id = er.driver_id
      join events e on e.id = er.event_id
      where
        e.championship_id = $1
        and er.is_active = true
        and d.is_active = true
        and e.is_active = true
      group by d.id, d.slug, d.canonical_name
      order by wins desc, podiums desc, top_10 desc, completed desc, avg_position asc nulls last, d.canonical_name asc
      limit 8
    `,
    [latest.championship_id],
  );

  return {
    championship: {
      id: latest.championship_id,
      seasonYear: latest.season_year,
      slug: latest.championship_slug,
      name: latest.championship_name,
    },
    events,
    leaderboard: leaderboardResult.rows.map((row) => ({
      driverSlug: row.driver_slug,
      driverName: row.driver_name,
      wins: Number(row.wins ?? 0),
      podiums: Number(row.podiums ?? 0),
      top10: Number(row.top_10 ?? 0),
      completed: Number(row.completed ?? 0),
      avgPosition: row.avg_position === null ? null : Number(row.avg_position),
    })),
  };
}

export async function getHomeLiveBroadcastCandidate(
  nowIso: string,
): Promise<Omit<HomeLiveBroadcast, "status"> | null> {
  let row: DbHomeLiveBroadcastRow | null = null;

  try {
    const configResult: QueryResult<DbHomeLiveBroadcastRow> = await getDbPool().query(
      `
        select
          coalesce(e.id::text, 'live-global') as event_id,
          coalesce(c.season_year, extract(year from $1::timestamptz)::int) as season_year,
          coalesce(c.slug, 'live') as championship_slug,
          coalesce(c.name, 'SINTA Live') as championship_name,
          coalesce(e.round_number, 0) as round_number,
          coalesce(e.circuit_name, 'Live Broadcast') as circuit_name,
          l.stream_video_id,
          l.stream_start_at::text,
          l.stream_end_at::text,
          l.stream_override_mode
        from live_broadcast_config l
        left join events e on e.id = l.event_id and e.is_active = true
        left join championships c on c.id = e.championship_id and c.is_active = true
        where l.id = 1 and l.stream_video_id is not null
        limit 1
      `,
      [nowIso],
    );
    row = configResult.rows.at(0) ?? null;
  } catch (error) {
    if (!isMissingLiveBroadcastConfigSchemaError(error)) {
      throw error;
    }

    const legacyResult: QueryResult<DbHomeLiveBroadcastRow> = await getDbPool().query(
      `
        select
          e.id as event_id,
          c.season_year,
          c.slug as championship_slug,
          c.name as championship_name,
          e.round_number,
          e.circuit_name,
          e.stream_video_id,
          e.stream_start_at::text,
          e.stream_end_at::text,
          e.stream_override_mode
        from events e
        join championships c on c.id = e.championship_id
        where
          e.is_active = true
          and c.is_active = true
          and e.stream_video_id is not null
          and (
            e.stream_override_mode = 'force_on'
            or (
              e.stream_override_mode = 'auto'
              and e.stream_start_at is not null
              and e.stream_end_at is not null
              and $1::timestamptz >= (e.stream_start_at - interval '30 minutes')
              and $1::timestamptz <= e.stream_end_at
            )
          )
        order by
          case when e.stream_override_mode = 'force_on' then 0 else 1 end asc,
          case
            when e.stream_override_mode = 'auto'
              then abs(extract(epoch from (e.stream_start_at - $1::timestamptz)))
            else 0
          end asc,
          e.stream_start_at asc nulls last,
          c.season_year desc,
          e.round_number asc,
          e.id asc
        limit 1
      `,
      [nowIso],
    );
    row = legacyResult.rows.at(0) ?? null;
  }

  if (!row) {
    return null;
  }

  return {
    eventId: row.event_id,
    seasonYear: row.season_year,
    championshipSlug: row.championship_slug,
    championshipName: row.championship_name,
    roundNumber: row.round_number,
    circuitName: row.circuit_name,
    streamVideoId: row.stream_video_id,
    streamStartAt: row.stream_start_at,
    streamEndAt: row.stream_end_at,
    streamOverrideMode: row.stream_override_mode,
  };
}

export async function getResultFilters(): Promise<ResultFilterSet> {
  const [yearsResult, championshipsResult, driversResult] = await Promise.all([
    getDbPool().query<DbFilterYearRow>(
      "select distinct season_year from championships where is_active = true order by season_year desc",
    ),
    getDbPool().query<DbFilterChampionshipRow>(
      "select id, season_year, slug, name from championships where is_active = true order by season_year desc, name asc",
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
  void activeOnly;

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
      where is_active = true
      order by sort_name asc
    `,
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
      where slug = $1 and is_active = true
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

