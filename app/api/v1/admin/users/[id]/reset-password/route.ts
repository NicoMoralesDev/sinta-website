import {
  adminJsonOk,
  handleAdminApiError,
  readRequestId,
  requireAdminActor,
} from "@/app/api/v1/admin/_utils";
import { resetUserPassword } from "@/lib/server/admin/service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { actor } = await requireAdminActor(request, { roles: ["owner"] });
    const { id } = await context.params;

    const result = await resetUserPassword(actor, id, {
      requestId: readRequestId(request),
    });

    return adminJsonOk(result);
  } catch (error) {
    return handleAdminApiError(error);
  }
}

