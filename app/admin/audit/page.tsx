import { AdminShell } from "@/app/admin/_components/admin-shell";
import { RevertForm } from "@/app/admin/_components/revert-form";
import { getAdminPageContext, requireAdminPageActor } from "@/app/admin/_lib";
import { getAuditTrail } from "@/lib/server/admin/service";

type SearchValue = string | string[] | undefined;

type PageProps = {
  searchParams?: Promise<Record<string, SearchValue>> | Record<string, SearchValue>;
};

function firstValue(value: SearchValue): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

export const dynamic = "force-dynamic";

export default async function AdminAuditPage({ searchParams }: PageProps) {
  const actor = await requireAdminPageActor({ roles: ["owner"] });
  const context = await getAdminPageContext();

  const resolved = await Promise.resolve(searchParams);
  const entityType = firstValue(resolved?.entityType)?.trim() || undefined;
  const entityId = firstValue(resolved?.entityId)?.trim() || undefined;
  const limit = parsePositiveInt(firstValue(resolved?.limit), 50);

  const logs = await getAuditTrail(actor, {
    entityType,
    entityId,
    limit,
  });

  return (
    <AdminShell
      actor={actor}
      dryRun={context.dryRun}
      title="Auditoria"
      subtitle="Traza cambios y ejecuta reversiones controladas."
    >
      <form className="grid gap-2 rounded-sm border border-racing-steel/25 bg-racing-carbon/55 p-4 md:grid-cols-4">
        <input name="entityType" defaultValue={entityType ?? ""} placeholder="entityType" className="rounded-sm border border-racing-steel/40 bg-racing-black px-2 py-1.5 text-xs" />
        <input name="entityId" defaultValue={entityId ?? ""} placeholder="entityId" className="rounded-sm border border-racing-steel/40 bg-racing-black px-2 py-1.5 text-xs" />
        <input name="limit" type="number" defaultValue={limit} className="rounded-sm border border-racing-steel/40 bg-racing-black px-2 py-1.5 text-xs" />
        <button type="submit" className="rounded-sm bg-racing-yellow px-3 py-1.5 text-xs font-bold tracking-wider text-racing-black uppercase">Aplicar filtros</button>
      </form>

      <RevertForm />

      <div className="overflow-auto rounded-sm border border-racing-steel/25 bg-racing-carbon/55">
        <table className="min-w-full border-collapse text-xs">
          <colgroup>
            <col className="w-[180px]" />
            <col className="w-[170px]" />
            <col />
            <col className="w-[120px]" />
            <col className="w-[280px]" />
          </colgroup>
          <thead>
            <tr className="border-b border-racing-steel/20 text-racing-white/70 uppercase">
              <th className="px-2 py-2 text-left">Fecha</th>
              <th className="px-2 py-2 text-left">Actor</th>
              <th className="px-2 py-2 text-left">Entidad</th>
              <th className="px-2 py-2 text-left">Acción</th>
              <th className="px-2 py-2 text-left">Audit id</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, index) => (
              <tr
                key={log.id}
                className={`border-b border-racing-steel/10 ${
                  index % 2 === 0 ? "bg-racing-black/20" : "bg-racing-black/35"
                }`}
              >
                <td className="px-2 py-2 text-racing-white/70">{new Date(log.createdAt).toLocaleString()}</td>
                <td className="px-2 py-2">{log.actorUsername}</td>
                <td className="px-2 py-2">{log.entityType} / {log.entityId ?? "-"}</td>
                <td className="px-2 py-2 text-racing-yellow">{log.action}</td>
                <td className="px-2 py-2 font-mono text-racing-white/65">{log.id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
