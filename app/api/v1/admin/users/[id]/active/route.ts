import {
  adminJsonOk,
  handleAdminApiError,
  parseAdminJsonBody,
  readRequestId,
  requireAdminActor,
} from "@/app/api/v1/admin/_utils";
import { setUserActive } from "@/lib/server/admin/service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { actor } = await requireAdminActor(request, { roles: ["owner"] });
    const { id } = await context.params;
    const body = await parseAdminJsonBody<{ isActive?: boolean }>(request);

    const result = await setUserActive(actor, id, body.isActive !== false, {
      requestId: readRequestId(request),
    });

    return adminJsonOk(result);
  } catch (error) {
    return handleAdminApiError(error);
  }
}

