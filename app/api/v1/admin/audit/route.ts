import { adminJsonOk, handleAdminApiError, requireAdminActor } from "@/app/api/v1/admin/_utils";
import { getAuditTrail } from "@/lib/server/admin/service";

export const runtime = "nodejs";

function parseOptionalInt(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function GET(request: Request) {
  try {
    const { actor } = await requireAdminActor(request, { roles: ["owner"] });
    const url = new URL(request.url);

    const logs = await getAuditTrail(actor, {
      entityType: url.searchParams.get("entityType") ?? undefined,
      entityId: url.searchParams.get("entityId") ?? undefined,
      limit: parseOptionalInt(url.searchParams.get("limit")),
    });

    return adminJsonOk({ ok: true, logs });
  } catch (error) {
    return handleAdminApiError(error);
  }
}
