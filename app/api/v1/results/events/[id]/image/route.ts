import { createElement } from "react";
import { ImageResponse } from "next/og";

import { handleApiError } from "@/app/api/v1/_utils";
import { resolveLanguage } from "@/app/content/site-content";
import {
  formatEventParticipationDate,
  formatEventParticipationRoundLabel,
  formatEventParticipationSeasonLabel,
  formatEventParticipationSessionValue,
  getEventParticipationSessionColumns,
  getEventParticipationSessionPresentation,
  isPointsSessionKind,
  type EventParticipationSessionColumn,
} from "@/app/components/event-participation-helpers";
import type { EventParticipationCard } from "@/lib/server/history/types";
import { getResultsEventParticipationById } from "@/lib/server/history/service";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const CACHE_CONTROL = "public, s-maxage=120, stale-while-revalidate=600";
const IMAGE_WIDTH = 1080;
const MIN_IMAGE_HEIGHT = 420;
const IMAGE_VERTICAL_PADDING = 36;
const CARD_VERTICAL_PADDING = 24;
const TITLE_LINE_HEIGHT = 24;
const TITLE_MARGIN_BOTTOM = 8;
const DATE_LINE_HEIGHT = 20;
const DATE_MARGIN_BOTTOM = 18;
const HEADER_LINE_HEIGHT = 18;
const HEADER_PADDING_BOTTOM = 12;
const HEADER_MARGIN_BOTTOM = 8;
const ROW_LINE_HEIGHT = 24;
const ROW_VERTICAL_PADDING = 10;
const HEIGHT_SAFETY_BUFFER = 24;

function sanitizeText(value: string | null | undefined, fallback = ""): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim();
  return normalized || fallback;
}

function getFallbackColumns(lang: "es" | "en"): EventParticipationSessionColumn[] {
  return [
    {
      sessionKind: "f",
      sessionLabel: lang === "en" ? "Result" : "Resultado",
    },
  ];
}

function sanitizeEvent(event: EventParticipationCard): EventParticipationCard {
  return {
    ...event,
    championshipName: sanitizeText(event.championshipName, "Championship"),
    circuitName: sanitizeText(event.circuitName, "Circuit"),
    participants: event.participants.map((participant, participantIndex) => ({
      ...participant,
      driverName: sanitizeText(participant.driverName, `Driver ${participantIndex + 1}`),
      sessions: participant.sessions.map((session) => ({
        ...session,
        sessionLabel: sanitizeText(session.sessionLabel, session.sessionKind.toUpperCase()),
        rawValue: sanitizeText(session.rawValue, "-"),
      })),
    })),
  };
}

function renderEventImageFallback(event: EventParticipationCard, lang: "es" | "en") {
  const columns = getEventParticipationSessionColumns(event);
  const visibleColumns = columns.length > 0 ? columns : getFallbackColumns(lang);
  const eventDate = formatEventParticipationDate(event, lang);
  const title = `${formatEventParticipationSeasonLabel(event, lang)} - ${formatEventParticipationRoundLabel(event)}`;

  return createElement(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        backgroundColor: "#101010",
        color: "#ffffff",
        padding: "36px",
        fontFamily: "sans-serif",
      },
    },
    createElement(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          border: "1px solid #3f3f46",
          backgroundColor: "#18181b",
          padding: "24px",
        },
      },
      createElement(
        "div",
        {
          style: {
            fontSize: "18px",
            fontWeight: 700,
            textTransform: "uppercase",
            color: "#ffd534",
            lineHeight: `${TITLE_LINE_HEIGHT}px`,
            marginBottom: "8px",
          },
        },
        title,
      ),
      eventDate
        ? createElement(
            "div",
            {
              style: {
                fontSize: "14px",
                color: "#d4d4d8",
                lineHeight: `${DATE_LINE_HEIGHT}px`,
                marginBottom: "18px",
              },
            },
            eventDate,
          )
        : null,
      createElement(
        "div",
        {
          style: {
            display: "flex",
            borderBottom: "1px solid #3f3f46",
            paddingBottom: "12px",
            marginBottom: "8px",
          },
        },
        createElement(
          "div",
          {
            style: {
              flex: 1,
              fontSize: "14px",
              fontWeight: 700,
              textTransform: "uppercase",
              color: "#d4d4d8",
              lineHeight: `${HEADER_LINE_HEIGHT}px`,
            },
          },
          lang === "en" ? "Driver" : "Piloto",
        ),
        ...visibleColumns.map((column) =>
          createElement(
            "div",
            {
              key: `fallback-header-${column.sessionKind}`,
              style: {
                width: "88px",
                fontSize: "14px",
                fontWeight: 700,
                textAlign: "center",
                textTransform: "uppercase",
                color: "#d4d4d8",
                lineHeight: `${HEADER_LINE_HEIGHT}px`,
              },
            },
            getEventParticipationSessionPresentation(column, lang).compactLabel,
          ),
        ),
      ),
      ...event.participants.map((participant, participantIndex) => {
        const sessionByKind = new Map(
          participant.sessions.map((session) => [session.sessionKind, session]),
        );

        return createElement(
          "div",
          {
            key: `fallback-${event.eventId}-${participant.driverSlug}`,
            style: {
              display: "flex",
              alignItems: "center",
              borderBottom:
                participantIndex === event.participants.length - 1 ? "none" : "1px solid #27272a",
              paddingTop: "10px",
              paddingBottom: "10px",
            },
          },
          createElement(
            "div",
            {
              style: {
              flex: 1,
              fontSize: "20px",
              fontWeight: 700,
              lineHeight: `${ROW_LINE_HEIGHT}px`,
            },
          },
          participant.driverName,
          ),
          ...visibleColumns.map((column) => {
            const session = sessionByKind.get(column.sessionKind) ?? null;

            return createElement(
              "div",
              {
                key: `fallback-${participant.driverSlug}-${column.sessionKind}`,
                style: {
                  width: "88px",
                  fontSize: "18px",
                  fontWeight: 700,
                  textAlign: "center",
                  color: isPointsSessionKind(column.sessionKind) ? "#ffd534" : "#ffffff",
                  lineHeight: `${ROW_LINE_HEIGHT}px`,
                },
              },
              session ? formatEventParticipationSessionValue(session, lang) : "-",
            );
          }),
        );
      }),
    ),
  );
}

function getEventImageHeight(event: EventParticipationCard): number {
  const participantCount = Math.max(event.participants.length, 1);
  const baseHeight =
    IMAGE_VERTICAL_PADDING * 2 +
    CARD_VERTICAL_PADDING * 2 +
    TITLE_LINE_HEIGHT +
    TITLE_MARGIN_BOTTOM +
    HEADER_LINE_HEIGHT +
    HEADER_PADDING_BOTTOM +
    HEADER_MARGIN_BOTTOM +
    HEIGHT_SAFETY_BUFFER;
  const dateHeight = event.eventDate ? DATE_LINE_HEIGHT + DATE_MARGIN_BOTTOM : 0;
  const rowsHeight = participantCount * (ROW_LINE_HEIGHT + ROW_VERTICAL_PADDING * 2);

  return Math.max(MIN_IMAGE_HEIGHT, baseHeight + dateHeight + rowsHeight);
}

function createEventImageResponse(event: EventParticipationCard, lang: "es" | "en"): ImageResponse {
  const safeEvent = sanitizeEvent(event);
  const options = {
    width: IMAGE_WIDTH,
    height: getEventImageHeight(safeEvent),
    headers: {
      "Cache-Control": CACHE_CONTROL,
    },
  };

  return new ImageResponse(renderEventImageFallback(safeEvent, lang), options);
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const url = new URL(request.url);
    const driver = url.searchParams.get("driver");
    const lang = resolveLanguage(url.searchParams.get("lang") ?? undefined);
    const event = await getResultsEventParticipationById(id, driver ?? undefined);

    return createEventImageResponse(event, lang);
  } catch (error) {
    return handleApiError(error);
  }
}
