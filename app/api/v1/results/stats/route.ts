import { jsonOk, handleApiError } from "@/app/api/v1/_utils";
import { getResultsStats } from "@/lib/server/history/service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const items = await getResultsStats(url.searchParams);

    return jsonOk({
      ok: true,
      items,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

