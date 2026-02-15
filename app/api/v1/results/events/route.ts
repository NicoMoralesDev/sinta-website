import { jsonOk, handleApiError } from "@/app/api/v1/_utils";
import { getResultsEventParticipation, getResultsEvents } from "@/lib/server/history/service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const view = url.searchParams.get("view");
    const page =
      view === "participation"
        ? await getResultsEventParticipation(url.searchParams)
        : await getResultsEvents(url.searchParams);

    return jsonOk({
      ok: true,
      ...page,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

