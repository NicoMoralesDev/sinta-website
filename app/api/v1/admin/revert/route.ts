import {
  adminJsonOk,
  handleAdminApiError,
  parseAdminJsonBody,
  readRequestId,
  requireAdminActor,
} from "@/app/api/v1/admin/_utils";
import { revertEntity } from "@/lib/server/admin/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { actor } = await requireAdminActor(request);
    const body = await parseAdminJsonBody<{
      entityType?: string;
      entityId?: string;
      targetAuditId?: string;
    }>(request);

    const result = await revertEntity(
      actor,
      {
        entityType: body.entityType ?? "",
        entityId: body.entityId ?? "",
        targetAuditId: body.targetAuditId,
      },
      { requestId: readRequestId(request) },
    );

    return adminJsonOk({ ok: true, result });
  } catch (error) {
    return handleAdminApiError(error);
  }
}
