import type { PoolClient } from "pg";

import { getDbPool } from "@/lib/server/db";
import type {
  AdminLiveBroadcastConfig,
  AdminAuditLog,
  AdminChampionship,
  AdminDriver,
  AdminDriverAlias,
  AdminEvent,
  AdminEventResultRow,
  AdminEventResultsGrid,
  AdminRole,
  AdminUser,
  CreateChampionshipInput,
  CreateDriverInput,
  CreateEventInput,
  EventResultCellInput,
  StreamOverrideMode,
  UpdateChampionshipInput,
  UpdateDriverInput,
  UpdateEventInput,
  UpdateLiveBroadcastConfigInput,
} from "./types";

type AdminUserRow = {
  id: string;
  username: string;
  username_normalized: string;
  password_hash: string;
  role: AdminRole;
  is_active: boolean;
  must_change_password: boolean;
  failed_attempts: number;
  locked_until: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
};

type AdminChampionshipRow = {
  id: string;
  season_year: number;
  name: string;
  slug: string;
  primary_session_label: string;
  secondary_session_label: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type AdminEventRow = {
  id: string;
  championship_id: string;
  championship_name: string;
  championship_slug: string;
  season_year: number;
  round_number: number;
  circuit_name: string;
  event_date: string | null;
  stream_video_id: string | null;
  stream_start_at: string | null;
  stream_end_at: string | null;
  stream_override_mode: StreamOverrideMode;
  is_active: boolean;
  source_sheet: string;
  source_row: number;
  created_at: string;
  updated_at: string;
};

type AdminLiveBroadcastConfigRow = {
  event_id: string | null;
  stream_video_id: string | null;
  stream_start_at: string | null;
  stream_end_at: string | null;
  stream_override_mode: StreamOverrideMode;
  updated_at: string | null;
};

type AdminDriverRow = {
  id: string;
  slug: string;
  canonical_name: string;
  sort_name: string;
  country_code: string;
  country_name_es: string;
  country_name_en: string;
  role_es: string;
  role_en: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type AdminAliasRow = {
  id: string;
  driver_id: string;
  alias_original: string;
  alias_normalized: string;
  created_at: string;
};

type AdminResultRow = {
  id: string;
  event_id: string;
  driver_id: string;
  driver_slug: string;
  driver_name: string;
  session_kind: "primary" | "secondary";
  position: number | null;
  status: "DNF" | "DNQ" | "DSQ" | "ABSENT" | null;
  raw_value: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type AdminAuditRow = {
  id: string;
  actor_user_id: string;
  actor_username: string;
  entity_type: string;
  entity_id: string | null;
  action: string;
  before_json: Record<string, unknown>;
  after_json: Record<string, unknown>;
  request_id: string | null;
  created_at: string;
};

function appendOptionalFilter(
  values: unknown[],
  clauses: string[],
  value: unknown,
  sqlTemplate: string,
): void {
  if (value === undefined || value === null || value === "") {
    return;
  }

  values.push(value);
  clauses.push(sqlTemplate.replace("$?", `$${values.length}`));
}

async function withTransaction<T>(operation: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getDbPool().connect();
  try {
    await client.query("begin");
    const result = await operation(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

function isMissingEventStreamColumnsError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeCode = (error as { code?: unknown }).code;
  const maybeMessage = (error as { message?: unknown }).message;
  if (maybeCode !== "42703" || typeof maybeMessage !== "string") {
    return false;
  }

  return /\bstream_(video_id|start_at|end_at|override_mode)\b/.test(maybeMessage);
}

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

function eventStreamSelectClause(useLegacyFallback: boolean): string {
  if (useLegacyFallback) {
    return `
        null::text as stream_video_id,
        null::text as stream_start_at,
        null::text as stream_end_at,
        'auto'::text as stream_override_mode,
    `;
  }

  return `
        e.stream_video_id,
        e.stream_start_at::text,
        e.stream_end_at::text,
        e.stream_override_mode,
  `;
}

function mapAdminUser(row: AdminUserRow): AdminUser {
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    isActive: row.is_active,
    mustChangePassword: row.must_change_password,
    failedAttempts: Number(row.failed_attempts ?? 0),
    lockedUntil: row.locked_until,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapChampionship(row: AdminChampionshipRow): AdminChampionship {
  return {
    id: row.id,
    seasonYear: row.season_year,
    name: row.name,
    slug: row.slug,
    primarySessionLabel: row.primary_session_label,
    secondarySessionLabel: row.secondary_session_label,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapEvent(row: AdminEventRow): AdminEvent {
  return {
    id: row.id,
    championshipId: row.championship_id,
    championshipName: row.championship_name,
    championshipSlug: row.championship_slug,
    seasonYear: row.season_year,
    roundNumber: row.round_number,
    circuitName: row.circuit_name,
    eventDate: row.event_date,
    streamVideoId: row.stream_video_id,
    streamStartAt: row.stream_start_at,
    streamEndAt: row.stream_end_at,
    streamOverrideMode: row.stream_override_mode,
    isActive: row.is_active,
    sourceSheet: row.source_sheet,
    sourceRow: row.source_row,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapLiveBroadcastConfig(row: AdminLiveBroadcastConfigRow): AdminLiveBroadcastConfig {
  return {
    eventId: row.event_id,
    streamVideoId: row.stream_video_id,
    streamStartAt: row.stream_start_at,
    streamEndAt: row.stream_end_at,
    streamOverrideMode: row.stream_override_mode,
    updatedAt: row.updated_at,
  };
}

function mapDriver(row: AdminDriverRow): AdminDriver {
  return {
    id: row.id,
    slug: row.slug,
    canonicalName: row.canonical_name,
    sortName: row.sort_name,
    countryCode: row.country_code,
    countryNameEs: row.country_name_es,
    countryNameEn: row.country_name_en,
    roleEs: row.role_es,
    roleEn: row.role_en,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAlias(row: AdminAliasRow): AdminDriverAlias {
  return {
    id: row.id,
    driverId: row.driver_id,
    aliasOriginal: row.alias_original,
    aliasNormalized: row.alias_normalized,
    createdAt: row.created_at,
  };
}

function mapResultRow(row: AdminResultRow): AdminEventResultRow {
  return {
    id: row.id,
    eventId: row.event_id,
    driverId: row.driver_id,
    driverSlug: row.driver_slug,
    driverName: row.driver_name,
    sessionKind: row.session_kind,
    position: row.position,
    status: row.status,
    rawValue: row.raw_value,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAuditRow(row: AdminAuditRow): AdminAuditLog {
  return {
    id: row.id,
    actorUserId: row.actor_user_id,
    actorUsername: row.actor_username,
    entityType: row.entity_type,
    entityId: row.entity_id,
    action: row.action,
    before: row.before_json ?? {},
    after: row.after_json ?? {},
    requestId: row.request_id,
    createdAt: row.created_at,
  };
}

export async function getAdminUserByUsernameNormalized(
  usernameNormalized: string,
): Promise<(AdminUser & { passwordHash: string }) | null> {
  const result = await getDbPool().query<AdminUserRow>(
    `
      select
        id,
        username,
        username_normalized,
        password_hash,
        role,
        is_active,
        must_change_password,
        failed_attempts,
        locked_until::text,
        last_login_at::text,
        created_at::text,
        updated_at::text
      from users
      where username_normalized = $1
      limit 1
    `,
    [usernameNormalized],
  );
  const row = result.rows.at(0);
  if (!row) {
    return null;
  }
  return {
    ...mapAdminUser(row),
    passwordHash: row.password_hash,
  };
}

export async function getAdminUserById(id: string): Promise<AdminUser | null> {
  const result = await getDbPool().query<AdminUserRow>(
    `
      select
        id,
        username,
        username_normalized,
        password_hash,
        role,
        is_active,
        must_change_password,
        failed_attempts,
        locked_until::text,
        last_login_at::text,
        created_at::text,
        updated_at::text
      from users
      where id = $1
      limit 1
    `,
    [id],
  );
  const row = result.rows.at(0);
  return row ? mapAdminUser(row) : null;
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  const result = await getDbPool().query<AdminUserRow>(
    `
      select
        id,
        username,
        username_normalized,
        password_hash,
        role,
        is_active,
        must_change_password,
        failed_attempts,
        locked_until::text,
        last_login_at::text,
        created_at::text,
        updated_at::text
      from users
      order by created_at desc
    `,
  );
  return result.rows.map(mapAdminUser);
}

export async function createAdminUserRecord(options: {
  username: string;
  usernameNormalized: string;
  role: AdminRole;
  passwordHash: string;
  createdBy: string | null;
}): Promise<AdminUser> {
  const result = await getDbPool().query<AdminUserRow>(
    `
      insert into users (
        username,
        username_normalized,
        role,
        password_hash,
        is_active,
        must_change_password,
        created_by,
        updated_at
      )
      values ($1, $2, $3, $4, true, true, $5, now())
      returning
        id,
        username,
        username_normalized,
        password_hash,
        role,
        is_active,
        must_change_password,
        failed_attempts,
        locked_until::text,
        last_login_at::text,
        created_at::text,
        updated_at::text
    `,
    [options.username, options.usernameNormalized, options.role, options.passwordHash, options.createdBy],
  );
  const row = result.rows.at(0);
  if (!row) {
    throw new Error("Failed to create admin user.");
  }
  return mapAdminUser(row);
}

export async function updateAdminUserRecord(
  id: string,
  input: { role?: AdminRole; isActive?: boolean },
): Promise<AdminUser | null> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (input.role) {
    values.push(input.role);
    fields.push(`role = $${values.length}`);
  }
  if (input.isActive !== undefined) {
    values.push(input.isActive);
    fields.push(`is_active = $${values.length}`);
  }
  if (fields.length === 0) {
    return getAdminUserById(id);
  }

  values.push(id);
  const result = await getDbPool().query<AdminUserRow>(
    `
      update users
      set ${fields.join(", ")}, updated_at = now()
      where id = $${values.length}
      returning
        id,
        username,
        username_normalized,
        password_hash,
        role,
        is_active,
        must_change_password,
        failed_attempts,
        locked_until::text,
        last_login_at::text,
        created_at::text,
        updated_at::text
    `,
    values,
  );
  const row = result.rows.at(0);
  return row ? mapAdminUser(row) : null;
}

export async function markAdminLoginFailure(userId: string, lockedUntilIso: string | null): Promise<void> {
  await getDbPool().query(
    `
      update users
      set
        failed_attempts = failed_attempts + 1,
        locked_until = $2::timestamptz,
        updated_at = now()
      where id = $1
    `,
    [userId, lockedUntilIso],
  );
}

export async function markAdminLoginSuccess(userId: string): Promise<void> {
  await getDbPool().query(
    `
      update users
      set
        failed_attempts = 0,
        locked_until = null,
        last_login_at = now(),
        updated_at = now()
      where id = $1
    `,
    [userId],
  );
}

export async function updateAdminUserPassword(
  userId: string,
  passwordHash: string,
  mustChange: boolean,
): Promise<void> {
  await getDbPool().query(
    `
      update users
      set
        password_hash = $2,
        must_change_password = $3,
        failed_attempts = 0,
        locked_until = null,
        updated_at = now()
      where id = $1
    `,
    [userId, passwordHash, mustChange],
  );
}

export async function listAdminChampionships(includeInactive: boolean): Promise<AdminChampionship[]> {
  const result = await getDbPool().query<AdminChampionshipRow>(
    `
      select
        id,
        season_year,
        name,
        slug,
        primary_session_label,
        secondary_session_label,
        is_active,
        created_at::text,
        updated_at::text
      from championships
      where ($1::boolean = true or is_active = true)
      order by season_year desc, name asc
    `,
    [includeInactive],
  );
  return result.rows.map(mapChampionship);
}

export async function getChampionshipById(id: string): Promise<AdminChampionship | null> {
  const result = await getDbPool().query<AdminChampionshipRow>(
    `
      select
        id,
        season_year,
        name,
        slug,
        primary_session_label,
        secondary_session_label,
        is_active,
        created_at::text,
        updated_at::text
      from championships
      where id = $1
      limit 1
    `,
    [id],
  );
  const row = result.rows.at(0);
  return row ? mapChampionship(row) : null;
}

export async function createChampionshipRecord(input: CreateChampionshipInput): Promise<AdminChampionship> {
  const result = await getDbPool().query<AdminChampionshipRow>(
    `
      insert into championships (
        season_year,
        name,
        slug,
        primary_session_label,
        secondary_session_label,
        is_active,
        updated_at
      )
      values ($1, $2, $3, $4, $5, true, now())
      returning
        id,
        season_year,
        name,
        slug,
        primary_session_label,
        secondary_session_label,
        is_active,
        created_at::text,
        updated_at::text
    `,
    [input.seasonYear, input.name, input.slug, input.primarySessionLabel, input.secondarySessionLabel],
  );
  const row = result.rows.at(0);
  if (!row) {
    throw new Error("Failed to create championship.");
  }
  return mapChampionship(row);
}

export async function updateChampionshipRecord(
  id: string,
  input: UpdateChampionshipInput,
): Promise<AdminChampionship | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  if (input.seasonYear !== undefined) {
    values.push(input.seasonYear);
    fields.push(`season_year = $${values.length}`);
  }
  if (input.name !== undefined) {
    values.push(input.name);
    fields.push(`name = $${values.length}`);
  }
  if (input.primarySessionLabel !== undefined) {
    values.push(input.primarySessionLabel);
    fields.push(`primary_session_label = $${values.length}`);
  }
  if (input.secondarySessionLabel !== undefined) {
    values.push(input.secondarySessionLabel);
    fields.push(`secondary_session_label = $${values.length}`);
  }
  if (fields.length === 0) {
    return getChampionshipById(id);
  }
  values.push(id);
  const result = await getDbPool().query<AdminChampionshipRow>(
    `
      update championships
      set ${fields.join(", ")}, updated_at = now()
      where id = $${values.length}
      returning
        id,
        season_year,
        name,
        slug,
        primary_session_label,
        secondary_session_label,
        is_active,
        created_at::text,
        updated_at::text
    `,
    values,
  );
  const row = result.rows.at(0);
  return row ? mapChampionship(row) : null;
}

export async function setChampionshipActive(id: string, isActive: boolean): Promise<AdminChampionship | null> {
  const result = await getDbPool().query<AdminChampionshipRow>(
    `
      update championships
      set is_active = $2, updated_at = now()
      where id = $1
      returning
        id,
        season_year,
        name,
        slug,
        primary_session_label,
        secondary_session_label,
        is_active,
        created_at::text,
        updated_at::text
    `,
    [id, isActive],
  );
  const row = result.rows.at(0);
  return row ? mapChampionship(row) : null;
}

export async function listAdminEvents(filters: {
  includeInactive: boolean;
  year?: number;
  championshipId?: string;
}): Promise<AdminEvent[]> {
  const values: unknown[] = [filters.includeInactive];
  const clauses = ["($1::boolean = true or e.is_active = true)"];
  appendOptionalFilter(values, clauses, filters.year, "c.season_year = $?");
  appendOptionalFilter(values, clauses, filters.championshipId, "e.championship_id = $?::uuid");

  const buildQuery = (useLegacyFallback: boolean) => `
      select
        e.id,
        e.championship_id,
        c.name as championship_name,
        c.slug as championship_slug,
        c.season_year,
        e.round_number,
        e.circuit_name,
        e.event_date::text,
        ${eventStreamSelectClause(useLegacyFallback)}
        e.is_active,
        e.source_sheet,
        e.source_row,
        e.created_at::text,
        e.updated_at::text
      from events e
      join championships c on c.id = e.championship_id
      where ${clauses.join(" and ")}
      order by c.season_year desc, c.slug asc, e.round_number desc
    `;

  try {
    const result = await getDbPool().query<AdminEventRow>(buildQuery(false), values);
    return result.rows.map(mapEvent);
  } catch (error) {
    if (!isMissingEventStreamColumnsError(error)) {
      throw error;
    }

    const result = await getDbPool().query<AdminEventRow>(buildQuery(true), values);
    return result.rows.map(mapEvent);
  }
}

export async function getEventById(id: string): Promise<AdminEvent | null> {
  const values: unknown[] = [id];
  const buildQuery = (useLegacyFallback: boolean) => `
      select
        e.id,
        e.championship_id,
        c.name as championship_name,
        c.slug as championship_slug,
        c.season_year,
        e.round_number,
        e.circuit_name,
        e.event_date::text,
        ${eventStreamSelectClause(useLegacyFallback)}
        e.is_active,
        e.source_sheet,
        e.source_row,
        e.created_at::text,
        e.updated_at::text
      from events e
      join championships c on c.id = e.championship_id
      where e.id = $1
      limit 1
    `;

  try {
    const result = await getDbPool().query<AdminEventRow>(buildQuery(false), values);
    const row = result.rows.at(0);
    return row ? mapEvent(row) : null;
  } catch (error) {
    if (!isMissingEventStreamColumnsError(error)) {
      throw error;
    }

    const result = await getDbPool().query<AdminEventRow>(buildQuery(true), values);
    const row = result.rows.at(0);
    return row ? mapEvent(row) : null;
  }
}

function defaultLiveBroadcastConfig(): AdminLiveBroadcastConfig {
  return {
    eventId: null,
    streamVideoId: null,
    streamStartAt: null,
    streamEndAt: null,
    streamOverrideMode: "auto",
    updatedAt: null,
  };
}

export async function getAdminLiveBroadcastConfigRecord(): Promise<AdminLiveBroadcastConfig> {
  try {
    const result = await getDbPool().query<AdminLiveBroadcastConfigRow>(
      `
        select
          event_id::text,
          stream_video_id,
          stream_start_at::text,
          stream_end_at::text,
          stream_override_mode,
          updated_at::text
        from live_broadcast_config
        where id = 1
        limit 1
      `,
    );

    const row = result.rows.at(0);
    return row ? mapLiveBroadcastConfig(row) : defaultLiveBroadcastConfig();
  } catch (error) {
    if (!isMissingLiveBroadcastConfigSchemaError(error)) {
      throw error;
    }

    return defaultLiveBroadcastConfig();
  }
}

export async function updateAdminLiveBroadcastConfigRecord(
  input: UpdateLiveBroadcastConfigInput & {
    eventId: string | null;
    streamVideoId: string | null;
    streamStartAt: string | null;
    streamEndAt: string | null;
    streamOverrideMode: StreamOverrideMode;
  },
): Promise<AdminLiveBroadcastConfig> {
  const result = await getDbPool().query<AdminLiveBroadcastConfigRow>(
    `
      insert into live_broadcast_config (
        id,
        event_id,
        stream_video_id,
        stream_start_at,
        stream_end_at,
        stream_override_mode,
        updated_at
      )
      values (1, $1::uuid, $2, $3::timestamptz, $4::timestamptz, $5, now())
      on conflict (id)
      do update set
        event_id = excluded.event_id,
        stream_video_id = excluded.stream_video_id,
        stream_start_at = excluded.stream_start_at,
        stream_end_at = excluded.stream_end_at,
        stream_override_mode = excluded.stream_override_mode,
        updated_at = now()
      returning
        event_id::text,
        stream_video_id,
        stream_start_at::text,
        stream_end_at::text,
        stream_override_mode,
        updated_at::text
    `,
    [
      input.eventId,
      input.streamVideoId,
      input.streamStartAt,
      input.streamEndAt,
      input.streamOverrideMode,
    ],
  );

  const row = result.rows.at(0);
  if (!row) {
    throw new Error("Failed to update live broadcast config.");
  }

  return mapLiveBroadcastConfig(row);
}

export async function createEventRecord(input: CreateEventInput): Promise<AdminEvent> {
  let result;
  try {
    result = await getDbPool().query<{ id: string }>(
      `
        insert into events (
          championship_id,
          round_number,
          circuit_name,
          event_date,
          stream_video_id,
          stream_start_at,
          stream_end_at,
          stream_override_mode,
          source_sheet,
          source_row,
          is_active,
          updated_at
        )
        values ($1, $2, $3, $4::date, $5, $6::timestamptz, $7::timestamptz, $8, $9, $10, true, now())
        returning id
      `,
      [
        input.championshipId,
        input.roundNumber,
        input.circuitName,
        input.eventDate,
        input.streamVideoId,
        input.streamStartAt,
        input.streamEndAt,
        input.streamOverrideMode,
        input.sourceSheet,
        input.sourceRow,
      ],
    );
  } catch (error) {
    if (!isMissingEventStreamColumnsError(error)) {
      throw error;
    }

    result = await getDbPool().query<{ id: string }>(
      `
        insert into events (
          championship_id,
          round_number,
          circuit_name,
          event_date,
          source_sheet,
          source_row,
          is_active,
          updated_at
        )
        values ($1, $2, $3, $4::date, $5, $6, true, now())
        returning id
      `,
      [
        input.championshipId,
        input.roundNumber,
        input.circuitName,
        input.eventDate,
        input.sourceSheet,
        input.sourceRow,
      ],
    );
  }

  const id = result.rows.at(0)?.id;
  if (!id) {
    throw new Error("Failed to create event.");
  }
  const created = await getEventById(id);
  if (!created) {
    throw new Error("Failed to load created event.");
  }
  return created;
}

export async function updateEventRecord(id: string, input: UpdateEventInput): Promise<AdminEvent | null> {
  const buildUpdatePayload = (useLegacyFallback: boolean) => {
    const fields: string[] = [];
    const values: unknown[] = [];

    if (input.championshipId !== undefined) {
      values.push(input.championshipId);
      fields.push(`championship_id = $${values.length}::uuid`);
    }
    if (input.roundNumber !== undefined) {
      values.push(input.roundNumber);
      fields.push(`round_number = $${values.length}`);
    }
    if (input.circuitName !== undefined) {
      values.push(input.circuitName);
      fields.push(`circuit_name = $${values.length}`);
    }
    if (input.eventDate !== undefined) {
      values.push(input.eventDate);
      fields.push(`event_date = $${values.length}::date`);
    }

    if (!useLegacyFallback) {
      if (input.streamVideoId !== undefined) {
        values.push(input.streamVideoId);
        fields.push(`stream_video_id = $${values.length}`);
      }
      if (input.streamStartAt !== undefined) {
        values.push(input.streamStartAt);
        fields.push(`stream_start_at = $${values.length}::timestamptz`);
      }
      if (input.streamEndAt !== undefined) {
        values.push(input.streamEndAt);
        fields.push(`stream_end_at = $${values.length}::timestamptz`);
      }
      if (input.streamOverrideMode !== undefined) {
        values.push(input.streamOverrideMode);
        fields.push(`stream_override_mode = $${values.length}`);
      }
    }

    return { fields, values };
  };

  const payload = buildUpdatePayload(false);
  if (payload.fields.length === 0) {
    return getEventById(id);
  }

  payload.values.push(id);
  try {
    await getDbPool().query(
      `
        update events
        set ${payload.fields.join(", ")}, updated_at = now()
        where id = $${payload.values.length}
      `,
      payload.values,
    );
  } catch (error) {
    if (!isMissingEventStreamColumnsError(error)) {
      throw error;
    }

    const legacyPayload = buildUpdatePayload(true);
    if (legacyPayload.fields.length === 0) {
      return getEventById(id);
    }

    legacyPayload.values.push(id);
    await getDbPool().query(
      `
        update events
        set ${legacyPayload.fields.join(", ")}, updated_at = now()
        where id = $${legacyPayload.values.length}
      `,
      legacyPayload.values,
    );
  }

  return getEventById(id);
}

export async function setEventActive(id: string, isActive: boolean): Promise<AdminEvent | null> {
  await getDbPool().query(
    `
      update events
      set is_active = $2, updated_at = now()
      where id = $1
    `,
    [id, isActive],
  );
  return getEventById(id);
}

export async function listAdminDrivers(options: {
  includeInactive: boolean;
  query?: string;
}): Promise<AdminDriver[]> {
  const values: unknown[] = [options.includeInactive];
  const clauses = ["($1::boolean = true or is_active = true)"];
  if (options.query && options.query.trim() !== "") {
    values.push(`%${options.query.trim().toLowerCase()}%`);
    clauses.push(
      "(lower(canonical_name) like $2 or lower(slug) like $2 or lower(country_name_es) like $2 or lower(role_es) like $2)",
    );
  }

  const result = await getDbPool().query<AdminDriverRow>(
    `
      select
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
        created_at::text,
        updated_at::text
      from drivers
      where ${clauses.join(" and ")}
      order by sort_name asc
    `,
    values,
  );
  return result.rows.map(mapDriver);
}

export async function getDriverById(id: string): Promise<AdminDriver | null> {
  const result = await getDbPool().query<AdminDriverRow>(
    `
      select
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
        created_at::text,
        updated_at::text
      from drivers
      where id = $1
      limit 1
    `,
    [id],
  );
  const row = result.rows.at(0);
  return row ? mapDriver(row) : null;
}

export async function createDriverRecord(input: CreateDriverInput): Promise<AdminDriver> {
  const result = await getDbPool().query<{ id: string }>(
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
      returning id
    `,
    [
      input.slug,
      input.canonicalName,
      input.sortName,
      input.countryCode,
      input.countryNameEs,
      input.countryNameEn,
      input.roleEs,
      input.roleEn,
    ],
  );
  const id = result.rows.at(0)?.id;
  if (!id) {
    throw new Error("Failed to create driver.");
  }
  const created = await getDriverById(id);
  if (!created) {
    throw new Error("Failed to load created driver.");
  }
  return created;
}

export async function updateDriverRecord(id: string, input: UpdateDriverInput): Promise<AdminDriver | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  if (input.canonicalName !== undefined) {
    values.push(input.canonicalName);
    fields.push(`canonical_name = $${values.length}`);
  }
  if (input.sortName !== undefined) {
    values.push(input.sortName);
    fields.push(`sort_name = $${values.length}`);
  }
  if (input.countryCode !== undefined) {
    values.push(input.countryCode);
    fields.push(`country_code = $${values.length}`);
  }
  if (input.countryNameEs !== undefined) {
    values.push(input.countryNameEs);
    fields.push(`country_name_es = $${values.length}`);
  }
  if (input.countryNameEn !== undefined) {
    values.push(input.countryNameEn);
    fields.push(`country_name_en = $${values.length}`);
  }
  if (input.roleEs !== undefined) {
    values.push(input.roleEs);
    fields.push(`role_es = $${values.length}`);
  }
  if (input.roleEn !== undefined) {
    values.push(input.roleEn);
    fields.push(`role_en = $${values.length}`);
  }
  if (input.isActive !== undefined) {
    values.push(input.isActive);
    fields.push(`is_active = $${values.length}`);
  }
  if (fields.length === 0) {
    return getDriverById(id);
  }
  values.push(id);
  await getDbPool().query(
    `
      update drivers
      set ${fields.join(", ")}, updated_at = now()
      where id = $${values.length}
    `,
    values,
  );
  return getDriverById(id);
}

export async function setDriverActive(id: string, isActive: boolean): Promise<AdminDriver | null> {
  await getDbPool().query(
    `
      update drivers
      set is_active = $2, updated_at = now()
      where id = $1
    `,
    [id, isActive],
  );
  return getDriverById(id);
}

export async function listDriverAliases(driverId: string): Promise<AdminDriverAlias[]> {
  const result = await getDbPool().query<AdminAliasRow>(
    `
      select
        id,
        driver_id,
        alias_original,
        alias_normalized,
        created_at::text
      from driver_aliases
      where driver_id = $1
      order by alias_original asc
    `,
    [driverId],
  );
  return result.rows.map(mapAlias);
}

export async function getAliasById(aliasId: string): Promise<AdminDriverAlias | null> {
  const result = await getDbPool().query<AdminAliasRow>(
    `
      select
        id,
        driver_id,
        alias_original,
        alias_normalized,
        created_at::text
      from driver_aliases
      where id = $1
      limit 1
    `,
    [aliasId],
  );
  const row = result.rows.at(0);
  return row ? mapAlias(row) : null;
}

export async function createDriverAliasRecord(
  driverId: string,
  aliasOriginal: string,
  aliasNormalized: string,
): Promise<AdminDriverAlias> {
  const result = await getDbPool().query<AdminAliasRow>(
    `
      insert into driver_aliases (driver_id, alias_original, alias_normalized)
      values ($1, $2, $3)
      returning
        id,
        driver_id,
        alias_original,
        alias_normalized,
        created_at::text
    `,
    [driverId, aliasOriginal, aliasNormalized],
  );
  const row = result.rows.at(0);
  if (!row) {
    throw new Error("Failed to create alias.");
  }
  return mapAlias(row);
}

export async function deleteAliasRecord(aliasId: string): Promise<boolean> {
  const result = await getDbPool().query("delete from driver_aliases where id = $1", [aliasId]);
  return (result.rowCount ?? 0) > 0;
}

export async function listEventResultsByEventId(eventId: string): Promise<AdminEventResultRow[]> {
  const result = await getDbPool().query<AdminResultRow>(
    `
      select
        er.id,
        er.event_id,
        er.driver_id,
        d.slug as driver_slug,
        d.canonical_name as driver_name,
        er.session_kind,
        er.position,
        er.status::text as status,
        er.raw_value,
        er.is_active,
        er.created_at::text,
        er.updated_at::text
      from event_results er
      join drivers d on d.id = er.driver_id
      where er.event_id = $1
      order by d.sort_name asc, er.session_kind asc
    `,
    [eventId],
  );
  return result.rows.map(mapResultRow);
}

export async function getEventResultsGrid(eventId: string): Promise<AdminEventResultsGrid | null> {
  const event = await getEventById(eventId);
  if (!event) {
    return null;
  }

  const [drivers, rows] = await Promise.all([
    listAdminDrivers({ includeInactive: true }),
    listEventResultsByEventId(eventId),
  ]);

  const byDriver = new Map<
    string,
    {
      primary: AdminEventResultsGrid["drivers"][number]["primary"];
      secondary: AdminEventResultsGrid["drivers"][number]["secondary"];
    }
  >();

  for (const row of rows) {
    const group = byDriver.get(row.driverId) ?? { primary: null, secondary: null };
    const value = {
      position: row.position,
      status: row.status,
      rawValue: row.rawValue,
      isActive: row.isActive,
    };
    if (row.sessionKind === "primary") {
      group.primary = value;
    } else {
      group.secondary = value;
    }
    byDriver.set(row.driverId, group);
  }

  return {
    event,
    drivers: drivers.map((driver) => {
      const group = byDriver.get(driver.id) ?? { primary: null, secondary: null };
      return {
        driverId: driver.id,
        driverSlug: driver.slug,
        driverName: driver.canonicalName,
        primary: group.primary,
        secondary: group.secondary,
      };
    }),
  };
}

export async function replaceEventResults(
  eventId: string,
  rows: EventResultCellInput[],
): Promise<AdminEventResultRow[]> {
  return withTransaction(async (client) => {
    await client.query(
      `
        update event_results
        set is_active = false, updated_at = now()
        where event_id = $1
      `,
      [eventId],
    );

    for (const row of rows) {
      await client.query(
        `
          insert into event_results (
            event_id,
            driver_id,
            session_kind,
            position,
            status,
            raw_value,
            is_active,
            updated_at
          )
          values ($1, $2, $3::session_kind, $4, $5::result_status, $6, $7, now())
          on conflict (event_id, driver_id, session_kind)
          do update set
            position = excluded.position,
            status = excluded.status,
            raw_value = excluded.raw_value,
            is_active = excluded.is_active,
            updated_at = now()
        `,
        [
          eventId,
          row.driverId,
          row.sessionKind,
          row.position,
          row.status,
          row.rawValue,
          row.isActive,
        ],
      );
    }

    const result = await client.query<AdminResultRow>(
      `
        select
          er.id,
          er.event_id,
          er.driver_id,
          d.slug as driver_slug,
          d.canonical_name as driver_name,
          er.session_kind,
          er.position,
          er.status::text as status,
          er.raw_value,
          er.is_active,
          er.created_at::text,
          er.updated_at::text
        from event_results er
        join drivers d on d.id = er.driver_id
        where er.event_id = $1
        order by d.sort_name asc, er.session_kind asc
      `,
      [eventId],
    );
    return result.rows.map(mapResultRow);
  });
}

export async function insertAuditLog(input: {
  actorUserId: string;
  actorUsername: string;
  entityType: string;
  entityId: string | null;
  action: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  requestId: string | null;
}): Promise<AdminAuditLog> {
  const result = await getDbPool().query<AdminAuditRow>(
    `
      insert into audit_logs (
        actor_user_id,
        actor_username,
        entity_type,
        entity_id,
        action,
        before_json,
        after_json,
        request_id
      )
      values ($1, $2, $3, $4::uuid, $5, $6::jsonb, $7::jsonb, $8)
      returning
        id,
        actor_user_id,
        actor_username,
        entity_type,
        entity_id::text,
        action,
        before_json,
        after_json,
        request_id,
        created_at::text
    `,
    [
      input.actorUserId,
      input.actorUsername,
      input.entityType,
      input.entityId,
      input.action,
      JSON.stringify(input.before ?? {}),
      JSON.stringify(input.after ?? {}),
      input.requestId,
    ],
  );
  const row = result.rows.at(0);
  if (!row) {
    throw new Error("Failed to insert audit log.");
  }
  return mapAuditRow(row);
}

export async function listAuditLogs(filters: {
  entityType?: string;
  entityId?: string;
  limit: number;
}): Promise<AdminAuditLog[]> {
  const values: unknown[] = [];
  const clauses: string[] = ["1=1"];
  appendOptionalFilter(values, clauses, filters.entityType, "entity_type = $?");
  appendOptionalFilter(values, clauses, filters.entityId, "entity_id = $?::uuid");
  values.push(filters.limit);

  const result = await getDbPool().query<AdminAuditRow>(
    `
      select
        id,
        actor_user_id,
        actor_username,
        entity_type,
        entity_id::text,
        action,
        before_json,
        after_json,
        request_id,
        created_at::text
      from audit_logs
      where ${clauses.join(" and ")}
      order by created_at desc
      limit $${values.length}
    `,
    values,
  );
  return result.rows.map(mapAuditRow);
}

export async function getAuditById(auditId: string): Promise<AdminAuditLog | null> {
  const result = await getDbPool().query<AdminAuditRow>(
    `
      select
        id,
        actor_user_id,
        actor_username,
        entity_type,
        entity_id::text,
        action,
        before_json,
        after_json,
        request_id,
        created_at::text
      from audit_logs
      where id = $1
      limit 1
    `,
    [auditId],
  );
  const row = result.rows.at(0);
  return row ? mapAuditRow(row) : null;
}

export async function listEntityAuditLogs(
  entityType: string,
  entityId: string,
  limit: number,
): Promise<AdminAuditLog[]> {
  const result = await getDbPool().query<AdminAuditRow>(
    `
      select
        id,
        actor_user_id,
        actor_username,
        entity_type,
        entity_id::text,
        action,
        before_json,
        after_json,
        request_id,
        created_at::text
      from audit_logs
      where entity_type = $1 and entity_id = $2::uuid
      order by created_at desc
      limit $3
    `,
    [entityType, entityId, limit],
  );
  return result.rows.map(mapAuditRow);
}

export async function applyChampionshipSnapshot(snapshot: Record<string, unknown>): Promise<void> {
  if (!snapshot.id) {
    return;
  }
  await getDbPool().query(
    `
      update championships
      set
        season_year = $2,
        name = $3,
        slug = $4,
        primary_session_label = $5,
        secondary_session_label = $6,
        is_active = $7,
        updated_at = now()
      where id = $1::uuid
    `,
    [
      snapshot.id,
      snapshot.seasonYear,
      snapshot.name,
      snapshot.slug,
      snapshot.primarySessionLabel,
      snapshot.secondarySessionLabel,
      snapshot.isActive ?? true,
    ],
  );
}

export async function applyEventSnapshot(snapshot: Record<string, unknown>): Promise<void> {
  if (!snapshot.id) {
    return;
  }
  try {
    await getDbPool().query(
      `
        update events
        set
          championship_id = $2::uuid,
          round_number = $3,
          circuit_name = $4,
          event_date = $5::date,
          stream_video_id = $6,
          stream_start_at = $7::timestamptz,
          stream_end_at = $8::timestamptz,
          stream_override_mode = $9,
          is_active = $10,
          updated_at = now()
        where id = $1::uuid
      `,
      [
        snapshot.id,
        snapshot.championshipId,
        snapshot.roundNumber,
        snapshot.circuitName,
        snapshot.eventDate ?? null,
        snapshot.streamVideoId ?? null,
        snapshot.streamStartAt ?? null,
        snapshot.streamEndAt ?? null,
        snapshot.streamOverrideMode ?? "auto",
        snapshot.isActive ?? true,
      ],
    );
  } catch (error) {
    if (!isMissingEventStreamColumnsError(error)) {
      throw error;
    }

    await getDbPool().query(
      `
        update events
        set
          championship_id = $2::uuid,
          round_number = $3,
          circuit_name = $4,
          event_date = $5::date,
          is_active = $6,
          updated_at = now()
        where id = $1::uuid
      `,
      [
        snapshot.id,
        snapshot.championshipId,
        snapshot.roundNumber,
        snapshot.circuitName,
        snapshot.eventDate ?? null,
        snapshot.isActive ?? true,
      ],
    );
  }
}

export async function applyDriverSnapshot(snapshot: Record<string, unknown>): Promise<void> {
  if (!snapshot.id) {
    return;
  }
  await getDbPool().query(
    `
      update drivers
      set
        canonical_name = $2,
        sort_name = $3,
        country_code = $4,
        country_name_es = $5,
        country_name_en = $6,
        role_es = $7,
        role_en = $8,
        is_active = $9,
        updated_at = now()
      where id = $1::uuid
    `,
    [
      snapshot.id,
      snapshot.canonicalName,
      snapshot.sortName,
      snapshot.countryCode,
      snapshot.countryNameEs,
      snapshot.countryNameEn,
      snapshot.roleEs,
      snapshot.roleEn,
      snapshot.isActive ?? true,
    ],
  );
}

export async function applyEventResultsSnapshot(
  eventId: string,
  snapshotRows: EventResultCellInput[],
): Promise<void> {
  await replaceEventResults(eventId, snapshotRows);
}

