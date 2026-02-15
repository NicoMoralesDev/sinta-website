import {
  adminJsonOk,
  handleAdminApiError,
  parseAdminJsonBody,
  readRequestId,
  requireAdminActor,
} from "@/app/api/v1/admin/_utils";
import { createUser, listUsers } from "@/lib/server/admin/service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { actor } = await requireAdminActor(request, { roles: ["owner"] });
    const users = await listUsers(actor);
    return adminJsonOk({ ok: true, users });
  } catch (error) {
    return handleAdminApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { actor } = await requireAdminActor(request, { roles: ["owner"] });
    const body = await parseAdminJsonBody<{ username?: string; role?: "owner" | "editor" }>(request);

    const result = await createUser(
      actor,
      {
        username: body.username ?? "",
        role: body.role ?? "editor",
      },
      { requestId: readRequestId(request) },
    );

    return adminJsonOk(result);
  } catch (error) {
    return handleAdminApiError(error);
  }
}

