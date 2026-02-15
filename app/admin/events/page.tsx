import { AdminShell } from "@/app/admin/_components/admin-shell";
import { EventsManager } from "@/app/admin/_components/events-manager";
import { getAdminPageContext, requireAdminPageActor } from "@/app/admin/_lib";
import { listChampionships, listEvents } from "@/lib/server/admin/service";

type SearchValue = string | string[] | undefined;

type PageProps = {
  searchParams?: Promise<Record<string, SearchValue>> | Record<string, SearchValue>;
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function firstValue(value: SearchValue): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function parseUuid(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const normalized = value.trim();
  return UUID_REGEX.test(normalized) ? normalized : undefined;
}

export const dynamic = "force-dynamic";

export default async function AdminEventsPage({ searchParams }: PageProps) {
  const actor = await requireAdminPageActor();
  const context = await getAdminPageContext();

  const resolved = await Promise.resolve(searchParams);
  const championshipFilterId = parseUuid(firstValue(resolved?.championshipId));

  const championships = await listChampionships(actor, true);
  const events = await listEvents(actor, {
    includeInactive: true,
    championshipId: championshipFilterId,
  });

  const championshipFilter =
    championshipFilterId
      ? championships.find((championship) => championship.id === championshipFilterId) ?? null
      : null;

  return (
    <AdminShell
      actor={actor}
      dryRun={context.dryRun}
      title="Eventos y Resultados"
      subtitle="Editar eventos y resultados por evento en la misma tabla."
    >
      <EventsManager
        events={events}
        championships={championships}
        championshipFilterId={championshipFilter?.id ?? null}
      />
    </AdminShell>
  );
}

