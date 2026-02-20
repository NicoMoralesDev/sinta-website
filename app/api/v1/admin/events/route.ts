import {
  adminJsonOk,
  handleAdminApiError,
  parseAdminJsonBody,
  readRequestId,
  requireAdminActor,
} from "@/app/api/v1/admin/_utils";
import { createEvent, listEvents, updateEvent } from "@/lib/server/admin/service";

export const runtime = "nodejs";

function toBoolean(value: string | null): boolean {
  return value === "1" || value === "true";
}

function parseOptionalInt(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function GET(request: Request) {
  try {
    const { actor } = await requireAdminActor(request);
    const url = new URL(request.url);

    const events = await listEvents(actor, {
      includeInactive: toBoolean(url.searchParams.get("includeInactive")),
      year: parseOptionalInt(url.searchParams.get("year")),
      championshipId: url.searchParams.get("championshipId") ?? undefined,
    });

    return adminJsonOk({ ok: true, events });
  } catch (error) {
    return handleAdminApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { actor } = await requireAdminActor(request);
    const body = await parseAdminJsonBody<{
      championshipId?: string;
      roundNumber?: number;
      circuitName?: string;
      eventDate?: string | null;
      streamVideoId?: string | null;
      streamStartAt?: string | null;
      streamEndAt?: string | null;
      streamOverrideMode?: "auto" | "force_on" | "force_off" | null;
      sourceSheet?: string;
      sourceRow?: number;
    }>(request);

    const result = await createEvent(actor, {
      championshipId: body.championshipId ?? "",
      roundNumber: body.roundNumber ?? 0,
      circuitName: body.circuitName ?? "",
      eventDate: body.eventDate ?? null,
      streamVideoId: body.streamVideoId ?? null,
      streamStartAt: body.streamStartAt ?? null,
      streamEndAt: body.streamEndAt ?? null,
      streamOverrideMode: body.streamOverrideMode ?? "auto",
      sourceSheet: body.sourceSheet ?? "admin",
      sourceRow: body.sourceRow ?? 0,
    }, {
      requestId: readRequestId(request),
    });

    return adminJsonOk(result);
  } catch (error) {
    return handleAdminApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { actor } = await requireAdminActor(request);
    const body = await parseAdminJsonBody<{
      id?: string;
      championshipId?: string;
      roundNumber?: number;
      circuitName?: string;
      eventDate?: string | null;
      streamVideoId?: string | null;
      streamStartAt?: string | null;
      streamEndAt?: string | null;
      streamOverrideMode?: "auto" | "force_on" | "force_off" | null;
    }>(request);

    const result = await updateEvent(actor, body.id ?? "", {
      championshipId: body.championshipId,
      roundNumber: body.roundNumber,
      circuitName: body.circuitName,
      eventDate: body.eventDate,
      streamVideoId: body.streamVideoId,
      streamStartAt: body.streamStartAt,
      streamEndAt: body.streamEndAt,
      streamOverrideMode: body.streamOverrideMode,
    }, {
      requestId: readRequestId(request),
    });

    return adminJsonOk(result);
  } catch (error) {
    return handleAdminApiError(error);
  }
}

