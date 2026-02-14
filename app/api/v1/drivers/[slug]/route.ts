import { jsonOk, handleApiError } from "@/app/api/v1/_utils";
import { getDriverProfileBySlug } from "@/lib/server/history/service";

export const runtime = "nodejs";

type DriverRouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: DriverRouteContext) {
  try {
    const { slug } = await context.params;
    const driver = await getDriverProfileBySlug(slug);

    return jsonOk({
      ok: true,
      driver,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

