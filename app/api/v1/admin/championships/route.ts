import {
  adminJsonOk,
  handleAdminApiError,
  parseAdminJsonBody,
  readRequestId,
  requireAdminActor,
} from "@/app/api/v1/admin/_utils";
import {
  createChampionship,
  listChampionships,
  updateChampionship,
} from "@/lib/server/admin/service";

export const runtime = "nodejs";

function toBoolean(value: string | null): boolean {
  return value === "1" || value === "true";
}

export async function GET(request: Request) {
  try {
    const { actor } = await requireAdminActor(request);
    const url = new URL(request.url);
    const includeInactive = toBoolean(url.searchParams.get("includeInactive"));

    const championships = await listChampionships(actor, includeInactive);
    return adminJsonOk({ ok: true, championships });
  } catch (error) {
    return handleAdminApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { actor } = await requireAdminActor(request);
    const body = await parseAdminJsonBody<{
      seasonYear?: number;
      name?: string;
      primarySessionLabel?: string;
      secondarySessionLabel?: string;
    }>(request);

    const result = await createChampionship(
      actor,
      {
        seasonYear: body.seasonYear ?? 0,
        name: body.name ?? "",
        slug: "",
        primarySessionLabel: body.primarySessionLabel ?? "Sprint",
        secondarySessionLabel: body.secondarySessionLabel ?? "Final",
      },
      { requestId: readRequestId(request) },
    );

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
      seasonYear?: number;
      name?: string;
      primarySessionLabel?: string;
      secondarySessionLabel?: string;
    }>(request);

    const id = body.id ?? "";
    const result = await updateChampionship(actor, id, {
      seasonYear: body.seasonYear,
      name: body.name,
      primarySessionLabel: body.primarySessionLabel,
      secondarySessionLabel: body.secondarySessionLabel,
    }, {
      requestId: readRequestId(request),
    });

    return adminJsonOk(result);
  } catch (error) {
    return handleAdminApiError(error);
  }
}

