import { jsonOk, handleApiError } from "@/app/api/v1/_utils";
import { getResultsOverview } from "@/lib/server/history/service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const overview = await getResultsOverview(url.searchParams);

    return jsonOk({
      ok: true,
      overview,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
