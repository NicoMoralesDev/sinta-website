import {
  adminJsonOk,
  handleAdminApiError,
  parseAdminJsonBody,
  readRequestId,
  requireAdminActor,
} from "@/app/api/v1/admin/_utils";
import { updateUser } from "@/lib/server/admin/service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { actor } = await requireAdminActor(request, { roles: ["owner"] });
    const { id } = await context.params;
    const body = await parseAdminJsonBody<{ role?: "owner" | "editor"; isActive?: boolean }>(request);

    const result = await updateUser(actor, id, body, {
      requestId: readRequestId(request),
    });

    return adminJsonOk(result);
  } catch (error) {
    return handleAdminApiError(error);
  }
}

