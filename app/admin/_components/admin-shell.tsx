import Link from "next/link";
import type { ReactNode } from "react";

import { LogoutButton } from "@/app/admin/_components/admin-auth-controls";

type AdminShellProps = {
  actor: {
    username: string;
    role: "owner" | "editor";
    mustChangePassword: boolean;
  } | null;
  dryRun: boolean;
  title: string;
  subtitle?: string;
  children: ReactNode;
};

function navItems(role: "owner" | "editor" | null): Array<{ href: string; label: string }> {
  const base = [
    { href: "/admin", label: "Resumen" },
    { href: "/admin/championships", label: "Campeonatos" },
    { href: "/admin/events", label: "Eventos" },
    { href: "/admin/live-stream", label: "Live Stream" },
    { href: "/admin/roster", label: "Pilotos" },
  ];

  if (role === "owner") {
    base.push({ href: "/admin/users", label: "Usuarios" });
    base.push({ href: "/admin/audit", label: "Auditoria" });
  }

  return base;
}

export function AdminShell({ actor, dryRun, title, subtitle, children }: AdminShellProps) {
  const items = navItems(actor?.role ?? null);

  return (
    <main className="min-h-screen bg-racing-black text-racing-white">
      <header className="border-b border-racing-steel/30 bg-racing-carbon/70">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div>
            <p className="font-mono text-xs tracking-[0.25em] text-racing-yellow uppercase">SINTA Admin</p>
            <h1 className="font-mono text-2xl font-bold tracking-wide uppercase">{title}</h1>
            {subtitle ? <p className="mt-1 text-sm text-racing-white/60">{subtitle}</p> : null}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {actor ? (
              <>
                <span className="rounded-sm border border-racing-steel/30 px-2 py-1 text-racing-white/75">
                  {actor.username}
                </span>
                <span className="rounded-sm border border-racing-yellow/40 px-2 py-1 text-racing-yellow uppercase">
                  {actor.role}
                </span>
                <LogoutButton />
              </>
            ) : (
              <Link
                href="/admin/login"
                className="rounded-sm border border-racing-yellow/40 px-3 py-1.5 font-semibold tracking-wider text-racing-yellow uppercase"
              >
                Ingreso
              </Link>
            )}
          </div>
        </div>

        {dryRun ? (
          <div className="border-t border-racing-yellow/30 bg-racing-yellow/15 px-6 py-2 text-center text-xs font-semibold tracking-wider text-racing-yellow uppercase">
            MODO DRY-RUN (development): los writes son solo vista previa.
          </div>
        ) : null}
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-6 md:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="rounded-sm border border-racing-steel/25 bg-racing-carbon/45 p-3">
          <nav className="space-y-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-sm border border-transparent px-3 py-2 text-xs font-semibold tracking-wider text-racing-white/75 uppercase transition-colors hover:border-racing-yellow/30 hover:text-racing-yellow"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <section className="space-y-4">{children}</section>
      </div>
    </main>
  );
}
