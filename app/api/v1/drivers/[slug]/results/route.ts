import { jsonOk, handleApiError } from "@/app/api/v1/_utils";
import { getDriverHistory } from "@/lib/server/history/service";

export const runtime = "nodejs";

type DriverResultsRouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: Request, context: DriverResultsRouteContext) {
  try {
    const { slug } = await context.params;
    const url = new URL(request.url);
    const page = await getDriverHistory(slug, url.searchParams);

    return jsonOk({
      ok: true,
      ...page,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

