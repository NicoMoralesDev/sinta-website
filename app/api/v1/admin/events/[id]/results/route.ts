import {
  adminJsonOk,
  handleAdminApiError,
  parseAdminJsonBody,
  readRequestId,
  requireAdminActor,
} from "@/app/api/v1/admin/_utils";
import { getEventResults, updateEventResults } from "@/lib/server/admin/service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { actor } = await requireAdminActor(request);
    const { id } = await context.params;
    const grid = await getEventResults(actor, id);

    return adminJsonOk({ ok: true, grid });
  } catch (error) {
    return handleAdminApiError(error);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { actor } = await requireAdminActor(request);
    const { id } = await context.params;
    const body = await parseAdminJsonBody<{ rows?: Array<{
      driverId: string;
      sessionKind: "primary" | "secondary";
      position: number | null;
      status: "DNF" | "DNQ" | "DSQ" | "ABSENT" | null;
      rawValue: string;
      isActive: boolean;
    }> }>(request);

    const result = await updateEventResults(actor, id, { rows: body.rows ?? [] }, {
      requestId: readRequestId(request),
    });

    return adminJsonOk(result);
  } catch (error) {
    return handleAdminApiError(error);
  }
}

