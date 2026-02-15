import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  ADMIN_SESSION_COOKIE,
  assertAdminRuntimeAllowed,
  isAdminDryRunMode,
  parseAdminSessionToken,
} from "@/lib/server/admin/auth";
import type { AdminRole } from "@/lib/server/admin/types";
import { resolveAdminActor } from "@/lib/server/admin/service";

export type AdminPageContext = {
  enabled: boolean;
  dryRun: boolean;
  actor: Awaited<ReturnType<typeof resolveAdminActor>> | null;
  errorMessage: string | null;
};

export async function getAdminPageContext(): Promise<AdminPageContext> {
  try {
    assertAdminRuntimeAllowed();
  } catch (error) {
    return {
      enabled: false,
      dryRun: false,
      actor: null,
      errorMessage: error instanceof Error ? error.message : "Admin is disabled.",
    };
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!token) {
    return {
      enabled: true,
      dryRun: isAdminDryRunMode(),
      actor: null,
      errorMessage: null,
    };
  }

  try {
    const session = parseAdminSessionToken(token);
    const actor = await resolveAdminActor(session);
    return {
      enabled: true,
      dryRun: isAdminDryRunMode(),
      actor,
      errorMessage: null,
    };
  } catch {
    return {
      enabled: true,
      dryRun: isAdminDryRunMode(),
      actor: null,
      errorMessage: null,
    };
  }
}

export async function requireAdminPageActor(options?: {
  roles?: AdminRole[];
  allowMustChangePassword?: boolean;
}): Promise<Awaited<ReturnType<typeof resolveAdminActor>>> {
  const context = await getAdminPageContext();

  if (!context.enabled) {
    redirect("/");
  }

  if (!context.actor) {
    redirect("/admin/login");
  }

  if (!options?.allowMustChangePassword && context.actor.mustChangePassword) {
    redirect("/admin?forcePassword=1");
  }

  if (options?.roles && !options.roles.includes(context.actor.role)) {
    redirect("/admin");
  }

  return context.actor;
}

export async function redirectIfAdminAlreadyLogged(): Promise<void> {
  const context = await getAdminPageContext();
  if (!context.enabled) {
    return;
  }
  if (context.actor) {
    redirect("/admin");
  }
}
