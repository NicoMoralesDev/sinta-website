import { NextResponse } from "next/server";

import {
  ADMIN_SESSION_COOKIE,
  assertAdminRuntimeAllowed,
  getAdminRuntimeConfig,
  parseAdminSessionToken,
} from "@/lib/server/admin/auth";
import {
  AdminAuthError,
  AdminForbiddenError,
  AdminNotFoundError,
  AdminValidationError,
} from "@/lib/server/admin/errors";
import { resolveAdminActor } from "@/lib/server/admin/service";
import type { AdminRole, AdminSession } from "@/lib/server/admin/types";

const ADMIN_CACHE_CONTROL = "no-store";

function withNoStore(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", ADMIN_CACHE_CONTROL);
  return response;
}

export function adminJsonOk(body: Record<string, unknown>, status = 200): NextResponse {
  return withNoStore(NextResponse.json(body, { status }));
}

export function adminJsonError(status: number, error: string, extra?: Record<string, unknown>): NextResponse {
  return withNoStore(
    NextResponse.json(
      {
        ok: false,
        error,
        ...(extra ?? {}),
      },
      { status },
    ),
  );
}

export function handleAdminApiError(error: unknown): NextResponse {
  if (error instanceof AdminValidationError) {
    return adminJsonError(400, error.message);
  }

  if (error instanceof AdminAuthError) {
    return adminJsonError(401, error.message);
  }

  if (error instanceof AdminForbiddenError) {
    return adminJsonError(403, error.message);
  }

  if (error instanceof AdminNotFoundError) {
    return adminJsonError(404, error.message);
  }

  return adminJsonError(500, "Internal server error.");
}

export async function parseAdminJsonBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new AdminValidationError("Invalid JSON body.");
  }
}

function readCookieValue(cookieHeader: string | null, cookieName: string): string | null {
  if (!cookieHeader) {
    return null;
  }

  const items = cookieHeader.split(";");
  for (const item of items) {
    const [name, ...rest] = item.trim().split("=");
    if (name === cookieName) {
      return decodeURIComponent(rest.join("="));
    }
  }

  return null;
}

export function readAdminSessionFromRequest(request: Request): AdminSession {
  assertAdminRuntimeAllowed();

  const token = readCookieValue(request.headers.get("cookie"), ADMIN_SESSION_COOKIE);
  if (!token) {
    throw new AdminAuthError("Unauthorized.");
  }

  return parseAdminSessionToken(token);
}

export function attachAdminSessionCookie(response: NextResponse, token: string): NextResponse {
  const config = getAdminRuntimeConfig();
  const isProduction = (process.env.NODE_ENV ?? "development") === "production";

  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
    maxAge: config.sessionTtlSeconds,
  });

  return withNoStore(response);
}

export function clearAdminSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: (process.env.NODE_ENV ?? "development") === "production",
    path: "/",
    expires: new Date(0),
  });

  return withNoStore(response);
}

export async function requireAdminActor(
  request: Request,
  options?: {
    roles?: AdminRole[];
    allowMustChangePassword?: boolean;
  },
): Promise<{ actor: Awaited<ReturnType<typeof resolveAdminActor>>; session: AdminSession }> {
  const session = readAdminSessionFromRequest(request);
  const actor = await resolveAdminActor(session);

  if (!options?.allowMustChangePassword && actor.mustChangePassword) {
    throw new AdminForbiddenError("Password change required before accessing admin resources.");
  }

  if (options?.roles && !options.roles.includes(actor.role)) {
    throw new AdminForbiddenError("Forbidden.");
  }

  return { actor, session };
}

export function readRequestId(request: Request): string | null {
  const value = request.headers.get("x-request-id");
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
