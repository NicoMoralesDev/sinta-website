import { jsonOk, handleApiError } from "@/app/api/v1/_utils";
import { getCurrentChampionship } from "@/lib/server/history/service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const current = await getCurrentChampionship(url.searchParams);

    return jsonOk({
      ok: true,
      current,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
