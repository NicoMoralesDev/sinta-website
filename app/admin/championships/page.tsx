import { AdminShell } from "@/app/admin/_components/admin-shell";
import { ChampionshipsManager } from "@/app/admin/_components/championships-manager";
import { getAdminPageContext, requireAdminPageActor } from "@/app/admin/_lib";
import { listChampionships } from "@/lib/server/admin/service";

export const dynamic = "force-dynamic";

export default async function AdminChampionshipsPage() {
  const actor = await requireAdminPageActor();
  const context = await getAdminPageContext();

  const championships = await listChampionships(actor, true);

  return (
    <AdminShell
      actor={actor}
      dryRun={context.dryRun}
      title="Campeonatos"
      subtitle="Crear, editar labels y activar/desactivar campeonatos."
    >
      <ChampionshipsManager championships={championships} />
    </AdminShell>
  );
}
