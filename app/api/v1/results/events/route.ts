import { jsonOk, handleApiError } from "@/app/api/v1/_utils";
import { getResultsEvents } from "@/lib/server/history/service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = await getResultsEvents(url.searchParams);

    return jsonOk({
      ok: true,
      ...page,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

