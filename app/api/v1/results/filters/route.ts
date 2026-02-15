import { jsonOk, handleApiError } from "@/app/api/v1/_utils";
import { getFilters } from "@/lib/server/history/service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const filters = await getFilters();

    return jsonOk({
      ok: true,
      ...filters,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

