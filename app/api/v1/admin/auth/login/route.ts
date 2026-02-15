import { NextResponse } from "next/server";

import {
  adminJsonError,
  attachAdminSessionCookie,
  handleAdminApiError,
  parseAdminJsonBody,
} from "@/app/api/v1/admin/_utils";
import { assertAdminRuntimeAllowed } from "@/lib/server/admin/auth";
import { loginAdminUser } from "@/lib/server/admin/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    assertAdminRuntimeAllowed();

    const body = await parseAdminJsonBody<{ username?: string; password?: string }>(request);
    const username = body.username ?? "";
    const password = body.password ?? "";

    if (!username || !password) {
      return adminJsonError(400, "username and password are required.");
    }

    const { session, token } = await loginAdminUser({ username, password });
    const response = NextResponse.json({
      ok: true,
      session,
    });

    return attachAdminSessionCookie(response, token);
  } catch (error) {
    return handleAdminApiError(error);
  }
}
