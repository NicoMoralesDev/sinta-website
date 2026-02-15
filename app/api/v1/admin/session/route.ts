import { adminJsonOk, handleAdminApiError, requireAdminActor } from "@/app/api/v1/admin/_utils";
import { getAdminSessionByUserId } from "@/lib/server/admin/service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { actor } = await requireAdminActor(request, { allowMustChangePassword: true });
    const session = await getAdminSessionByUserId(actor.userId);

    return adminJsonOk({
      ok: true,
      session,
      dryRun: process.env.NODE_ENV === "development" && process.env.ADMIN_DEV_DRY_RUN !== "0",
    });
  } catch (error) {
    return handleAdminApiError(error);
  }
}
