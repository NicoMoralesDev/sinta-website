import type { Language } from "@/app/content/site-content";
import type {
  CurrentChampionshipSummary,
  EventParticipationCard,
} from "@/lib/server/history/types";

function slugifyFilePart(value: string): string {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "event";
}

export function buildResultsShareFileName(roundNumber: number, circuitName: string): string {
  return `sinta-r${roundNumber}-${slugifyFilePart(circuitName)}.png`;
}

export function buildCurrentChampionshipShareFileName(
  seasonYear: number,
  championshipName: string,
): string {
  return `sinta-${seasonYear}-${slugifyFilePart(championshipName)}-standings.png`;
}

function formatResultsShareDate(eventDate: string | null, lang: Language): string | null {
  if (!eventDate) {
    return null;
  }

  const parsedDate = new Date(eventDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  if (lang === "en") {
    return new Intl.DateTimeFormat("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(parsedDate);
  }

  const parts = new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).formatToParts(parsedDate);
  const day = parts.find((part) => part.type === "day")?.value;
  const month = parts.find((part) => part.type === "month")?.value.replace(".", "");
  const year = parts.find((part) => part.type === "year")?.value;

  if (!day || !month || !year) {
    return null;
  }

  return `${day} de ${month} de ${year}`;
}

function joinShareSegments(segments: Array<string | null | undefined>): string {
  return segments
    .map((segment) => segment?.trim())
    .filter(Boolean)
    .join(" - ");
}

export function buildResultsShareCopy(
  event: Pick<EventParticipationCard, "eventDate" | "championshipName" | "roundNumber" | "circuitName">,
  lang: Language,
): { title: string; text: string } {
  const descriptor = joinShareSegments([
    formatResultsShareDate(event.eventDate, lang),
    event.championshipName,
    `R${event.roundNumber}`,
    event.circuitName,
  ]);

  if (lang === "en") {
    return {
      title: `SINTA Results - ${event.championshipName}`,
      text: descriptor,
    };
  }

  return {
    title: `Resultados SINTA - ${event.championshipName}`,
    text: descriptor,
  };
}

export function buildCurrentChampionshipShareCopy(
  current: Pick<CurrentChampionshipSummary, "championship">,
  lang: Language,
): { title: string; text: string } {
  const descriptor = joinShareSegments([
    String(current.championship.seasonYear),
    current.championship.name,
    lang === "en" ? "Current standings" : "Torneo vigente",
  ]);

  if (lang === "en") {
    return {
      title: `SINTA Standings - ${current.championship.name}`,
      text: descriptor,
    };
  }

  return {
    title: `Posiciones SINTA - ${current.championship.name}`,
    text: descriptor,
  };
}
