import type { ResultStatus, SessionKind } from "@/lib/server/history/types";

export type AdminRole = "owner" | "editor";

export type AdminSession = {
  userId: string;
  username: string;
  role: AdminRole;
  mustChangePassword: boolean;
  expiresAt: string;
};

export type AdminUser = {
  id: string;
  username: string;
  role: AdminRole;
  isActive: boolean;
  mustChangePassword: boolean;
  failedAttempts: number;
  lockedUntil: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminChampionship = {
  id: string;
  seasonYear: number;
  name: string;
  slug: string;
  primarySessionLabel: string;
  secondarySessionLabel: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminEvent = {
  id: string;
  championshipId: string;
  championshipName: string;
  championshipSlug: string;
  seasonYear: number;
  roundNumber: number;
  circuitName: string;
  eventDate: string | null;
  isActive: boolean;
  sourceSheet: string;
  sourceRow: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminDriver = {
  id: string;
  slug: string;
  canonicalName: string;
  sortName: string;
  countryCode: string;
  countryNameEs: string;
  countryNameEn: string;
  roleEs: string;
  roleEn: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminDriverAlias = {
  id: string;
  driverId: string;
  aliasOriginal: string;
  aliasNormalized: string;
  createdAt: string;
};

export type AdminEventResultRow = {
  id: string;
  eventId: string;
  driverId: string;
  driverSlug: string;
  driverName: string;
  sessionKind: SessionKind;
  position: number | null;
  status: ResultStatus | null;
  rawValue: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminEventResultsGrid = {
  event: AdminEvent;
  drivers: Array<{
    driverId: string;
    driverSlug: string;
    driverName: string;
    primary: {
      position: number | null;
      status: ResultStatus | null;
      rawValue: string;
      isActive: boolean;
    } | null;
    secondary: {
      position: number | null;
      status: ResultStatus | null;
      rawValue: string;
      isActive: boolean;
    } | null;
  }>;
};

export type AdminAuditLog = {
  id: string;
  actorUserId: string;
  actorUsername: string;
  entityType: string;
  entityId: string | null;
  action: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  requestId: string | null;
  createdAt: string;
};

export type AdminWriteResult<T = Record<string, unknown>> = {
  ok: true;
  dryRun: boolean;
  data: T;
  warnings: string[];
};

export type LoginInput = {
  username: string;
  password: string;
};

export type CreateAdminUserInput = {
  username: string;
  role: AdminRole;
};

export type UpdateAdminUserInput = {
  role?: AdminRole;
  isActive?: boolean;
};

export type CreateChampionshipInput = {
  seasonYear: number;
  name: string;
  slug: string;
  primarySessionLabel: string;
  secondarySessionLabel: string;
};

export type UpdateChampionshipInput = {
  seasonYear?: number;
  name?: string;
  primarySessionLabel?: string;
  secondarySessionLabel?: string;
};

export type CreateEventInput = {
  championshipId: string;
  roundNumber: number;
  circuitName: string;
  eventDate: string | null;
  sourceSheet: string;
  sourceRow: number;
};

export type UpdateEventInput = {
  championshipId?: string;
  roundNumber?: number;
  circuitName?: string;
  eventDate?: string | null;
};

export type CreateDriverInput = {
  canonicalName: string;
  slug?: string;
  sortName?: string;
  countryCode?: string;
  countryNameEs?: string;
  countryNameEn?: string;
  roleEs?: string;
  roleEn?: string;
};

export type UpdateDriverInput = {
  canonicalName?: string;
  sortName?: string;
  countryCode?: string;
  countryNameEs?: string;
  countryNameEn?: string;
  roleEs?: string;
  roleEn?: string;
  isActive?: boolean;
};

export type EventResultCellInput = {
  driverId: string;
  sessionKind: SessionKind;
  position: number | null;
  status: ResultStatus | null;
  rawValue: string;
  isActive: boolean;
};

export type UpdateEventResultsInput = {
  rows: EventResultCellInput[];
};

export type RevertRequest = {
  entityType: string;
  entityId: string;
  targetAuditId?: string;
};

export type RevertResult = {
  applied: boolean;
  dryRun: boolean;
  restoredFromAuditId: string;
  auditLogId: string | null;
};
