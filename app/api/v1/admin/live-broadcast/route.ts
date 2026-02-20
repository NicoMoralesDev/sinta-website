import {
  adminJsonOk,
  handleAdminApiError,
  parseAdminJsonBody,
  readRequestId,
  requireAdminActor,
} from "@/app/api/v1/admin/_utils";
import { getLiveBroadcastConfig, updateLiveBroadcastConfig } from "@/lib/server/admin/service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { actor } = await requireAdminActor(request);
    const config = await getLiveBroadcastConfig(actor);
    return adminJsonOk({ ok: true, config });
  } catch (error) {
    return handleAdminApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { actor } = await requireAdminActor(request);
    const body = await parseAdminJsonBody<{
      eventId?: string | null;
      streamVideoId?: string | null;
      streamStartAt?: string | null;
      streamEndAt?: string | null;
      streamOverrideMode?: "auto" | "force_on" | "force_off" | null;
    }>(request);

    const result = await updateLiveBroadcastConfig(
      actor,
      {
        eventId: body.eventId,
        streamVideoId: body.streamVideoId,
        streamStartAt: body.streamStartAt,
        streamEndAt: body.streamEndAt,
        streamOverrideMode: body.streamOverrideMode,
      },
      {
        requestId: readRequestId(request),
      },
    );

    return adminJsonOk(result);
  } catch (error) {
    return handleAdminApiError(error);
  }
}
