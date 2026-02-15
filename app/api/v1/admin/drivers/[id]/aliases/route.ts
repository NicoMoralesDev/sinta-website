import {
  adminJsonOk,
  handleAdminApiError,
  parseAdminJsonBody,
  readRequestId,
  requireAdminActor,
} from "@/app/api/v1/admin/_utils";
import { createAlias, listAliases } from "@/lib/server/admin/service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { actor } = await requireAdminActor(request);
    const { id } = await context.params;

    const aliases = await listAliases(actor, id);
    return adminJsonOk({ ok: true, aliases });
  } catch (error) {
    return handleAdminApiError(error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { actor } = await requireAdminActor(request);
    const { id } = await context.params;
    const body = await parseAdminJsonBody<{ aliasOriginal?: string }>(request);

    const result = await createAlias(actor, id, body.aliasOriginal ?? "", {
      requestId: readRequestId(request),
    });

    return adminJsonOk(result);
  } catch (error) {
    return handleAdminApiError(error);
  }
}

