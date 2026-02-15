import {
  adminJsonOk,
  handleAdminApiError,
  parseAdminJsonBody,
  readRequestId,
  requireAdminActor,
} from "@/app/api/v1/admin/_utils";
import { createDriver, listDrivers, updateDriver } from "@/lib/server/admin/service";

export const runtime = "nodejs";

function toBoolean(value: string | null): boolean {
  return value === "1" || value === "true";
}

export async function GET(request: Request) {
  try {
    const { actor } = await requireAdminActor(request);
    const url = new URL(request.url);

    const drivers = await listDrivers(actor, {
      includeInactive: toBoolean(url.searchParams.get("includeInactive")),
      query: url.searchParams.get("q") ?? undefined,
    });

    return adminJsonOk({ ok: true, drivers });
  } catch (error) {
    return handleAdminApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { actor } = await requireAdminActor(request);
    const body = await parseAdminJsonBody<{
      canonicalName?: string;
      countryCode?: string;
    }>(request);

    const result = await createDriver(actor, {
      canonicalName: body.canonicalName ?? "",
      countryCode: body.countryCode ?? "",
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
      canonicalName?: string;
      sortName?: string;
      countryCode?: string;
      countryNameEs?: string;
      countryNameEn?: string;
      roleEs?: string;
      roleEn?: string;
      isActive?: boolean;
    }>(request);

    const result = await updateDriver(actor, body.id ?? "", {
      canonicalName: body.canonicalName,
      sortName: body.sortName,
      countryCode: body.countryCode,
      countryNameEs: body.countryNameEs,
      countryNameEn: body.countryNameEn,
      roleEs: body.roleEs,
      roleEn: body.roleEn,
      isActive: body.isActive,
    }, {
      requestId: readRequestId(request),
    });

    return adminJsonOk(result);
  } catch (error) {
    return handleAdminApiError(error);
  }
}

