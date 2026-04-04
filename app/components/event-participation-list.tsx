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
  getEventParticipationSessionGroup,
  getEventParticipationSessionPresentation,
  isPointsSessionKind,
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

  if (isPointsSessionKind(session.sessionKind)) {
    return "border-racing-yellow/35 bg-racing-black/35 text-racing-yellow";
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

function hasLeadingSeparator(columns: EventParticipationSessionColumn[], index: number): boolean {
  if (index === 0) {
    return true;
  }

  return (
    getEventParticipationSessionGroup(columns[index - 1]?.sessionKind ?? "qs") !==
    getEventParticipationSessionGroup(columns[index]?.sessionKind ?? "qs")
  );
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
        const desktopGridTemplateColumns = `minmax(160px,1.65fr) repeat(${columns.length}, minmax(76px,1fr))`;
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
              <div className="hidden md:block">
                <div
                  className="grid items-center gap-2 border-b border-racing-steel/20 bg-racing-carbon/80 px-3 py-2 text-[11px] font-semibold tracking-wider text-racing-white/55 uppercase"
                  style={{ gridTemplateColumns: desktopGridTemplateColumns }}
                >
                  <span>{pilotLabel}</span>
                  {columns.map((column, index) => {
                    const label = getEventParticipationSessionPresentation(column, lang);
                    const separator = hasLeadingSeparator(columns, index);

                    return (
                      <span
                        key={column.sessionKind}
                        className={`flex min-h-10 items-center justify-center text-center ${
                          separator ? "border-l-2 border-racing-yellow/80 pl-2" : ""
                        }`}
                      >
                        <span className="flex flex-col leading-tight">
                          {label.fullLabelLines.map((line, lineIndex) => (
                            <span key={`${column.sessionKind}-${lineIndex}`}>{line}</span>
                          ))}
                        </span>
                      </span>
                    );
                  })}
                </div>

                {event.participants.map((participant, participantIndex) => {
                  const sessionByKind = new Map(
                    participant.sessions.map((session) => [session.sessionKind, session]),
                  );
                  const rowTone = participantIndex % 2 === 0 ? "bg-[#2c2c2c]" : "bg-[#202020]";

                  return (
                    <div
                      key={`${event.eventId}-${participant.driverSlug}`}
                      className={`grid items-center gap-2 border-b border-racing-steel/20 px-3 py-3 last:border-b-0 ${rowTone}`}
                      style={{ gridTemplateColumns: desktopGridTemplateColumns }}
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

                      {columns.map((column, index) => {
                        const label = getEventParticipationSessionPresentation(column, lang);
                        const session = sessionByKind.get(column.sessionKind) ?? null;
                        const separator = hasLeadingSeparator(columns, index);

                        return (
                          <div
                            key={`${participant.driverSlug}-${column.sessionKind}`}
                            className={separator ? "border-l-2 border-racing-yellow/80 pl-2" : ""}
                          >
                            <span
                              className={`flex h-10 w-full items-center justify-center rounded-sm border px-2 py-1 text-base font-mono font-bold tracking-wider uppercase ${getSessionBadgeTone(session)}`}
                              aria-label={`${label.accessibilityLabel}: ${
                                session ? formatEventParticipationSessionValue(session, lang) : "-"
                              }`}
                            >
                              {session ? formatEventParticipationSessionValue(session, lang) : "-"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              <div className="md:hidden">
                {event.participants.map((participant, participantIndex) => {
                  const sessionByKind = new Map(
                    participant.sessions.map((session) => [session.sessionKind, session]),
                  );
                  const rowTone = participantIndex % 2 === 0 ? "bg-[#2c2c2c]" : "bg-[#202020]";

                  return (
                    <div
                      key={`${event.eventId}-${participant.driverSlug}-mobile`}
                      className={`border-b border-racing-steel/20 px-3 py-3 last:border-b-0 ${rowTone}`}
                    >
                      <div className="flex flex-col gap-3">
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

                        <div className="grid grid-cols-3 gap-2">
                          {columns.map((column) => {
                            const label = getEventParticipationSessionPresentation(column, lang);
                            const session = sessionByKind.get(column.sessionKind) ?? null;

                            return (
                              <div
                                key={`${participant.driverSlug}-${column.sessionKind}-mobile`}
                                className="rounded-sm border border-racing-steel/15 bg-racing-black/25 p-2"
                              >
                                <span className="block text-center text-[10px] font-semibold tracking-wider text-racing-white/55 uppercase">
                                  {label.compactLabel}
                                </span>
                                <span
                                  className={`mt-2 flex h-8 items-center justify-center rounded-sm border px-2 text-sm font-mono font-bold tracking-wider uppercase ${getSessionBadgeTone(session)}`}
                                  aria-label={`${label.accessibilityLabel}: ${
                                    session ? formatEventParticipationSessionValue(session, lang) : "-"
                                  }`}
                                >
                                  {session ? formatEventParticipationSessionValue(session, lang) : "-"}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
