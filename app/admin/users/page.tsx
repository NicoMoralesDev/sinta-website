import { AdminShell } from "@/app/admin/_components/admin-shell";
import { UsersManager } from "@/app/admin/_components/users-manager";
import { getAdminPageContext, requireAdminPageActor } from "@/app/admin/_lib";
import { listUsers } from "@/lib/server/admin/service";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const actor = await requireAdminPageActor({ roles: ["owner"] });
  const context = await getAdminPageContext();

  const users = await listUsers(actor);

  return (
    <AdminShell
      actor={actor}
      dryRun={context.dryRun}
      title="Usuarios"
      subtitle="Gestión de usuarios y seguridad (solo owner)."
    >
      <UsersManager users={users} actorUserId={actor.userId} />
    </AdminShell>
  );
}



