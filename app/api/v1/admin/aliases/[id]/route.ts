import {
  adminJsonOk,
  handleAdminApiError,
  readRequestId,
  requireAdminActor,
} from "@/app/api/v1/admin/_utils";
import { deleteAlias } from "@/lib/server/admin/service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { actor } = await requireAdminActor(request);
    const { id } = await context.params;

    const result = await deleteAlias(actor, id, {
      requestId: readRequestId(request),
    });

    return adminJsonOk(result);
  } catch (error) {
    return handleAdminApiError(error);
  }
}

