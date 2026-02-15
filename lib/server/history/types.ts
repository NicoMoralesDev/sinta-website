export type SessionKind = "primary" | "secondary";

export type ResultStatus = "DNF" | "DNQ" | "DSQ" | "ABSENT";

export type TeamMemberRecord = {
  slug: string;
  canonicalName: string;
  sortName: string;
  countryCode: string;
  countryNameEs: string;
  countryNameEn: string;
  roleEs: string;
  roleEn: string;
  isActive: boolean;
};

export type DriverListItem = {
  slug: string;
  canonicalName: string;
  countryCode: string;
  countryName: string;
  role: string;
};

export type ChampionshipFilter = {
  id: string;
  seasonYear: number;
  slug: string;
  name: string;
};

export type ResultFilterSet = {
  years: number[];
  championships: ChampionshipFilter[];
  drivers: Array<{ slug: string; canonicalName: string }>;
};

export type EventResultEntry = {
  driverSlug: string;
  driverName: string;
  sessionKind: SessionKind;
  sessionLabel: string;
  position: number | null;
  status: ResultStatus | null;
  rawValue: string;
};

export type EventResultItem = {
  eventId: string;
  seasonYear: number;
  championshipSlug: string;
  championshipName: string;
  roundNumber: number;
  circuitName: string;
  eventDate: string | null;
  results: EventResultEntry[];
};

export type CursorPage<T> = {
  items: T[];
  nextCursor: string | null;
};

export type ResultHighlight = {
  eventId: string;
  seasonYear: number;
  championshipSlug: string;
  championshipName: string;
  roundNumber: number;
  circuitName: string;
  bestDriverName: string;
  bestPosition: number;
};

export type DriverStats = {
  driverSlug: string;
  canonicalName: string;
  wins: number;
  podiums: number;
  top5: number;
  top10: number;
  completed: number;
  dnf: number;
  dnq: number;
  dsq: number;
  absent: number;
};

export type DriverProfile = {
  slug: string;
  canonicalName: string;
  sortName: string;
  countryCode: string;
  countryNameEs: string;
  countryNameEn: string;
  roleEs: string;
  roleEn: string;
  isActive: boolean;
  stats: DriverStats;
};

export type TeamOverviewKpis = {
  racesCompleted: number;
  podiums: number;
  wins: number;
  activeDrivers: number;
};

export type EventParticipationEntry = {
  driverSlug: string;
  driverName: string;
  sessions: Array<{
    sessionKind: SessionKind;
    sessionLabel: string;
    position: number | null;
    status: ResultStatus | null;
    rawValue: string;
  }>;
};

export type EventParticipationCard = {
  eventId: string;
  seasonYear: number;
  championshipSlug: string;
  championshipName: string;
  roundNumber: number;
  circuitName: string;
  eventDate: string | null;
  participants: EventParticipationEntry[];
};

export type CurrentChampionshipSummary = {
  championship: {
    id: string;
    seasonYear: number;
    slug: string;
    name: string;
  };
  events: EventParticipationCard[];
  leaderboard: Array<{
    driverSlug: string;
    driverName: string;
    wins: number;
    podiums: number;
    top10: number;
    completed: number;
    avgPosition: number | null;
  }>;
};

export type EventQuery = {
  year?: number;
  championship?: string;
  driver?: string;
  limit: number;
  offset: number;
};

export type DriverResultsQuery = {
  year?: number;
  championship?: string;
  limit: number;
  offset: number;
};

export type StatsQuery = {
  year?: number;
  championship?: string;
  driver?: string;
};

export type OverviewQuery = {
  year?: number;
  championship?: string;
};

export type ParsedRaceEvent = {
  seasonYear: number;
  championshipName: string;
  championshipSlug: string;
  roundNumber: number;
  circuitName: string;
  sourceSheet: string;
  sourceRow: number;
};

export type ParsedRaceResult = {
  eventKey: string;
  seasonYear: number;
  championshipName: string;
  championshipSlug: string;
  roundNumber: number;
  sourceRow: number;
  circuitName: string;
  driverAlias: string;
  sessionKind: SessionKind;
  rawValue: string;
  position: number | null;
  status: ResultStatus | null;
};

export type ParsedHistoryWorkbook = {
  events: ParsedRaceEvent[];
  results: ParsedRaceResult[];
  warnings: string[];
  sourceSheet: string;
};

export type DriverSeed = {
  slug: string;
  canonicalName: string;
  sortName: string;
  countryCode: string;
  countryNameEs: string;
  countryNameEn: string;
  roleEs: string;
  roleEn: string;
  aliases: string[];
};

