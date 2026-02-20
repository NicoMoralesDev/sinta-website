import { AdminShell } from "@/app/admin/_components/admin-shell";
import { LiveBroadcastManager } from "@/app/admin/_components/live-broadcast-manager";
import { getAdminPageContext, requireAdminPageActor } from "@/app/admin/_lib";
import { getLiveBroadcastConfig, listEvents } from "@/lib/server/admin/service";

export const dynamic = "force-dynamic";

export default async function AdminLiveStreamPage() {
  const actor = await requireAdminPageActor();
  const context = await getAdminPageContext();

  const [config, events] = await Promise.all([
    getLiveBroadcastConfig(actor),
    listEvents(actor, { includeInactive: true }),
  ]);

  return (
    <AdminShell
      actor={actor}
      dryRun={context.dryRun}
      title="Live Stream"
      subtitle="Configuracion global de transmision para Home/Hero."
    >
      <LiveBroadcastManager config={config} events={events} />
    </AdminShell>
  );
}
