import Link from "next/link";

import { ChangePasswordForm } from "@/app/admin/_components/admin-auth-controls";
import { AdminShell } from "@/app/admin/_components/admin-shell";
import { getAdminPageContext, requireAdminPageActor } from "@/app/admin/_lib";
import {
  listChampionships,
  listDrivers,
  listEvents,
} from "@/lib/server/admin/service";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const actor = await requireAdminPageActor({ allowMustChangePassword: true });
  const context = await getAdminPageContext();

  if (actor.mustChangePassword) {
    return (
      <AdminShell
        actor={actor}
        dryRun={context.dryRun}
        title="Control de Seguridad"
        subtitle="Debes cambiar la contraseña temporal antes de usar el panel."
      >
        <ChangePasswordForm />
      </AdminShell>
    );
  }

  const [championships, events, drivers] = await Promise.all([
    listChampionships(actor, true),
    listEvents(actor, { includeInactive: true }),
    listDrivers(actor, { includeInactive: true }),
  ]);

  const activeChampionships = championships.filter((item) => item.isActive).length;
  const activeEvents = events.filter((item) => item.isActive).length;
  const activeDrivers = drivers.filter((item) => item.isActive).length;

  const cards = [
    {
      label: "Campeonatos",
      active: activeChampionships,
      inactive: championships.length - activeChampionships,
      href: "/admin/championships",
    },
    {
      label: "Eventos",
      active: activeEvents,
      inactive: events.length - activeEvents,
      href: "/admin/events",
    },
    {
      label: "Pilotos",
      active: activeDrivers,
      inactive: drivers.length - activeDrivers,
      href: "/admin/roster",
    },
  ];

  return (
    <AdminShell
      actor={actor}
      dryRun={context.dryRun}
      title="Panel"
      subtitle="Resumen general del estado del sistema."
    >
      <div className="grid gap-3 md:grid-cols-3">
        {cards.map((card) => (
          <article key={card.label} className="rounded-sm border border-racing-steel/25 bg-racing-carbon/55 p-4">
            <p className="text-xs text-racing-white/60 uppercase">{card.label}</p>
            <p className="mt-1 font-mono text-2xl text-racing-yellow">{card.active}</p>
            <p className="mt-1 text-xs text-racing-white/50">Inactivos: {card.inactive}</p>
            <Link
              href={card.href}
              className="mt-3 inline-flex rounded-sm border border-racing-yellow/35 px-2 py-1 text-[11px] text-racing-yellow uppercase"
            >
              Gestionar
            </Link>
          </article>
        ))}
      </div>
    </AdminShell>
  );
}

