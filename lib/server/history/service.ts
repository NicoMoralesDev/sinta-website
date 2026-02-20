import {
  getCurrentChampionshipSummary,
  getDriverBySlug,
  getDriverResultsPage,
  getDriverStats,
  getDrivers,
  getEventParticipationPage,
  getEventResultsPage,
  getHomeLiveBroadcastCandidate,
  getHighlights,
  getResultFilters,
  getResultsOverview as getResultsOverviewRecord,
  getTeamMembers,
} from "./repository";
import { HistoryNotFoundError, HistoryValidationError } from "./errors";
import type {
  CurrentChampionshipSummary,
  CursorPage,
  DriverListItem,
  DriverProfile,
  DriverResultsQuery,
  DriverStats,
  EventParticipationCard,
  EventQuery,
  EventResultItem,
  HomeLiveBroadcast,
  LiveBroadcastStatus,
  OverviewQuery,
  ResultFilterSet,
  ResultHighlight,
  StatsQuery,
  TeamMemberRecord,
  TeamOverviewKpis,
} from "./types";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
const DEFAULT_HIGHLIGHTS_LIMIT = 8;
const MAX_HIGHLIGHTS_LIMIT = 24;
const DEFAULT_CURRENT_EVENTS_LIMIT = 5;
const MAX_CURRENT_EVENTS_LIMIT = 12;
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseInteger(
  value: string | null,
  field: string,
  options: { min?: number; max?: number } = {},
): number | undefined {
  if (value === null || value.trim() === "") {
    return undefined;
  }

  if (!/^\d+$/.test(value)) {
    throw new HistoryValidationError(`${field} must be a positive integer.`);
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    throw new HistoryValidationError(`${field} must be a valid number.`);
  }

  if (options.min !== undefined && parsed < options.min) {
    throw new HistoryValidationError(`${field} must be >= ${options.min}.`);
  }

  if (options.max !== undefined && parsed > options.max) {
    throw new HistoryValidationError(`${field} must be <= ${options.max}.`);
  }

  return parsed;
}

function parseLimit(value: string | null, fallback: number, max: number): number {
  return parseInteger(value, "limit", { min: 1, max }) ?? fallback;
}

function decodeCursor(cursor: string | null): number {
  if (!cursor) {
    return 0;
  }

  let decoded = "";
  try {
    decoded = Buffer.from(cursor, "base64url").toString("utf8");
  } catch {
    throw new HistoryValidationError("cursor is invalid.");
  }

  const parsed = parseInteger(decoded, "cursor", { min: 0 });
  if (parsed === undefined) {
    throw new HistoryValidationError("cursor is invalid.");
  }

  return parsed;
}

function encodeCursor(offset: number): string {
  return Buffer.from(String(offset), "utf8").toString("base64url");
}

function parseSlug(value: string | null, field: string): string | undefined {
  if (value === null || value.trim() === "") {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (!/^[a-z0-9-]+$/.test(normalized)) {
    throw new HistoryValidationError(`${field} must be a slug (a-z, 0-9, -).`);
  }

  return normalized;
}

function parseUuid(value: string | null, field: string): string | undefined {
  if (value === null || value.trim() === "") {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (!UUID_REGEX.test(normalized)) {
    throw new HistoryValidationError(`${field} must be a UUID.`);
  }

  return normalized;
}

function toEventQuery(searchParams: URLSearchParams): EventQuery {
  return {
    year: parseInteger(searchParams.get("year"), "year", { min: 2000, max: 2100 }),
    championship: parseSlug(searchParams.get("championship"), "championship"),
    championshipId: parseUuid(searchParams.get("championshipId"), "championshipId"),
    driver: parseSlug(searchParams.get("driver"), "driver"),
    limit: parseLimit(searchParams.get("limit"), DEFAULT_LIMIT, MAX_LIMIT),
    offset: decodeCursor(searchParams.get("cursor")),
  };
}

function toDriverResultsQuery(searchParams: URLSearchParams): DriverResultsQuery {
  return {
    year: parseInteger(searchParams.get("year"), "year", { min: 2000, max: 2100 }),
    championship: parseSlug(searchParams.get("championship"), "championship"),
    championshipId: parseUuid(searchParams.get("championshipId"), "championshipId"),
    limit: parseLimit(searchParams.get("limit"), DEFAULT_LIMIT, MAX_LIMIT),
    offset: decodeCursor(searchParams.get("cursor")),
  };
}

function toStatsQuery(searchParams: URLSearchParams): StatsQuery {
  return {
    year: parseInteger(searchParams.get("year"), "year", { min: 2000, max: 2100 }),
    championship: parseSlug(searchParams.get("championship"), "championship"),
    championshipId: parseUuid(searchParams.get("championshipId"), "championshipId"),
    driver: parseSlug(searchParams.get("driver"), "driver"),
  };
}

function toOverviewQuery(searchParams: URLSearchParams): OverviewQuery {
  return {
    year: parseInteger(searchParams.get("year"), "year", { min: 2000, max: 2100 }),
    championship: parseSlug(searchParams.get("championship"), "championship"),
    championshipId: parseUuid(searchParams.get("championshipId"), "championshipId"),
  };
}

function mapLanguage(value: string | null): "es" | "en" {
  return value === "en" ? "en" : "es";
}

function toTeamLanguageRecord(member: TeamMemberRecord, language: "es" | "en") {
  return {
    slug: member.slug,
    canonicalName: member.canonicalName,
    sortName: member.sortName,
    countryCode: member.countryCode,
    country: language === "es" ? member.countryNameEs : member.countryNameEn,
    role: language === "es" ? member.roleEs : member.roleEn,
    isActive: member.isActive,
  };
}

export async function getResultsEvents(searchParams: URLSearchParams): Promise<CursorPage<EventResultItem>> {
  const query = toEventQuery(searchParams);
  const page = await getEventResultsPage(query);

  return {
    items: page.items,
    nextCursor: page.hasNext ? encodeCursor(query.offset + query.limit) : null,
  };
}

export async function getResultsEventParticipation(
  searchParams: URLSearchParams,
): Promise<CursorPage<EventParticipationCard>> {
  const query = toEventQuery(searchParams);
  const page = await getEventParticipationPage(query);

  return {
    items: page.items,
    nextCursor: page.hasNext ? encodeCursor(query.offset + query.limit) : null,
  };
}

export async function getResultsHighlights(searchParams: URLSearchParams): Promise<ResultHighlight[]> {
  const limit = parseLimit(searchParams.get("limit"), DEFAULT_HIGHLIGHTS_LIMIT, MAX_HIGHLIGHTS_LIMIT);
  const year = parseInteger(searchParams.get("year"), "year", { min: 2000, max: 2100 });
  const championship = parseSlug(searchParams.get("championship"), "championship");
  const championshipId = parseUuid(searchParams.get("championshipId"), "championshipId");
  const driver = parseSlug(searchParams.get("driver"), "driver");

  return getHighlights({
    limit,
    year,
    championship,
    championshipId,
    driver,
  });
}

export async function getResultsStats(searchParams: URLSearchParams): Promise<DriverStats[]> {
  return getDriverStats(toStatsQuery(searchParams));
}

export async function getResultsOverview(searchParams: URLSearchParams): Promise<TeamOverviewKpis> {
  return getResultsOverviewRecord(toOverviewQuery(searchParams));
}

export async function getCurrentChampionship(
  searchParams: URLSearchParams,
): Promise<CurrentChampionshipSummary | null> {
  const limit = parseLimit(
    searchParams.get("limit"),
    DEFAULT_CURRENT_EVENTS_LIMIT,
    MAX_CURRENT_EVENTS_LIMIT,
  );

  return getCurrentChampionshipSummary(limit);
}

export async function getFilters(): Promise<ResultFilterSet> {
  return getResultFilters();
}

export async function getTeam(searchParams: URLSearchParams): Promise<
  Array<{
    slug: string;
    canonicalName: string;
    sortName: string;
    countryCode: string;
    country: string;
    role: string;
    isActive: boolean;
  }>
> {
  const language = mapLanguage(searchParams.get("lang"));
  const activeOnly = searchParams.get("active") !== "false";
  const members = await getTeamMembers(activeOnly);

  return members.map((member) => toTeamLanguageRecord(member, language));
}

export async function getDriverList(searchParams: URLSearchParams): Promise<DriverListItem[]> {
  const language = mapLanguage(searchParams.get("lang"));
  const activeOnly = searchParams.get("active") !== "false";
  return getDrivers(activeOnly, language);
}

export async function getDriverProfileBySlug(slug: string): Promise<DriverProfile> {
  const normalizedSlug = parseSlug(slug, "slug");
  if (!normalizedSlug) {
    throw new HistoryValidationError("slug is required.");
  }

  const profile = await getDriverBySlug(normalizedSlug);
  if (!profile) {
    throw new HistoryNotFoundError(`Driver not found: ${normalizedSlug}`);
  }

  return profile;
}

export async function getDriverHistory(
  slug: string,
  searchParams: URLSearchParams,
): Promise<CursorPage<EventResultItem>> {
  const normalizedSlug = parseSlug(slug, "slug");
  if (!normalizedSlug) {
    throw new HistoryValidationError("slug is required.");
  }

  const query = toDriverResultsQuery(searchParams);
  const page = await getDriverResultsPage(normalizedSlug, query);

  return {
    items: page.items,
    nextCursor: page.hasNext ? encodeCursor(query.offset + query.limit) : null,
  };
}

export async function getHomeTeamMembers(language: "es" | "en") {
  const members = await getTeamMembers(true);
  return members.map((member) => toTeamLanguageRecord(member, language));
}

export async function getHomeOverviewKpis(): Promise<TeamOverviewKpis> {
  return getResultsOverviewRecord({});
}

export async function getHomeRecentEventParticipation(
  limit = 5,
): Promise<EventParticipationCard[]> {
  const page = await getEventParticipationPage({
    limit,
    offset: 0,
  });

  return page.items;
}

export async function getHomeCurrentChampionship(): Promise<CurrentChampionshipSummary | null> {
  return getCurrentChampionshipSummary(DEFAULT_CURRENT_EVENTS_LIMIT);
}

export function resolveHomeLiveBroadcastStatus(
  candidate: Pick<HomeLiveBroadcast, "streamOverrideMode" | "streamStartAt">,
  nowIso: string,
): LiveBroadcastStatus {
  if (candidate.streamOverrideMode === "force_on") {
    return "live";
  }

  if (!candidate.streamStartAt) {
    return "live";
  }

  const nowMillis = Date.parse(nowIso);
  const startMillis = Date.parse(candidate.streamStartAt);
  if (!Number.isFinite(nowMillis) || !Number.isFinite(startMillis)) {
    return "live";
  }

  return nowMillis < startMillis ? "upcoming" : "live";
}

export function isHomeLiveBroadcastVisible(
  candidate: Pick<HomeLiveBroadcast, "streamVideoId" | "streamOverrideMode" | "streamStartAt" | "streamEndAt">,
  nowIso: string,
): boolean {
  if (!candidate.streamVideoId) {
    return false;
  }

  if (candidate.streamOverrideMode === "force_off") {
    return false;
  }

  if (candidate.streamOverrideMode === "force_on") {
    return true;
  }

  if (!candidate.streamStartAt || !candidate.streamEndAt) {
    return false;
  }

  const nowMillis = Date.parse(nowIso);
  const startMillis = Date.parse(candidate.streamStartAt);
  const endMillis = Date.parse(candidate.streamEndAt);
  if (!Number.isFinite(nowMillis) || !Number.isFinite(startMillis) || !Number.isFinite(endMillis)) {
    return false;
  }

  return nowMillis >= startMillis - 30 * 60 * 1000 && nowMillis <= endMillis;
}

export async function getHomeLiveBroadcast(nowIso = new Date().toISOString()): Promise<HomeLiveBroadcast | null> {
  const candidate = await getHomeLiveBroadcastCandidate(nowIso);
  if (!candidate) {
    return null;
  }

  if (!isHomeLiveBroadcastVisible(candidate, nowIso)) {
    return null;
  }

  return {
    ...candidate,
    status: resolveHomeLiveBroadcastStatus(candidate, nowIso),
  };
}

