const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const MIN_LEAD_MINUTES = 15;
const DEFAULT_START_HOUR_ART = 20;
const DEFAULT_STREAM_DURATION_MINUTES = 120;

const EVENT_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function parseEventDateStartInArt(eventDate: string): Date | null {
  if (!EVENT_DATE_REGEX.test(eventDate)) {
    return null;
  }

  const parsed = new Date(`${eventDate}T00:00:00-03:00`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function formatDateAsArtDateTimeLocal(value: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(value);

  const byType = new Map(parts.map((part) => [part.type, part.value]));
  const year = byType.get("year");
  const month = byType.get("month");
  const day = byType.get("day");
  const hour = byType.get("hour");
  const minute = byType.get("minute");

  if (!year || !month || !day || !hour || !minute) {
    throw new Error("Could not format datetime for ART.");
  }

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function roundUpToNextFiveMinutes(value: Date): Date {
  const minutes = value.getUTCMinutes();
  const nextMinute = Math.ceil(minutes / 5) * 5;
  const rounded = new Date(value);
  rounded.setUTCMinutes(nextMinute, 0, 0);
  return rounded;
}

export function isEventCloseInNext24Hours(eventDate: string, now = new Date()): boolean {
  const start = parseEventDateStartInArt(eventDate);
  if (!start) {
    return false;
  }

  const nowMs = now.getTime();
  const startMs = start.getTime();
  const endMs = startMs + MS_PER_DAY;

  return startMs <= nowMs + MS_PER_DAY && endMs >= nowMs;
}

export function suggestLiveWindowForEventDate(
  eventDate: string,
  now = new Date(),
): { startAtArtLocal: string; endAtArtLocal: string } | null {
  const eventStart = parseEventDateStartInArt(eventDate);
  if (!eventStart) {
    return null;
  }

  const defaultStart = new Date(
    `${eventDate}T${String(DEFAULT_START_HOUR_ART).padStart(2, "0")}:00:00-03:00`,
  );
  const minStart = new Date(now.getTime() + MIN_LEAD_MINUTES * MS_PER_MINUTE);
  const chosenStart = defaultStart.getTime() >= minStart.getTime() ? defaultStart : minStart;
  const roundedStart = roundUpToNextFiveMinutes(chosenStart);
  const end = new Date(roundedStart.getTime() + DEFAULT_STREAM_DURATION_MINUTES * MS_PER_MINUTE);

  return {
    startAtArtLocal: formatDateAsArtDateTimeLocal(roundedStart),
    endAtArtLocal: formatDateAsArtDateTimeLocal(end),
  };
}
