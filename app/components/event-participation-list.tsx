import type { ReactNode } from "react";
import Link from "next/link";

import type {
  EventParticipationCard,
  EventParticipationEntry,
} from "@/lib/server/history/types";
import type { Language } from "@/app/content/site-content";
import {
  formatEventParticipationDate,
  formatEventParticipationRoundLabel,
  formatEventParticipationSeasonLabel,
  formatEventParticipationSessionValue,
  getEventParticipationSessionColumns,
  type EventParticipationSessionColumn,
} from "@/app/components/event-participation-helpers";

type EventParticipationListProps = {
  lang: Language;
  events: EventParticipationCard[];
  emptyMessage: string;
  linkDrivers?: boolean;
  renderEventActions?: (event: EventParticipationCard) => ReactNode;
};

function buildDriverHref(slug: string, lang: Language): string {
  return lang === "en" ? `/drivers/${slug}?lang=en` : `/drivers/${slug}`;
}

function getSessionBadgeTone(session: EventParticipationEntry["sessions"][number] | null): string {
  if (!session) {
    return "border-racing-steel/40 bg-racing-steel/10 text-racing-white/40";
  }

  if (session.position === 1) {
    return "border-racing-yellow bg-racing-yellow text-racing-black";
  }

  if (session.position !== null && session.position <= 3) {
    return "border-emerald-400/60 bg-emerald-400/15 text-emerald-200";
  }

  if (session.position !== null && session.position <= 10) {
    return "border-sky-400/60 bg-sky-400/15 text-sky-100";
  }

  if (session.position !== null) {
    return "border-racing-yellow/40 bg-racing-yellow/10 text-racing-yellow";
  }

  if (session.status === "DNF") {
    return "border-red-500/60 bg-red-500/15 text-red-200";
  }

  if (session.status === "DNQ") {
    return "border-orange-400/60 bg-orange-400/15 text-orange-100";
  }

  if (session.status === "DSQ") {
    return "border-fuchsia-400/60 bg-fuchsia-400/15 text-fuchsia-100";
  }

  if (session.status === "ABSENT") {
    return "border-slate-400/60 bg-slate-400/15 text-slate-100";
  }

  return "border-racing-yellow/40 bg-racing-yellow/10 text-racing-yellow";
}

export function EventParticipationList({
  lang,
  events,
  emptyMessage,
  linkDrivers = true,
  renderEventActions,
}: EventParticipationListProps) {
  if (events.length === 0) {
    return (
      <div className="rounded-sm border border-racing-steel/20 bg-racing-black/40 p-6 text-sm text-racing-white/60">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {events.map((event, eventIndex) => {
        const sessionColumns = getEventParticipationSessionColumns(event);
        const columns =
          sessionColumns.length > 0
            ? sessionColumns
            : [
                {
                  sessionKind: "f",
                  sessionLabel: lang === "en" ? "Result" : "Resultado",
                } as EventParticipationSessionColumn,
              ];
        const gridTemplateColumns = `minmax(0,1fr) repeat(${columns.length}, minmax(90px, auto))`;
        const eventDate = formatEventParticipationDate(event, lang);
        const pilotLabel = lang === "en" ? "Driver" : "Piloto";
        const eventActions = renderEventActions?.(event);

        return (
          <article
            key={event.eventId}
            className="motion-safe:animate-slide-up overflow-hidden rounded-sm border border-racing-steel/20 bg-racing-black/50"
            style={{ animationDelay: `${eventIndex * 50}ms` }}
          >
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-racing-steel/20 bg-racing-carbon/80 px-4 py-3">
              <div>
                <p className="font-mono text-xs font-semibold tracking-[0.14em] text-racing-yellow uppercase">
                  {formatEventParticipationSeasonLabel(event, lang)}
                </p>
                <h3 className="font-mono text-sm font-bold tracking-wide text-racing-white uppercase md:text-base">
                  {formatEventParticipationRoundLabel(event)}
                </h3>
              </div>

              {eventDate || eventActions ? (
                <div className="flex flex-wrap items-center justify-end gap-3">
                  {eventDate ? (
                    <span className="text-[11px] font-medium tracking-wider text-racing-white/45 uppercase">
                      {eventDate}
                    </span>
                  ) : null}
                  {eventActions}
                </div>
              ) : null}
            </header>

            <div className="mx-4 my-4 overflow-hidden rounded-sm border border-racing-steel/20">
              <div
                className="grid items-center gap-2 border-b border-racing-steel/20 bg-racing-carbon/80 px-3 py-2 text-[11px] font-semibold tracking-wider text-racing-white/55 uppercase"
                style={{ gridTemplateColumns }}
              >
                <span>{pilotLabel}</span>
                {columns.map((column) => (
                  <span
                    key={column.sessionKind}
                    className="justify-self-end inline-flex min-w-[84px] justify-center text-center"
                  >
                    {column.sessionLabel}
                  </span>
                ))}
              </div>

              {event.participants.map((participant, participantIndex) => {
                const sessionByKind = new Map(participant.sessions.map((session) => [session.sessionKind, session]));
                const rowTone =
                  participantIndex % 2 === 0 ? "bg-[#2c2c2c]" : "bg-[#202020]";

                return (
                  <div
                    key={`${event.eventId}-${participant.driverSlug}`}
                    className={`grid items-center gap-2 border-b border-racing-steel/20 px-3 py-3 last:border-b-0 ${rowTone}`}
                    style={{ gridTemplateColumns }}
                  >
                    <div>
                      {linkDrivers ? (
                        <Link
                          href={buildDriverHref(participant.driverSlug, lang)}
                          className="font-sans text-sm font-semibold tracking-wide text-racing-white transition-colors hover:text-racing-yellow"
                        >
                          {participant.driverName}
                        </Link>
                      ) : (
                        <p className="font-sans text-sm font-semibold tracking-wide text-racing-white">
                          {participant.driverName}
                        </p>
                      )}
                    </div>

                    {columns.map((column) => {
                      const session = sessionByKind.get(column.sessionKind) ?? null;
                      return (
                        <span
                          key={`${participant.driverSlug}-${column.sessionKind}`}
                          className={`justify-self-end inline-flex h-10 min-w-[84px] items-center justify-center rounded-sm border px-2 py-1 text-base font-mono font-bold tracking-wider uppercase ${getSessionBadgeTone(session)}`}
                          aria-label={`${column.sessionLabel}: ${session ? formatEventParticipationSessionValue(session, lang) : "-"}`}
                        >
                          {session ? formatEventParticipationSessionValue(session, lang) : "-"}
                        </span>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </article>
        );
      })}
    </div>
  );
}
