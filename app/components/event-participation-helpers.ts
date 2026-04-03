import type { Language } from "@/app/content/site-content";
import type {
  EventParticipationCard,
  EventParticipationEntry,
} from "@/lib/server/history/types";

export type EventParticipationSessionColumn = {
  sessionKind: EventParticipationEntry["sessions"][number]["sessionKind"];
  sessionLabel: string;
};

type EventParticipationSessionLabel = {
  compact: string;
  full: string[];
};

const SESSION_LABELS: Record<
  EventParticipationEntry["sessions"][number]["sessionKind"],
  Record<Language, EventParticipationSessionLabel>
> = {
  qs: {
    en: { compact: "QS", full: ["Qualy", "Sprint"] },
    es: { compact: "QS", full: ["Qualy", "Sprint"] },
  },
  s: {
    en: { compact: "S", full: ["Sprint"] },
    es: { compact: "S", full: ["Sprint"] },
  },
  primary: {
    en: { compact: "S", full: ["Sprint"] },
    es: { compact: "S", full: ["Sprint"] },
  },
  qf: {
    en: { compact: "QF", full: ["Qualy", "Final"] },
    es: { compact: "QF", full: ["Qualy", "Final"] },
  },
  f: {
    en: { compact: "F", full: ["Final"] },
    es: { compact: "F", full: ["Final"] },
  },
  secondary: {
    en: { compact: "F", full: ["Final"] },
    es: { compact: "F", full: ["Final"] },
  },
  p: {
    en: { compact: "PTS", full: ["Points"] },
    es: { compact: "PTS", full: ["Puntos"] },
  },
};

export type EventParticipationSessionPresentation = {
  compactLabel: string;
  fullLabelLines: string[];
  accessibilityLabel: string;
};

export type EventParticipationSessionGroup = "opening" | "final" | "points";

function splitLabel(label: string): string[] {
  return label
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function isPointsSessionKind(
  sessionKind: EventParticipationEntry["sessions"][number]["sessionKind"],
): boolean {
  return sessionKind === "p";
}

export function getEventParticipationSessionGroup(
  sessionKind: EventParticipationEntry["sessions"][number]["sessionKind"],
): EventParticipationSessionGroup {
  if (sessionKind === "p") {
    return "points";
  }

  if (sessionKind === "qf" || sessionKind === "f" || sessionKind === "secondary") {
    return "final";
  }

  return "opening";
}

export function getEventParticipationSessionPresentation(
  column: EventParticipationSessionColumn,
  lang: Language,
): EventParticipationSessionPresentation {
  const labels = SESSION_LABELS[column.sessionKind]?.[lang];
  const fullLabelLines = labels?.full.length ? labels.full : splitLabel(column.sessionLabel);
  const compactLabel = labels?.compact ?? column.sessionLabel;

  return {
    compactLabel,
    fullLabelLines: fullLabelLines.length > 0 ? fullLabelLines : [column.sessionLabel],
    accessibilityLabel: fullLabelLines.length > 0 ? fullLabelLines.join(" ") : column.sessionLabel,
  };
}

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
    if (isPointsSessionKind(session.sessionKind)) {
      return String(session.position);
    }

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
