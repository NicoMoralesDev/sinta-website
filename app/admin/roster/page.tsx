import { AdminShell } from "@/app/admin/_components/admin-shell";
import { RosterManager } from "@/app/admin/_components/roster-manager";
import { getAdminPageContext, requireAdminPageActor } from "@/app/admin/_lib";
import { listDrivers } from "@/lib/server/admin/service";

export const dynamic = "force-dynamic";

export default async function AdminRosterPage() {
  const actor = await requireAdminPageActor();
  const context = await getAdminPageContext();

  const drivers = await listDrivers(actor, {
    includeInactive: true,
  });

  return (
    <AdminShell
      actor={actor}
      dryRun={context.dryRun}
      title="Pilotos"
      subtitle="Gestiona pilotos y aliases. El slug es inmutable luego de crear."
    >
      <RosterManager drivers={drivers} />
    </AdminShell>
  );
}
