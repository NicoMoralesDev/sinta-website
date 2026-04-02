import type { Language } from "@/app/content/site-content";
import type {
  EventParticipationCard,
  EventParticipationEntry,
} from "@/lib/server/history/types";

export type EventParticipationSessionColumn = {
  sessionKind: EventParticipationEntry["sessions"][number]["sessionKind"];
  sessionLabel: string;
};

export function getEventParticipationSessionOrder(
  sessionKind: EventParticipationEntry["sessions"][number]["sessionKind"],
): number {
  if (sessionKind === "qs") {
    return 0;
  }

  if (sessionKind === "s" || sessionKind === "primary") {
    return 1;
  }

  if (sessionKind === "qf") {
    return 2;
  }

  if (sessionKind === "f" || sessionKind === "secondary") {
    return 3;
  }

  if (sessionKind === "p") {
    return 4;
  }

  return 10;
}

export function getEventParticipationSessionColumns(
  event: EventParticipationCard,
): EventParticipationSessionColumn[] {
  const map = new Map<string, EventParticipationSessionColumn>();

  for (const participant of event.participants) {
    for (const session of participant.sessions) {
      const key = `${session.sessionKind}:${session.sessionLabel}`;
      if (!map.has(key)) {
        map.set(key, {
          sessionKind: session.sessionKind,
          sessionLabel: session.sessionLabel,
        });
      }
    }
  }

  return Array.from(map.values()).sort((left, right) => {
    const byKind =
      getEventParticipationSessionOrder(left.sessionKind) -
      getEventParticipationSessionOrder(right.sessionKind);
    if (byKind !== 0) {
      return byKind;
    }

    return left.sessionLabel.localeCompare(right.sessionLabel);
  });
}

export function formatEventParticipationSessionValue(
  session: EventParticipationEntry["sessions"][number],
  lang: Language,
): string {
  if (session.position !== null) {
    return `P${session.position}`;
  }

  if (session.status === "ABSENT") {
    return lang === "es" ? "AUS" : "ABS";
  }

  return session.status ?? session.rawValue;
}

export function formatEventParticipationSeasonLabel(
  event: EventParticipationCard,
  lang: Language,
): string {
  if (lang === "en") {
    return `Season ${event.seasonYear} - ${event.championshipName}`;
  }

  return `Temporada ${event.seasonYear} - ${event.championshipName}`;
}

export function formatEventParticipationRoundLabel(
  event: EventParticipationCard,
): string {
  return `R${event.roundNumber} - ${event.circuitName}`;
}

export function formatEventParticipationDate(
  event: EventParticipationCard,
  lang: Language,
): string | null {
  if (!event.eventDate) {
    return null;
  }

  return new Date(event.eventDate).toLocaleDateString(
    lang === "en" ? "en-US" : "es-AR",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}
