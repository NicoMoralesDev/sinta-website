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
  getEventParticipationSessionGroup,
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

function getFallbackColumns(lang: "es" | "en"): EventParticipationSessionColumn[] {
  return [
    {
      sessionKind: "f",
      sessionLabel: lang === "en" ? "Result" : "Resultado",
    },
  ];
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

function getSessionTone(
  session: EventParticipationCard["participants"][number]["sessions"][number] | null,
  value: string,
): { background: string; border: string; color: string } {
  if (!session) {
    return {
      background: "rgba(148, 163, 184, 0.12)",
      border: "rgba(148, 163, 184, 0.35)",
      color: "rgba(255, 255, 255, 0.45)",
    };
  }

  if (isPointsSessionKind(session.sessionKind)) {
    return {
      background: "rgba(17, 17, 17, 0.82)",
      border: "rgba(255, 213, 52, 0.45)",
      color: "#ffd534",
    };
  }

  if (value === "P1") {
    return {
      background: "#ffd534",
      border: "#ffd534",
      color: "#111111",
    };
  }

  if (/^P([2-3])$/.test(value)) {
    return {
      background: "rgba(74, 222, 128, 0.15)",
      border: "rgba(74, 222, 128, 0.7)",
      color: "#dcfce7",
    };
  }

  if (/^P([4-9]|10)$/.test(value)) {
    return {
      background: "rgba(56, 189, 248, 0.15)",
      border: "rgba(56, 189, 248, 0.7)",
      color: "#e0f2fe",
    };
  }

  if (value === "DNF") {
    return {
      background: "rgba(239, 68, 68, 0.15)",
      border: "rgba(239, 68, 68, 0.7)",
      color: "#fecaca",
    };
  }

  if (value === "DNQ") {
    return {
      background: "rgba(251, 146, 60, 0.15)",
      border: "rgba(251, 146, 60, 0.7)",
      color: "#ffedd5",
    };
  }

  if (value === "DSQ") {
    return {
      background: "rgba(232, 121, 249, 0.15)",
      border: "rgba(232, 121, 249, 0.7)",
      color: "#fae8ff",
    };
  }

  if (value === "ABS" || value === "AUS") {
    return {
      background: "rgba(148, 163, 184, 0.15)",
      border: "rgba(148, 163, 184, 0.7)",
      color: "#e2e8f0",
    };
  }

  return {
    background: "rgba(255, 213, 52, 0.1)",
    border: "rgba(255, 213, 52, 0.45)",
    color: "#ffd534",
  };
}

function renderEventImage(event: EventParticipationCard, lang: "es" | "en") {
  const columns = getEventParticipationSessionColumns(event);
  const visibleColumns = columns.length > 0 ? columns : getFallbackColumns(lang);
  const eventDate = formatEventParticipationDate(event, lang);
  const pilotLabel = lang === "en" ? "Driver" : "Piloto";

  return createElement(
    "div",
    {
      style: {
        display: "flex",
        width: "100%",
        height: "100%",
        background: "linear-gradient(180deg, #151515 0%, #050505 100%)",
        color: "#ffffff",
        padding: "48px",
        fontFamily: "sans-serif",
      },
    },
    createElement(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          flex: 1,
          border: "1px solid rgba(120, 120, 120, 0.35)",
          background: "rgba(20, 20, 20, 0.92)",
        },
      },
      createElement(
        "div",
        {
          style: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "24px",
            padding: "28px 32px",
            borderBottom: "1px solid rgba(120, 120, 120, 0.35)",
            background: "rgba(36, 36, 36, 0.92)",
          },
        },
        createElement(
          "div",
          {
            style: {
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            },
          },
          createElement(
            "div",
            {
              style: {
                display: "flex",
                fontSize: "18px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                color: "#ffd534",
              },
            },
            formatEventParticipationSeasonLabel(event, lang),
          ),
          createElement(
            "div",
            {
              style: {
                display: "flex",
                fontSize: "34px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              },
            },
            formatEventParticipationRoundLabel(event),
          ),
        ),
        eventDate
          ? createElement(
              "div",
              {
                style: {
                  display: "flex",
                  fontSize: "18px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                  color: "rgba(255, 255, 255, 0.55)",
                },
              },
              eventDate,
            )
          : null,
      ),
      createElement(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
            padding: "24px 24px 28px",
          },
        },
        createElement(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              borderBottom: "1px solid rgba(120, 120, 120, 0.35)",
              background: "rgba(36, 36, 36, 0.92)",
              padding: "16px 20px",
            },
          },
          createElement(
            "div",
            {
              style: {
                display: "flex",
                flex: 1,
                fontSize: "18px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                color: "rgba(255, 255, 255, 0.68)",
              },
            },
            pilotLabel,
          ),
          ...visibleColumns.map((column, index) => {
            const label = getEventParticipationSessionPresentation(column, lang);

            return createElement(
              "div",
              {
                key: column.sessionKind,
                style: {
                  display: "flex",
                  width: "112px",
                  justifyContent: "center",
                  fontSize: "18px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                  color: "rgba(255, 255, 255, 0.68)",
                  borderLeft: hasLeadingSeparator(visibleColumns, index)
                    ? "3px solid rgba(255, 213, 52, 0.9)"
                    : undefined,
                  paddingLeft: hasLeadingSeparator(visibleColumns, index) ? "16px" : undefined,
                },
              },
              label.compactLabel,
            );
          }),
        ),
        ...event.participants.map((participant, participantIndex) => {
          const sessionByKind = new Map(
            participant.sessions.map((session) => [session.sessionKind, session]),
          );
          const rowBackground =
            participantIndex % 2 === 0 ? "rgba(44, 44, 44, 1)" : "rgba(32, 32, 32, 1)";

          return createElement(
            "div",
            {
              key: `${event.eventId}-${participant.driverSlug}`,
              style: {
                display: "flex",
                alignItems: "center",
                minHeight: "72px",
                borderBottom: "1px solid rgba(120, 120, 120, 0.2)",
                background: rowBackground,
                padding: "12px 20px",
              },
            },
            createElement(
              "div",
              {
                style: {
                  display: "flex",
                  flex: 1,
                  fontSize: "24px",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                },
              },
              participant.driverName,
            ),
            ...visibleColumns.map((column) => {
              const session = sessionByKind.get(column.sessionKind) ?? null;
              const value = session
                ? formatEventParticipationSessionValue(session, lang)
                : "-";
              const tone = getSessionTone(session, value);
              const columnIndex = visibleColumns.findIndex(
                (visibleColumn) => visibleColumn.sessionKind === column.sessionKind,
              );

              return createElement(
                "div",
                {
                  key: `${participant.driverSlug}-${column.sessionKind}`,
                  style: {
                    display: "flex",
                    width: "112px",
                    justifyContent: "center",
                    alignItems: "center",
                    marginLeft: "12px",
                    borderLeft: hasLeadingSeparator(visibleColumns, columnIndex)
                      ? "3px solid rgba(255, 213, 52, 0.9)"
                      : undefined,
                    paddingLeft: hasLeadingSeparator(visibleColumns, columnIndex) ? "16px" : undefined,
                  },
                },
                createElement(
                  "div",
                  {
                    style: {
                      display: "flex",
                      width: "100%",
                      justifyContent: "center",
                      alignItems: "center",
                      minHeight: "44px",
                      borderRadius: "4px",
                      border: `1px solid ${tone.border}`,
                      background: tone.background,
                      color: tone.color,
                      fontSize: "22px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    },
                  },
                  value,
                ),
              );
            }),
          );
        }),
      ),
    ),
  );
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const url = new URL(request.url);
    const driver = url.searchParams.get("driver");
    const lang = resolveLanguage(url.searchParams.get("lang") ?? undefined);
    const event = await getResultsEventParticipationById(id, driver ?? undefined);
    const imageHeight = Math.max(1350, 420 + event.participants.length * 72);

    return new ImageResponse(renderEventImage(event, lang), {
      width: 1080,
      height: imageHeight,
      headers: {
        "Cache-Control": CACHE_CONTROL,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
