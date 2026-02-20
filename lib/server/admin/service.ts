import {
  createAdminSessionToken,
  generateTemporaryPassword,
  getAdminRuntimeConfig,
  hashAdminPassword,
  isAdminDryRunMode,
  parseAdminSessionToken,
  verifyAdminPassword,
} from "./auth";
import {
  AdminAuthError,
  AdminForbiddenError,
  AdminNotFoundError,
  AdminValidationError,
} from "./errors";
import {
  applyChampionshipSnapshot,
  applyDriverSnapshot,
  applyEventResultsSnapshot,
  applyEventSnapshot,
  createAdminUserRecord,
  createChampionshipRecord,
  createDriverAliasRecord,
  createDriverRecord,
  createEventRecord,
  deleteAliasRecord,
  getAdminLiveBroadcastConfigRecord,
  getAdminUserByUsernameNormalized,
  getAdminUserById,
  getAliasById,
  getChampionshipById,
  getDriverById,
  getEventById,
  getEventResultsGrid,
  insertAuditLog,
  listAdminChampionships,
  listAdminDrivers,
  listAdminEvents,
  listAdminUsers,
  listAuditLogs,
  listDriverAliases,
  listEntityAuditLogs,
  listEventResultsByEventId,
  markAdminLoginFailure,
  markAdminLoginSuccess,
  replaceEventResults,
  setChampionshipActive,
  setDriverActive,
  setEventActive,
  updateAdminUserPassword,
  updateAdminUserRecord,
  updateChampionshipRecord,
  updateDriverRecord,
  updateEventRecord,
  updateAdminLiveBroadcastConfigRecord,
} from "./repository";
import type {
  AdminLiveBroadcastConfig,
  AdminAuditLog,
  AdminChampionship,
  AdminDriver,
  AdminDriverAlias,
  AdminEvent,
  AdminEventResultsGrid,
  AdminRole,
  AdminSession,
  StreamOverrideMode,
  AdminUser,
  AdminWriteResult,
  CreateAdminUserInput,
  CreateChampionshipInput,
  CreateDriverInput,
  CreateEventInput,
  EventResultCellInput,
  RevertRequest,
  RevertResult,
  UpdateAdminUserInput,
  UpdateChampionshipInput,
  UpdateDriverInput,
  UpdateEventInput,
  UpdateLiveBroadcastConfigInput,
} from "./types";

type AdminActor = {
  userId: string;
  username: string;
  role: AdminRole;
  mustChangePassword: boolean;
};

type RequestOptions = {
  requestId?: string | null;
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const REVERTABLE_ENTITY_TYPES = new Set(["championship", "event", "driver", "event_results"]);
const DEFAULT_ROLE_ES = "Piloto";
const DEFAULT_ROLE_EN = "Driver";
const YOUTUBE_VIDEO_ID_REGEX = /^[A-Za-z0-9_-]{11}$/;
const ART_LOCAL_DATETIME_REGEX = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;
const ISO_DATETIME_WITH_TZ_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/;
const STREAM_OVERRIDE_MODES = new Set<StreamOverrideMode>(["auto", "force_on", "force_off"]);

const COUNTRY_CATALOG: Record<string, { code: string; nameEs: string; nameEn: string }> = {
  ar: { code: "ar", nameEs: "Argentina", nameEn: "Argentina" },
  bo: { code: "bo", nameEs: "Bolivia", nameEn: "Bolivia" },
  br: { code: "br", nameEs: "Brasil", nameEn: "Brazil" },
  cl: { code: "cl", nameEs: "Chile", nameEn: "Chile" },
  co: { code: "co", nameEs: "Colombia", nameEn: "Colombia" },
  cr: { code: "cr", nameEs: "Costa Rica", nameEn: "Costa Rica" },
  ec: { code: "ec", nameEs: "Ecuador", nameEn: "Ecuador" },
  gy: { code: "gy", nameEs: "Guyana", nameEn: "Guyana" },
  mx: { code: "mx", nameEs: "Mexico", nameEn: "Mexico" },
  pe: { code: "pe", nameEs: "Peru", nameEn: "Peru" },
  py: { code: "py", nameEs: "Paraguay", nameEn: "Paraguay" },
  sr: { code: "sr", nameEs: "Surinam", nameEn: "Suriname" },
  uy: { code: "uy", nameEs: "Uruguay", nameEn: "Uruguay" },
  ve: { code: "ve", nameEs: "Venezuela", nameEn: "Venezuela" },
};

function assertRole(actor: AdminActor, allowed: AdminRole[]): void {
  if (!allowed.includes(actor.role)) {
    throw new AdminForbiddenError("Forbidden.");
  }
}

function assertEntityType(value: string): string {
  const normalized = value.trim();
  if (!REVERTABLE_ENTITY_TYPES.has(normalized)) {
    throw new AdminValidationError("entityType is invalid.");
  }
  return normalized;
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function validateRequiredText(value: string, fieldName: string): string {
  const normalized = normalizeWhitespace(value);
  if (!normalized) {
    throw new AdminValidationError(`${fieldName} is required.`);
  }
  return normalized;
}

function normalizeUserIdentity(value: string): string {
  return normalizeWhitespace(value).toLowerCase();
}

function validateUuid(value: string, fieldName: string): string {
  const normalized = value.trim();
  if (!UUID_REGEX.test(normalized)) {
    throw new AdminValidationError(`${fieldName} must be a UUID.`);
  }
  return normalized;
}

function validateUserIdentity(value: string): string {
  const normalized = normalizeUserIdentity(value);
  if (normalized.length < 3 || normalized.length > 64) {
    throw new AdminValidationError("username must have between 3 and 64 characters.");
  }

  if (!/^[a-z0-9][a-z0-9._@ -]*$/.test(normalized)) {
    throw new AdminValidationError("username has invalid characters.");
  }

  return normalized;
}

function validatePassword(value: string, fieldName = "password"): string {
  if (!value || value.length < 10) {
    throw new AdminValidationError(`${fieldName} must have at least 10 characters.`);
  }
  return value;
}

function validateSlug(value: string, fieldName: string): string {
  const normalized = value.trim().toLowerCase();
  if (!/^[a-z0-9-]+$/.test(normalized)) {
    throw new AdminValidationError(`${fieldName} must be a slug.`);
  }
  return normalized;
}

function validateYear(value: number): number {
  if (!Number.isInteger(value) || value < 2000 || value > 2100) {
    throw new AdminValidationError("seasonYear is invalid.");
  }
  return value;
}

function validatePositiveInt(value: number, field: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new AdminValidationError(`${field} must be a positive integer.`);
  }
  return value;
}

function validateDateInput(value: string | null | undefined, field: string): string | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const normalized = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new AdminValidationError(`${field} must be YYYY-MM-DD.`);
  }
  const parsed = Date.parse(`${normalized}T00:00:00Z`);
  if (!Number.isFinite(parsed)) {
    throw new AdminValidationError(`${field} is invalid.`);
  }
  return normalized;
}

export type EventStreamState = {
  streamVideoId: string | null;
  streamStartAt: string | null;
  streamEndAt: string | null;
  streamOverrideMode: StreamOverrideMode;
};

type EventStreamPatchInput = {
  streamVideoId?: string | null;
  streamStartAt?: string | null;
  streamEndAt?: string | null;
  streamOverrideMode?: string | StreamOverrideMode | null;
};

function extractIdFromYouTubeUrl(input: URL): string | null {
  const host = input.hostname.toLowerCase();
  const path = input.pathname;

  if (host === "youtu.be" || host === "www.youtu.be") {
    const segment = path.split("/").filter(Boolean).at(0);
    return segment ?? null;
  }

  if (host !== "youtube.com" && host !== "www.youtube.com" && host !== "m.youtube.com") {
    return null;
  }

  if (path === "/watch") {
    return input.searchParams.get("v");
  }

  const segments = path.split("/").filter(Boolean);
  const lead = segments.at(0);
  if (lead === "live" || lead === "shorts" || lead === "embed") {
    return segments.at(1) ?? null;
  }

  return null;
}

export function parseYouTubeVideoId(value: string | null | undefined, field = "streamVideoId"): string | null {
  if (value === undefined || value === null || value.trim() === "") {
    return null;
  }

  const normalized = value.trim();
  if (YOUTUBE_VIDEO_ID_REGEX.test(normalized)) {
    return normalized;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(normalized);
  } catch {
    throw new AdminValidationError(`${field} must be a valid YouTube URL or video ID.`);
  }

  const extracted = extractIdFromYouTubeUrl(parsedUrl);
  if (!extracted || !YOUTUBE_VIDEO_ID_REGEX.test(extracted)) {
    throw new AdminValidationError(`${field} must contain a valid YouTube video ID.`);
  }

  return extracted;
}

function normalizeIsoDateTimeWithTimezone(value: string, field: string): string {
  if (!ISO_DATETIME_WITH_TZ_REGEX.test(value)) {
    throw new AdminValidationError(`${field} must be ISO-8601 with timezone or datetime-local (ART).`);
  }
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    throw new AdminValidationError(`${field} is invalid.`);
  }
  return new Date(parsed).toISOString();
}

export function parseStreamDateTimeInput(value: string | null | undefined, field: string): string | null {
  if (value === undefined || value === null || value.trim() === "") {
    return null;
  }

  const normalized = value.trim();
  const localMatch = ART_LOCAL_DATETIME_REGEX.exec(normalized);
  if (!localMatch) {
    return normalizeIsoDateTimeWithTimezone(normalized, field);
  }

  const year = Number(localMatch[1]);
  const month = Number(localMatch[2]);
  const day = Number(localMatch[3]);
  const hour = Number(localMatch[4]);
  const minute = Number(localMatch[5]);
  const second = Number(localMatch[6] ?? "0");

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    !Number.isInteger(second) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59 ||
    second < 0 ||
    second > 59
  ) {
    throw new AdminValidationError(`${field} is invalid.`);
  }

  const utcMillis = Date.UTC(year, month - 1, day, hour + 3, minute, second, 0);
  const localCheck = new Date(utcMillis - 3 * 60 * 60 * 1000);
  if (
    localCheck.getUTCFullYear() !== year ||
    localCheck.getUTCMonth() + 1 !== month ||
    localCheck.getUTCDate() !== day ||
    localCheck.getUTCHours() !== hour ||
    localCheck.getUTCMinutes() !== minute ||
    localCheck.getUTCSeconds() !== second
  ) {
    throw new AdminValidationError(`${field} is invalid.`);
  }

  return new Date(utcMillis).toISOString();
}

function normalizeStreamOverrideMode(value: string | StreamOverrideMode | null | undefined, field: string): StreamOverrideMode {
  if (value === null || value === undefined || value === "") {
    return "auto";
  }

  const normalized = String(value).trim().toLowerCase() as StreamOverrideMode;
  if (!STREAM_OVERRIDE_MODES.has(normalized)) {
    throw new AdminValidationError(`${field} is invalid.`);
  }

  return normalized;
}

function validateStreamState(state: EventStreamState): void {
  const hasStart = state.streamStartAt !== null;
  const hasEnd = state.streamEndAt !== null;

  if (hasStart !== hasEnd) {
    throw new AdminValidationError("streamStartAt and streamEndAt must be provided together.");
  }

  if (hasStart && hasEnd) {
    const startMillis = Date.parse(state.streamStartAt ?? "");
    const endMillis = Date.parse(state.streamEndAt ?? "");
    if (!Number.isFinite(startMillis) || !Number.isFinite(endMillis) || endMillis <= startMillis) {
      throw new AdminValidationError("streamEndAt must be greater than streamStartAt.");
    }
  }

  if (!state.streamVideoId) {
    if (hasStart || hasEnd) {
      throw new AdminValidationError("streamVideoId is required when stream schedule is configured.");
    }
    if (state.streamOverrideMode === "force_on") {
      throw new AdminValidationError("streamOverrideMode force_on requires streamVideoId.");
    }
  }
}

export function normalizeEventStreamPatch(
  previous: EventStreamState,
  patch: EventStreamPatchInput,
): { next: EventStreamState; changes: Partial<EventStreamState> } {
  const next: EventStreamState = { ...previous };
  const changes: Partial<EventStreamState> = {};

  if (patch.streamVideoId !== undefined) {
    const normalized = parseYouTubeVideoId(patch.streamVideoId, "streamVideoId");
    next.streamVideoId = normalized;
    changes.streamVideoId = normalized;
  }

  if (patch.streamStartAt !== undefined) {
    const normalized = parseStreamDateTimeInput(patch.streamStartAt, "streamStartAt");
    next.streamStartAt = normalized;
    changes.streamStartAt = normalized;
  }

  if (patch.streamEndAt !== undefined) {
    const normalized = parseStreamDateTimeInput(patch.streamEndAt, "streamEndAt");
    next.streamEndAt = normalized;
    changes.streamEndAt = normalized;
  }

  if (patch.streamOverrideMode !== undefined) {
    const normalized = normalizeStreamOverrideMode(patch.streamOverrideMode, "streamOverrideMode");
    next.streamOverrideMode = normalized;
    changes.streamOverrideMode = normalized;
  }

  validateStreamState(next);
  return { next, changes };
}

function validateCountryCode(value: string | undefined): string {
  const normalized = normalizeWhitespace(value ?? "ar").toLowerCase();
  if (!/^[a-z]{2}$/.test(normalized)) {
    throw new AdminValidationError("countryCode must be a 2-letter code.");
  }
  return normalized;
}

function resolveCountry(value: string | undefined): { code: string; nameEs: string; nameEn: string } {
  const code = validateCountryCode(value);
  const country = COUNTRY_CATALOG[code];
  if (!country) {
    throw new AdminValidationError("countryCode is not supported.");
  }
  return country;
}

function withFallbackText(value: string | undefined, fallback: string): string {
  const normalized = normalizeWhitespace(value ?? "");
  return normalized || fallback;
}

function toSlug(value: string): string {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!normalized) {
    throw new AdminValidationError("canonicalName must contain letters or numbers.");
  }

  return normalized;
}

function toSortName(canonicalName: string): string {
  const parts = canonicalName.split(/\s+/).filter(Boolean);
  if (parts.length <= 1) {
    return canonicalName;
  }

  const lastName = parts.at(-1) ?? canonicalName;
  const firstNames = parts.slice(0, -1).join(" ");
  return `${lastName}, ${firstNames}`;
}

async function buildUniqueDriverSlug(canonicalName: string): Promise<string> {
  const base = toSlug(canonicalName);
  const existingDrivers = await listAdminDrivers({ includeInactive: true });
  const existingSlugs = new Set(existingDrivers.map((driver) => driver.slug));

  if (!existingSlugs.has(base)) {
    return base;
  }

  let suffix = 2;
  let candidate = `${base}-${suffix}`;
  while (existingSlugs.has(candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  return candidate;
}

async function buildUniqueChampionshipSlug(seasonYear: number, sourceValue: string): Promise<string> {
  const base = toSlug(sourceValue);
  const existingChampionships = await listAdminChampionships(true);
  const existingSlugs = new Set(
    existingChampionships
      .filter((championship) => championship.seasonYear === seasonYear)
      .map((championship) => championship.slug),
  );

  if (!existingSlugs.has(base)) {
    return base;
  }

  let suffix = 2;
  let candidate = `${base}-${suffix}`;
  while (existingSlugs.has(candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  return candidate;
}

function normalizeAlias(value: string): string {
  const compact = normalizeWhitespace(value);
  return compact
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function validateRole(role: string): AdminRole {
  if (role !== "owner" && role !== "editor") {
    throw new AdminValidationError("role is invalid.");
  }
  return role;
}

function validateResultCell(row: EventResultCellInput): EventResultCellInput {
  validateUuid(row.driverId, "driverId");

  if (row.sessionKind !== "primary" && row.sessionKind !== "secondary") {
    throw new AdminValidationError("sessionKind is invalid.");
  }

  const hasPosition = row.position !== null;
  const hasStatus = row.status !== null;
  if (hasPosition === hasStatus) {
    throw new AdminValidationError("Each result row must have either position or status.");
  }

  if (hasPosition) {
    if (!Number.isInteger(row.position) || (row.position ?? 0) <= 0) {
      throw new AdminValidationError("position must be > 0.");
    }
  }

  if (hasStatus && !["DNF", "DNQ", "DSQ", "ABSENT"].includes(String(row.status))) {
    throw new AdminValidationError("status is invalid.");
  }

  return {
    driverId: row.driverId,
    sessionKind: row.sessionKind,
    position: row.position,
    status: row.status,
    rawValue: normalizeWhitespace(row.rawValue),
    isActive: row.isActive,
  };
}

function withWriteResult<T>(dryRun: boolean, data: T, warnings: string[] = []): AdminWriteResult<T> {
  return {
    ok: true,
    dryRun,
    data,
    warnings,
  };
}

function buildSession(user: Pick<AdminUser, "id" | "username" | "role" | "mustChangePassword">): {
  session: AdminSession;
  token: string;
} {
  const token = createAdminSessionToken({
    userId: user.id,
    username: user.username,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
  });
  const session = parseAdminSessionToken(token);
  return {
    session,
    token,
  };
}

function actorRecord(actor: AdminActor): { actorUserId: string; actorUsername: string } {
  return {
    actorUserId: actor.userId,
    actorUsername: actor.username,
  };
}

function hasObjectKeys(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length > 0;
}

function toResultSnapshotRows(value: unknown): EventResultCellInput[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const rows: EventResultCellInput[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const row = entry as Partial<EventResultCellInput>;
    if (typeof row.driverId !== "string") {
      continue;
    }

    const sessionKind = row.sessionKind;
    if (sessionKind !== "primary" && sessionKind !== "secondary") {
      continue;
    }

    const rawValue = typeof row.rawValue === "string" ? row.rawValue : "";
    const status = row.status ?? null;
    const position = typeof row.position === "number" ? row.position : null;
    const isActive = row.isActive !== false;

    rows.push(
      validateResultCell({
        driverId: row.driverId,
        sessionKind,
        position,
        status,
        rawValue,
        isActive,
      }),
    );
  }

  return rows;
}

function toEventResultCells(
  rows: Array<{
    driverId: string;
    sessionKind: "primary" | "secondary";
    position: number | null;
    status: "DNF" | "DNQ" | "DSQ" | "ABSENT" | null;
    rawValue: string;
    isActive: boolean;
  }>,
): EventResultCellInput[] {
  return rows.map((row) => ({
    driverId: row.driverId,
    sessionKind: row.sessionKind,
    position: row.position,
    status: row.status,
    rawValue: row.rawValue,
    isActive: row.isActive,
  }));
}

function requestIdFromOptions(options?: RequestOptions): string | null {
  return options?.requestId ?? null;
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

export function getAdminWriteDryRunMode(): boolean {
  return isAdminDryRunMode();
}

export async function resolveAdminActor(session: AdminSession): Promise<AdminActor> {
  const user = await getAdminUserById(session.userId);
  if (!user || !user.isActive) {
    throw new AdminAuthError("Unauthorized.");
  }

  return {
    userId: user.id,
    username: user.username,
    role: user.role,
    mustChangePassword: user.mustChangePassword,
  };
}

export async function loginAdminUser(input: {
  username: string;
  password: string;
}): Promise<{
  session: AdminSession;
  token: string;
}> {
  const config = getAdminRuntimeConfig();
  const identityNormalized = validateUserIdentity(input.username);
  const user = await getAdminUserByUsernameNormalized(identityNormalized);
  const fallbackHash = await hashAdminPassword("sinta-admin-login-fallback-password");

  if (!user || !user.isActive) {
    await verifyAdminPassword(input.password, fallbackHash);
    throw new AdminAuthError("Invalid credentials.");
  }

  if (user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()) {
    throw new AdminAuthError("Account is temporarily locked.");
  }

  const passwordIsValid = await verifyAdminPassword(input.password, user.passwordHash);
  if (!passwordIsValid) {
    const nextFailedAttempts = user.failedAttempts + 1;
    const lockUntilIso =
      nextFailedAttempts >= config.maxFailedAttempts
        ? new Date(Date.now() + config.lockMinutes * 60_000).toISOString()
        : null;

    await markAdminLoginFailure(user.id, lockUntilIso);
    throw new AdminAuthError("Invalid credentials.");
  }

  await markAdminLoginSuccess(user.id);

  const refreshed = await getAdminUserById(user.id);
  if (!refreshed || !refreshed.isActive) {
    throw new AdminAuthError("Unauthorized.");
  }

  return buildSession(refreshed);
}

export async function getAdminSessionByUserId(userId: string): Promise<AdminSession> {
  validateUuid(userId, "userId");

  const user = await getAdminUserById(userId);
  if (!user || !user.isActive) {
    throw new AdminAuthError("Unauthorized.");
  }

  return buildSession(user).session;
}

export async function changeOwnPassword(
  actor: AdminActor,
  currentPassword: string,
  nextPassword: string,
  options?: RequestOptions,
): Promise<{
  session: AdminSession;
  token: string;
}> {
  validatePassword(currentPassword, "currentPassword");
  validatePassword(nextPassword, "nextPassword");

  const user = await getAdminUserByUsernameNormalized(normalizeUserIdentity(actor.username));
  if (!user || !user.isActive) {
    throw new AdminAuthError("Unauthorized.");
  }

  const ok = await verifyAdminPassword(currentPassword, user.passwordHash);
  if (!ok) {
    throw new AdminAuthError("Invalid credentials.");
  }

  const passwordHash = await hashAdminPassword(nextPassword);
  await updateAdminUserPassword(user.id, passwordHash, false);

  await insertAuditLog({
    ...actorRecord(actor),
    entityType: "user",
    entityId: user.id,
    action: "change_password",
    before: {
      mustChangePassword: user.mustChangePassword,
    },
    after: {
      mustChangePassword: false,
    },
    requestId: requestIdFromOptions(options),
  });

  const updated = await getAdminUserById(user.id);
  if (!updated) {
    throw new AdminAuthError("Unauthorized.");
  }

  return buildSession(updated);
}

export async function listUsers(actor: AdminActor): Promise<AdminUser[]> {
  assertRole(actor, ["owner"]);
  return listAdminUsers();
}

export async function createUser(
  actor: AdminActor,
  input: CreateAdminUserInput,
  options?: RequestOptions,
): Promise<AdminWriteResult<{ user: AdminUser; temporaryPassword: string }>> {
  assertRole(actor, ["owner"]);

  const username = normalizeWhitespace(input.username);
  const identityNormalized = validateUserIdentity(username);
  const role = validateRole(input.role);

  const existing = await getAdminUserByUsernameNormalized(identityNormalized);
  if (existing) {
    throw new AdminValidationError("username already exists.");
  }

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashAdminPassword(temporaryPassword);
  const dryRun = getAdminWriteDryRunMode();

  if (dryRun) {
    const now = new Date().toISOString();
    return withWriteResult(
      true,
      {
        user: {
          id: "dry-run",
          username: username,
          role,
          isActive: true,
          mustChangePassword: true,
          failedAttempts: 0,
          lockedUntil: null,
          lastLoginAt: null,
          createdAt: now,
          updatedAt: now,
        },
        temporaryPassword,
      },
      ["Dry-run mode: user was not created."],
    );
  }

  const user = await createAdminUserRecord({
    username: username,
    usernameNormalized: identityNormalized,
    role,
    passwordHash,
    createdBy: actor.userId,
  });

  await insertAuditLog({
    ...actorRecord(actor),
    entityType: "user",
    entityId: user.id,
    action: "create",
    before: {},
    after: user as unknown as Record<string, unknown>,
    requestId: requestIdFromOptions(options),
  });

  return withWriteResult(false, { user, temporaryPassword });
}

export async function updateUser(
  actor: AdminActor,
  userId: string,
  input: UpdateAdminUserInput,
  options?: RequestOptions,
): Promise<AdminWriteResult<{ user: AdminUser }>> {
  assertRole(actor, ["owner"]);

  const id = validateUuid(userId, "userId");
  const before = await getAdminUserById(id);
  if (!before) {
    throw new AdminNotFoundError(`User not found: ${id}`);
  }

  const payload: UpdateAdminUserInput = {};
  if (input.role !== undefined) {
    payload.role = validateRole(input.role);
  }
  if (input.isActive !== undefined) {
    payload.isActive = Boolean(input.isActive);
  }

  const dryRun = getAdminWriteDryRunMode();
  if (dryRun) {
    return withWriteResult(
      true,
      {
        user: {
          ...before,
          role: payload.role ?? before.role,
          isActive: payload.isActive ?? before.isActive,
        },
      },
      ["Dry-run mode: user was not updated."],
    );
  }

  const updated = await updateAdminUserRecord(id, payload);
  if (!updated) {
    throw new AdminNotFoundError(`User not found: ${id}`);
  }

  await insertAuditLog({
    ...actorRecord(actor),
    entityType: "user",
    entityId: id,
    action: "update",
    before: before as unknown as Record<string, unknown>,
    after: updated as unknown as Record<string, unknown>,
    requestId: requestIdFromOptions(options),
  });

  return withWriteResult(false, { user: updated });
}

export async function setUserActive(
  actor: AdminActor,
  userId: string,
  isActive: boolean,
  options?: RequestOptions,
): Promise<AdminWriteResult<{ user: AdminUser }>> {
  return updateUser(actor, userId, { isActive }, options);
}

export async function resetUserPassword(
  actor: AdminActor,
  userId: string,
  options?: RequestOptions,
): Promise<AdminWriteResult<{ temporaryPassword: string }>> {
  assertRole(actor, ["owner"]);

  const id = validateUuid(userId, "userId");
  if (actor.userId === id) {
    throw new AdminValidationError("You cannot reset your own password.");
  }

  const user = await getAdminUserById(id);
  if (!user) {
    throw new AdminNotFoundError(`User not found: ${id}`);
  }

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashAdminPassword(temporaryPassword);
  const dryRun = getAdminWriteDryRunMode();

  if (dryRun) {
    return withWriteResult(true, { temporaryPassword }, ["Dry-run mode: password was not reset."]);
  }

  await updateAdminUserPassword(id, passwordHash, true);

  await insertAuditLog({
    ...actorRecord(actor),
    entityType: "user",
    entityId: id,
    action: "reset_password",
    before: {
      mustChangePassword: user.mustChangePassword,
    },
    after: {
      mustChangePassword: true,
    },
    requestId: requestIdFromOptions(options),
  });

  return withWriteResult(false, { temporaryPassword });
}

export async function listChampionships(actor: AdminActor, includeInactive: boolean): Promise<AdminChampionship[]> {
  assertRole(actor, ["owner", "editor"]);
  return listAdminChampionships(includeInactive);
}

export async function createChampionship(
  actor: AdminActor,
  input: CreateChampionshipInput,
  options?: RequestOptions,
): Promise<AdminWriteResult<{ championship: AdminChampionship }>> {
  assertRole(actor, ["owner", "editor"]);

  const seasonYear = validateYear(input.seasonYear);
  const name = validateRequiredText(input.name, "name");
  const requestedSlug = normalizeWhitespace(input.slug);
  const slugBase = requestedSlug ? validateSlug(requestedSlug, "slug") : name;
  const slug = await buildUniqueChampionshipSlug(seasonYear, slugBase);

  const payload: CreateChampionshipInput = {
    seasonYear,
    name,
    slug,
    primarySessionLabel: validateRequiredText(input.primarySessionLabel, "primarySessionLabel"),
    secondarySessionLabel: validateRequiredText(input.secondarySessionLabel, "secondarySessionLabel"),
  };

  const dryRun = getAdminWriteDryRunMode();
  if (dryRun) {
    const now = new Date().toISOString();
    return withWriteResult(
      true,
      {
        championship: {
          id: "dry-run",
          seasonYear: payload.seasonYear,
          name: payload.name,
          slug: payload.slug,
          primarySessionLabel: payload.primarySessionLabel,
          secondarySessionLabel: payload.secondarySessionLabel,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
      },
      ["Dry-run mode: championship was not created."],
    );
  }

  const championship = await createChampionshipRecord(payload);

  await insertAuditLog({
    ...actorRecord(actor),
    entityType: "championship",
    entityId: championship.id,
    action: "create",
    before: {},
    after: championship as unknown as Record<string, unknown>,
    requestId: requestIdFromOptions(options),
  });

  return withWriteResult(false, { championship });
}

export async function updateChampionship(
  actor: AdminActor,
  championshipId: string,
  input: UpdateChampionshipInput,
  options?: RequestOptions,
): Promise<AdminWriteResult<{ championship: AdminChampionship }>> {
  assertRole(actor, ["owner", "editor"]);

  const id = validateUuid(championshipId, "championshipId");
  const before = await getChampionshipById(id);
  if (!before) {
    throw new AdminNotFoundError(`Championship not found: ${id}`);
  }

  const payload: UpdateChampionshipInput = {};
  if (input.seasonYear !== undefined) {
    payload.seasonYear = validateYear(input.seasonYear);
  }
  if (input.name !== undefined) {
    payload.name = validateRequiredText(input.name, "name");
  }
  if (input.primarySessionLabel !== undefined) {
    payload.primarySessionLabel = validateRequiredText(input.primarySessionLabel, "primarySessionLabel");
  }
  if (input.secondarySessionLabel !== undefined) {
    payload.secondarySessionLabel = validateRequiredText(input.secondarySessionLabel, "secondarySessionLabel");
  }

  const dryRun = getAdminWriteDryRunMode();
  if (dryRun) {
    return withWriteResult(
      true,
      {
        championship: {
          ...before,
          seasonYear: payload.seasonYear ?? before.seasonYear,
          name: payload.name ?? before.name,
          primarySessionLabel: payload.primarySessionLabel ?? before.primarySessionLabel,
          secondarySessionLabel: payload.secondarySessionLabel ?? before.secondarySessionLabel,
        },
      },
      ["Dry-run mode: championship was not updated."],
    );
  }

  const updated = await updateChampionshipRecord(id, payload);
  if (!updated) {
    throw new AdminNotFoundError(`Championship not found: ${id}`);
  }

  await insertAuditLog({
    ...actorRecord(actor),
    entityType: "championship",
    entityId: id,
    action: "update",
    before: before as unknown as Record<string, unknown>,
    after: updated as unknown as Record<string, unknown>,
    requestId: requestIdFromOptions(options),
  });

  return withWriteResult(false, { championship: updated });
}

export async function setChampionshipIsActive(
  actor: AdminActor,
  championshipId: string,
  isActive: boolean,
  options?: RequestOptions,
): Promise<AdminWriteResult<{ championship: AdminChampionship }>> {
  assertRole(actor, ["owner", "editor"]);

  const id = validateUuid(championshipId, "championshipId");
  const before = await getChampionshipById(id);
  if (!before) {
    throw new AdminNotFoundError(`Championship not found: ${id}`);
  }

  const dryRun = getAdminWriteDryRunMode();
  if (dryRun) {
    return withWriteResult(
      true,
      {
        championship: {
          ...before,
          isActive,
        },
      },
      ["Dry-run mode: championship active flag was not changed."],
    );
  }

  const updated = await setChampionshipActive(id, isActive);
  if (!updated) {
    throw new AdminNotFoundError(`Championship not found: ${id}`);
  }

  await insertAuditLog({
    ...actorRecord(actor),
    entityType: "championship",
    entityId: id,
    action: "set_active",
    before: before as unknown as Record<string, unknown>,
    after: updated as unknown as Record<string, unknown>,
    requestId: requestIdFromOptions(options),
  });

  return withWriteResult(false, { championship: updated });
}

export async function listEvents(
  actor: AdminActor,
  filters: {
    includeInactive: boolean;
    year?: number;
    championshipId?: string;
  },
): Promise<AdminEvent[]> {
  assertRole(actor, ["owner", "editor"]);

  const payload: {
    includeInactive: boolean;
    year?: number;
    championshipId?: string;
  } = {
    includeInactive: filters.includeInactive,
  };

  if (filters.year !== undefined) {
    payload.year = validateYear(filters.year);
  }
  if (filters.championshipId) {
    payload.championshipId = validateUuid(filters.championshipId, "championshipId");
  }

  return listAdminEvents(payload);
}

export async function getLiveBroadcastConfig(actor: AdminActor): Promise<AdminLiveBroadcastConfig> {
  assertRole(actor, ["owner", "editor"]);
  return getAdminLiveBroadcastConfigRecord();
}

export async function updateLiveBroadcastConfig(
  actor: AdminActor,
  input: UpdateLiveBroadcastConfigInput,
  options?: RequestOptions,
): Promise<AdminWriteResult<{ config: AdminLiveBroadcastConfig }>> {
  assertRole(actor, ["owner", "editor"]);

  const before = await getAdminLiveBroadcastConfigRecord();
  const streamPatch = normalizeEventStreamPatch(
    {
      streamVideoId: before.streamVideoId,
      streamStartAt: before.streamStartAt,
      streamEndAt: before.streamEndAt,
      streamOverrideMode: before.streamOverrideMode,
    },
    {
      streamVideoId: input.streamVideoId,
      streamStartAt: input.streamStartAt,
      streamEndAt: input.streamEndAt,
      streamOverrideMode: input.streamOverrideMode,
    },
  );

  let nextEventId = before.eventId;
  if (input.eventId !== undefined) {
    if (input.eventId === null || input.eventId.trim() === "") {
      nextEventId = null;
    } else {
      const eventId = validateUuid(input.eventId, "eventId");
      const event = await getEventById(eventId);
      if (!event) {
        throw new AdminNotFoundError(`Event not found: ${eventId}`);
      }
      nextEventId = eventId;
    }
  }

  const nextConfig: AdminLiveBroadcastConfig = {
    eventId: nextEventId,
    streamVideoId: streamPatch.next.streamVideoId,
    streamStartAt: streamPatch.next.streamStartAt,
    streamEndAt: streamPatch.next.streamEndAt,
    streamOverrideMode: streamPatch.next.streamOverrideMode,
    updatedAt: before.updatedAt,
  };

  const dryRun = getAdminWriteDryRunMode();
  if (dryRun) {
    return withWriteResult(
      true,
      {
        config: {
          ...nextConfig,
          updatedAt: new Date().toISOString(),
        },
      },
      ["Dry-run mode: live broadcast config was not updated."],
    );
  }

  let updated: AdminLiveBroadcastConfig;
  try {
    updated = await updateAdminLiveBroadcastConfigRecord({
      eventId: nextConfig.eventId,
      streamVideoId: nextConfig.streamVideoId,
      streamStartAt: nextConfig.streamStartAt,
      streamEndAt: nextConfig.streamEndAt,
      streamOverrideMode: nextConfig.streamOverrideMode,
    });
  } catch (error) {
    if (isMissingLiveBroadcastConfigSchemaError(error)) {
      throw new AdminValidationError("Missing migration 008: live_broadcast_config. Apply migrations and retry.");
    }
    throw error;
  }

  await insertAuditLog({
    ...actorRecord(actor),
    entityType: "live_broadcast",
    entityId: null,
    action: "update",
    before: before as unknown as Record<string, unknown>,
    after: updated as unknown as Record<string, unknown>,
    requestId: requestIdFromOptions(options),
  });

  return withWriteResult(false, { config: updated });
}

export async function createEvent(
  actor: AdminActor,
  input: CreateEventInput,
  options?: RequestOptions,
): Promise<AdminWriteResult<{ event: AdminEvent }>> {
  assertRole(actor, ["owner", "editor"]);

  const championshipId = validateUuid(input.championshipId, "championshipId");
  const roundNumber = validatePositiveInt(input.roundNumber, "roundNumber");
  const championship = await getChampionshipById(championshipId);
  if (!championship) {
    throw new AdminNotFoundError(`Championship not found: ${championshipId}`);
  }

  const streamState = normalizeEventStreamPatch(
    {
      streamVideoId: null,
      streamStartAt: null,
      streamEndAt: null,
      streamOverrideMode: "auto",
    },
    {
      streamVideoId: input.streamVideoId,
      streamStartAt: input.streamStartAt,
      streamEndAt: input.streamEndAt,
      streamOverrideMode: input.streamOverrideMode,
    },
  ).next;

  const payload: CreateEventInput = {
    championshipId,
    roundNumber,
    circuitName: validateRequiredText(input.circuitName, "circuitName"),
    eventDate: validateDateInput(input.eventDate, "eventDate"),
    streamVideoId: streamState.streamVideoId,
    streamStartAt: streamState.streamStartAt,
    streamEndAt: streamState.streamEndAt,
    streamOverrideMode: streamState.streamOverrideMode,
    sourceSheet: input.sourceSheet?.trim() || "admin",
    sourceRow: input.sourceRow > 0 ? validatePositiveInt(input.sourceRow, "sourceRow") : roundNumber,
  };

  const dryRun = getAdminWriteDryRunMode();
  if (dryRun) {
    const now = new Date().toISOString();
    return withWriteResult(
      true,
      {
        event: {
          id: "dry-run",
          championshipId,
          championshipName: championship.name,
          championshipSlug: championship.slug,
          seasonYear: championship.seasonYear,
          roundNumber: payload.roundNumber,
          circuitName: payload.circuitName,
          eventDate: payload.eventDate,
          streamVideoId: payload.streamVideoId,
          streamStartAt: payload.streamStartAt,
          streamEndAt: payload.streamEndAt,
          streamOverrideMode: payload.streamOverrideMode,
          isActive: true,
          sourceSheet: payload.sourceSheet,
          sourceRow: payload.sourceRow,
          createdAt: now,
          updatedAt: now,
        },
      },
      ["Dry-run mode: event was not created."],
    );
  }

  const event = await createEventRecord(payload);

  await insertAuditLog({
    ...actorRecord(actor),
    entityType: "event",
    entityId: event.id,
    action: "create",
    before: {},
    after: event as unknown as Record<string, unknown>,
    requestId: requestIdFromOptions(options),
  });

  return withWriteResult(false, { event });
}

export async function updateEvent(
  actor: AdminActor,
  eventId: string,
  input: UpdateEventInput,
  options?: RequestOptions,
): Promise<AdminWriteResult<{ event: AdminEvent }>> {
  assertRole(actor, ["owner", "editor"]);

  const id = validateUuid(eventId, "eventId");
  const before = await getEventById(id);
  if (!before) {
    throw new AdminNotFoundError(`Event not found: ${id}`);
  }

  const streamPatch = normalizeEventStreamPatch(
    {
      streamVideoId: before.streamVideoId,
      streamStartAt: before.streamStartAt,
      streamEndAt: before.streamEndAt,
      streamOverrideMode: before.streamOverrideMode,
    },
    {
      streamVideoId: input.streamVideoId,
      streamStartAt: input.streamStartAt,
      streamEndAt: input.streamEndAt,
      streamOverrideMode: input.streamOverrideMode,
    },
  );

  const payload: UpdateEventInput = {};
  if (input.championshipId !== undefined) {
    const championshipId = validateUuid(input.championshipId, "championshipId");
    const championship = await getChampionshipById(championshipId);
    if (!championship) {
      throw new AdminNotFoundError(`Championship not found: ${championshipId}`);
    }
    payload.championshipId = championshipId;
  }

  if (input.roundNumber !== undefined) {
    payload.roundNumber = validatePositiveInt(input.roundNumber, "roundNumber");
  }

  if (input.circuitName !== undefined) {
    payload.circuitName = validateRequiredText(input.circuitName, "circuitName");
  }

  if (input.eventDate !== undefined) {
    payload.eventDate = validateDateInput(input.eventDate, "eventDate");
  }
  if (streamPatch.changes.streamVideoId !== undefined) {
    payload.streamVideoId = streamPatch.changes.streamVideoId;
  }
  if (streamPatch.changes.streamStartAt !== undefined) {
    payload.streamStartAt = streamPatch.changes.streamStartAt;
  }
  if (streamPatch.changes.streamEndAt !== undefined) {
    payload.streamEndAt = streamPatch.changes.streamEndAt;
  }
  if (streamPatch.changes.streamOverrideMode !== undefined) {
    payload.streamOverrideMode = streamPatch.changes.streamOverrideMode;
  }

  const dryRun = getAdminWriteDryRunMode();
  if (dryRun) {
    return withWriteResult(
      true,
      {
        event: {
          ...before,
          championshipId: payload.championshipId ?? before.championshipId,
          roundNumber: payload.roundNumber ?? before.roundNumber,
          circuitName: payload.circuitName ?? before.circuitName,
          eventDate: payload.eventDate === undefined ? before.eventDate : payload.eventDate,
          streamVideoId: streamPatch.next.streamVideoId,
          streamStartAt: streamPatch.next.streamStartAt,
          streamEndAt: streamPatch.next.streamEndAt,
          streamOverrideMode: streamPatch.next.streamOverrideMode,
        },
      },
      ["Dry-run mode: event was not updated."],
    );
  }

  const updated = await updateEventRecord(id, payload);
  if (!updated) {
    throw new AdminNotFoundError(`Event not found: ${id}`);
  }

  await insertAuditLog({
    ...actorRecord(actor),
    entityType: "event",
    entityId: id,
    action: "update",
    before: before as unknown as Record<string, unknown>,
    after: updated as unknown as Record<string, unknown>,
    requestId: requestIdFromOptions(options),
  });

  return withWriteResult(false, { event: updated });
}

export async function setEventIsActive(
  actor: AdminActor,
  eventId: string,
  isActive: boolean,
  options?: RequestOptions,
): Promise<AdminWriteResult<{ event: AdminEvent }>> {
  assertRole(actor, ["owner", "editor"]);

  const id = validateUuid(eventId, "eventId");
  const before = await getEventById(id);
  if (!before) {
    throw new AdminNotFoundError(`Event not found: ${id}`);
  }

  const dryRun = getAdminWriteDryRunMode();
  if (dryRun) {
    return withWriteResult(
      true,
      {
        event: {
          ...before,
          isActive,
        },
      },
      ["Dry-run mode: event active flag was not changed."],
    );
  }

  const updated = await setEventActive(id, isActive);
  if (!updated) {
    throw new AdminNotFoundError(`Event not found: ${id}`);
  }

  await insertAuditLog({
    ...actorRecord(actor),
    entityType: "event",
    entityId: id,
    action: "set_active",
    before: before as unknown as Record<string, unknown>,
    after: updated as unknown as Record<string, unknown>,
    requestId: requestIdFromOptions(options),
  });

  return withWriteResult(false, { event: updated });
}

export async function getEventResults(actor: AdminActor, eventId: string): Promise<AdminEventResultsGrid> {
  assertRole(actor, ["owner", "editor"]);

  const id = validateUuid(eventId, "eventId");
  const grid = await getEventResultsGrid(id);
  if (!grid) {
    throw new AdminNotFoundError(`Event not found: ${id}`);
  }

  return grid;
}

export async function updateEventResults(
  actor: AdminActor,
  eventId: string,
  input: { rows: EventResultCellInput[] },
  options?: RequestOptions,
): Promise<AdminWriteResult<{ rows: EventResultCellInput[] }>> {
  assertRole(actor, ["owner", "editor"]);

  const id = validateUuid(eventId, "eventId");
  const event = await getEventById(id);
  if (!event) {
    throw new AdminNotFoundError(`Event not found: ${id}`);
  }

  const driverRows = await listAdminDrivers({ includeInactive: true });
  const driverIds = new Set(driverRows.map((driver) => driver.id));
  const rowKeys = new Set<string>();

  const normalizedRows = input.rows.map((row) => {
    const normalized = validateResultCell(row);
    if (!driverIds.has(normalized.driverId)) {
      throw new AdminValidationError(`Unknown driverId: ${normalized.driverId}`);
    }

    const key = `${normalized.driverId}:${normalized.sessionKind}`;
    if (rowKeys.has(key)) {
      throw new AdminValidationError(`Duplicate result row for ${key}.`);
    }
    rowKeys.add(key);

    if (!normalized.rawValue) {
      const fallback = normalized.position !== null ? String(normalized.position) : String(normalized.status);
      normalized.rawValue = fallback;
    }

    return normalized;
  });

  const beforeRows = await listEventResultsByEventId(id);
  const beforeSnapshot = toEventResultCells(beforeRows);
  const afterSnapshot = normalizedRows;

  const dryRun = getAdminWriteDryRunMode();
  if (dryRun) {
    return withWriteResult(
      true,
      { rows: afterSnapshot },
      ["Dry-run mode: event results were not updated."],
    );
  }

  const updatedRows = await replaceEventResults(id, normalizedRows);

  await insertAuditLog({
    ...actorRecord(actor),
    entityType: "event_results",
    entityId: id,
    action: "replace",
    before: {
      eventId: id,
      rows: beforeSnapshot,
    },
    after: {
      eventId: id,
      rows: toEventResultCells(updatedRows),
    },
    requestId: requestIdFromOptions(options),
  });

  return withWriteResult(false, { rows: toEventResultCells(updatedRows) });
}

export async function listDrivers(
  actor: AdminActor,
  options: { includeInactive: boolean; query?: string },
): Promise<AdminDriver[]> {
  assertRole(actor, ["owner", "editor"]);

  return listAdminDrivers({
    includeInactive: options.includeInactive,
    query: options.query,
  });
}

export async function createDriver(
  actor: AdminActor,
  input: CreateDriverInput,
  options?: RequestOptions,
): Promise<AdminWriteResult<{ driver: AdminDriver }>> {
  assertRole(actor, ["owner", "editor"]);

  const canonicalName = normalizeWhitespace(input.canonicalName);
  if (!canonicalName) {
    throw new AdminValidationError("canonicalName is required.");
  }

  const country = resolveCountry(input.countryCode);
  const slug = await buildUniqueDriverSlug(canonicalName);
  const payload = {
    slug,
    canonicalName,
    sortName: toSortName(canonicalName),
    countryCode: country.code,
    countryNameEs: withFallbackText(input.countryNameEs, country.nameEs),
    countryNameEn: withFallbackText(input.countryNameEn, country.nameEn),
    roleEs: withFallbackText(input.roleEs, DEFAULT_ROLE_ES),
    roleEn: withFallbackText(input.roleEn, DEFAULT_ROLE_EN),
  };

  const dryRun = getAdminWriteDryRunMode();
  if (dryRun) {
    const now = new Date().toISOString();
    return withWriteResult(
      true,
      {
        driver: {
          id: "dry-run",
          slug: payload.slug,
          canonicalName: payload.canonicalName,
          sortName: payload.sortName,
          countryCode: payload.countryCode,
          countryNameEs: payload.countryNameEs,
          countryNameEn: payload.countryNameEn,
          roleEs: payload.roleEs,
          roleEn: payload.roleEn,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
      },
      ["Dry-run mode: driver was not created."],
    );
  }

  const driver = await createDriverRecord(payload);

  await insertAuditLog({
    ...actorRecord(actor),
    entityType: "driver",
    entityId: driver.id,
    action: "create",
    before: {},
    after: driver as unknown as Record<string, unknown>,
    requestId: requestIdFromOptions(options),
  });

  return withWriteResult(false, { driver });
}

export async function updateDriver(
  actor: AdminActor,
  driverId: string,
  input: UpdateDriverInput,
  options?: RequestOptions,
): Promise<AdminWriteResult<{ driver: AdminDriver }>> {
  assertRole(actor, ["owner", "editor"]);

  const id = validateUuid(driverId, "driverId");
  const before = await getDriverById(id);
  if (!before) {
    throw new AdminNotFoundError(`Driver not found: ${id}`);
  }

  const payload: UpdateDriverInput = {};
  if (input.canonicalName !== undefined) {
    const canonicalName = validateRequiredText(input.canonicalName, "canonicalName");
    payload.canonicalName = canonicalName;
    payload.sortName = toSortName(canonicalName);
  } else if (input.sortName !== undefined) {
    payload.sortName = normalizeWhitespace(input.sortName);
  }
  if (input.countryCode !== undefined) {
    const country = resolveCountry(input.countryCode);
    payload.countryCode = country.code;
    payload.countryNameEs = country.nameEs;
    payload.countryNameEn = country.nameEn;
  }
  if (input.roleEs !== undefined) {
    payload.roleEs = withFallbackText(input.roleEs, DEFAULT_ROLE_ES);
  }
  if (input.roleEn !== undefined) {
    payload.roleEn = withFallbackText(input.roleEn, DEFAULT_ROLE_EN);
  }
  if (input.isActive !== undefined) {
    payload.isActive = Boolean(input.isActive);
  }

  const dryRun = getAdminWriteDryRunMode();
  if (dryRun) {
    return withWriteResult(
      true,
      {
        driver: {
          ...before,
          canonicalName: payload.canonicalName ?? before.canonicalName,
          sortName: payload.sortName ?? before.sortName,
          countryCode: payload.countryCode ?? before.countryCode,
          countryNameEs: payload.countryNameEs ?? before.countryNameEs,
          countryNameEn: payload.countryNameEn ?? before.countryNameEn,
          roleEs: payload.roleEs ?? before.roleEs,
          roleEn: payload.roleEn ?? before.roleEn,
          isActive: payload.isActive ?? before.isActive,
        },
      },
      ["Dry-run mode: driver was not updated."],
    );
  }

  const updated = await updateDriverRecord(id, payload);
  if (!updated) {
    throw new AdminNotFoundError(`Driver not found: ${id}`);
  }

  await insertAuditLog({
    ...actorRecord(actor),
    entityType: "driver",
    entityId: id,
    action: "update",
    before: before as unknown as Record<string, unknown>,
    after: updated as unknown as Record<string, unknown>,
    requestId: requestIdFromOptions(options),
  });

  return withWriteResult(false, { driver: updated });
}

export async function setDriverIsActive(
  actor: AdminActor,
  driverId: string,
  isActive: boolean,
  options?: RequestOptions,
): Promise<AdminWriteResult<{ driver: AdminDriver }>> {
  assertRole(actor, ["owner", "editor"]);

  const id = validateUuid(driverId, "driverId");
  const before = await getDriverById(id);
  if (!before) {
    throw new AdminNotFoundError(`Driver not found: ${id}`);
  }

  const dryRun = getAdminWriteDryRunMode();
  if (dryRun) {
    return withWriteResult(
      true,
      {
        driver: {
          ...before,
          isActive,
        },
      },
      ["Dry-run mode: driver active flag was not changed."],
    );
  }

  const updated = await setDriverActive(id, isActive);
  if (!updated) {
    throw new AdminNotFoundError(`Driver not found: ${id}`);
  }

  await insertAuditLog({
    ...actorRecord(actor),
    entityType: "driver",
    entityId: id,
    action: "set_active",
    before: before as unknown as Record<string, unknown>,
    after: updated as unknown as Record<string, unknown>,
    requestId: requestIdFromOptions(options),
  });

  return withWriteResult(false, { driver: updated });
}

export async function listAliases(actor: AdminActor, driverId: string): Promise<AdminDriverAlias[]> {
  assertRole(actor, ["owner", "editor"]);
  const id = validateUuid(driverId, "driverId");

  const driver = await getDriverById(id);
  if (!driver) {
    throw new AdminNotFoundError(`Driver not found: ${id}`);
  }

  return listDriverAliases(id);
}

export async function createAlias(
  actor: AdminActor,
  driverId: string,
  aliasOriginal: string,
  options?: RequestOptions,
): Promise<AdminWriteResult<{ alias: AdminDriverAlias }>> {
  assertRole(actor, ["owner", "editor"]);

  const id = validateUuid(driverId, "driverId");
  const driver = await getDriverById(id);
  if (!driver) {
    throw new AdminNotFoundError(`Driver not found: ${id}`);
  }

  const original = normalizeWhitespace(aliasOriginal);
  if (!original) {
    throw new AdminValidationError("aliasOriginal is required.");
  }

  const aliasNormalized = normalizeAlias(original);

  const dryRun = getAdminWriteDryRunMode();
  if (dryRun) {
    return withWriteResult(
      true,
      {
        alias: {
          id: "dry-run",
          driverId: id,
          aliasOriginal: original,
          aliasNormalized,
          createdAt: new Date().toISOString(),
        },
      },
      ["Dry-run mode: alias was not created."],
    );
  }

  const alias = await createDriverAliasRecord(id, original, aliasNormalized);

  await insertAuditLog({
    ...actorRecord(actor),
    entityType: "driver_alias",
    entityId: alias.id,
    action: "create",
    before: {},
    after: alias as unknown as Record<string, unknown>,
    requestId: requestIdFromOptions(options),
  });

  return withWriteResult(false, { alias });
}

export async function deleteAlias(
  actor: AdminActor,
  aliasId: string,
  options?: RequestOptions,
): Promise<AdminWriteResult<{ deleted: boolean }>> {
  assertRole(actor, ["owner", "editor"]);

  const id = validateUuid(aliasId, "aliasId");
  const before = await getAliasById(id);
  if (!before) {
    throw new AdminNotFoundError(`Alias not found: ${id}`);
  }

  const dryRun = getAdminWriteDryRunMode();
  if (dryRun) {
    return withWriteResult(true, { deleted: true }, ["Dry-run mode: alias was not deleted."]);
  }

  const deleted = await deleteAliasRecord(id);
  if (!deleted) {
    throw new AdminNotFoundError(`Alias not found: ${id}`);
  }

  await insertAuditLog({
    ...actorRecord(actor),
    entityType: "driver_alias",
    entityId: id,
    action: "delete",
    before: before as unknown as Record<string, unknown>,
    after: {},
    requestId: requestIdFromOptions(options),
  });

  return withWriteResult(false, { deleted: true });
}

export async function getAuditTrail(
  actor: AdminActor,
  options: {
    entityType?: string;
    entityId?: string;
    limit?: number;
  },
): Promise<AdminAuditLog[]> {
  assertRole(actor, ["owner"]);

  const limit = options.limit === undefined ? 50 : validatePositiveInt(options.limit, "limit");
  if (limit > 200) {
    throw new AdminValidationError("limit must be <= 200.");
  }

  const entityType = options.entityType?.trim() || undefined;
  const entityId = options.entityId ? validateUuid(options.entityId, "entityId") : undefined;

  return listAuditLogs({
    entityType,
    entityId,
    limit,
  });
}

async function applyRevertSnapshot(entityType: string, entityId: string, snapshot: Record<string, unknown>): Promise<void> {
  if (entityType === "championship") {
    if (hasObjectKeys(snapshot)) {
      await applyChampionshipSnapshot(snapshot);
    } else {
      await setChampionshipActive(entityId, false);
    }
    return;
  }

  if (entityType === "event") {
    if (hasObjectKeys(snapshot)) {
      await applyEventSnapshot(snapshot);
    } else {
      await setEventActive(entityId, false);
    }
    return;
  }

  if (entityType === "driver") {
    if (hasObjectKeys(snapshot)) {
      await applyDriverSnapshot(snapshot);
    } else {
      await setDriverActive(entityId, false);
    }
    return;
  }

  if (entityType === "event_results") {
    const rows = toResultSnapshotRows((snapshot as { rows?: unknown }).rows);
    await applyEventResultsSnapshot(entityId, rows);
    return;
  }

  throw new AdminValidationError("entityType is not revertable.");
}

export async function revertEntity(
  actor: AdminActor,
  input: RevertRequest,
  options?: RequestOptions,
): Promise<RevertResult> {
  assertRole(actor, ["owner", "editor"]);

  const entityType = assertEntityType(input.entityType);
  const entityId = validateUuid(input.entityId, "entityId");

  let targetAudit: AdminAuditLog | null = null;

  if (input.targetAuditId) {
    if (actor.role !== "owner") {
      throw new AdminForbiddenError("Only owner can revert historical versions.");
    }

    const targetAuditId = validateUuid(input.targetAuditId, "targetAuditId");
    const allowedAudits = await listEntityAuditLogs(entityType, entityId, 10);
    targetAudit = allowedAudits.find((entry) => entry.id === targetAuditId) ?? null;

    if (!targetAudit) {
      throw new AdminValidationError("targetAuditId is not within the last 10 versions.");
    }
  } else {
    const latest = await listEntityAuditLogs(entityType, entityId, 1);
    targetAudit = latest.at(0) ?? null;
  }

  if (!targetAudit) {
    throw new AdminNotFoundError("No audit log available to revert.");
  }

  if (targetAudit.entityType !== entityType || targetAudit.entityId !== entityId) {
    throw new AdminValidationError("target audit does not match entity.");
  }

  const dryRun = getAdminWriteDryRunMode();
  if (dryRun) {
    return {
      applied: false,
      dryRun: true,
      restoredFromAuditId: targetAudit.id,
      auditLogId: null,
    };
  }

  const snapshot = targetAudit.before ?? {};
  await applyRevertSnapshot(entityType, entityId, snapshot);

  const revertAudit = await insertAuditLog({
    ...actorRecord(actor),
    entityType,
    entityId,
    action: "revert",
    before: {
      restoredFromAuditId: targetAudit.id,
    },
    after: snapshot,
    requestId: requestIdFromOptions(options),
  });

  return {
    applied: true,
    dryRun: false,
    restoredFromAuditId: targetAudit.id,
    auditLogId: revertAudit.id,
  };
}

