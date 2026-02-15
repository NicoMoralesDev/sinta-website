import { NextResponse } from "next/server";

import {
  attachAdminSessionCookie,
  handleAdminApiError,
  parseAdminJsonBody,
  readRequestId,
  requireAdminActor,
} from "@/app/api/v1/admin/_utils";
import { changeOwnPassword } from "@/lib/server/admin/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { actor } = await requireAdminActor(request, { allowMustChangePassword: true });
    const body = await parseAdminJsonBody<{ currentPassword?: string; nextPassword?: string }>(request);

    const currentPassword = body.currentPassword ?? "";
    const nextPassword = body.nextPassword ?? "";

    const { session, token } = await changeOwnPassword(actor, currentPassword, nextPassword, {
      requestId: readRequestId(request),
    });

    const response = NextResponse.json({
      ok: true,
      session,
    });

    return attachAdminSessionCookie(response, token);
  } catch (error) {
    return handleAdminApiError(error);
  }
}
