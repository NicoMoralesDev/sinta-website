import { createElement } from "react";
import { ImageResponse } from "next/og";

import { handleApiError } from "@/app/api/v1/_utils";
import { resolveLanguage } from "@/app/content/site-content";
import { HistoryNotFoundError } from "@/lib/server/history/errors";
import { getCurrentChampionship } from "@/lib/server/history/service";
import type { CurrentChampionshipSummary } from "@/lib/server/history/types";

export const runtime = "nodejs";

const CACHE_CONTROL = "public, s-maxage=120, stale-while-revalidate=600";
const IMAGE_WIDTH = 1080;
const MIN_IMAGE_HEIGHT = 420;
const IMAGE_PADDING = 36;
const CARD_PADDING = 24;
const TITLE_HEIGHT = 24;
const SUBTITLE_HEIGHT = 18;
const HEADER_HEIGHT = 18;
const ROW_HEIGHT = 24;
const ROW_VERTICAL_PADDING = 10;
const CHROME_BUFFER = 130;

function sanitizeText(value: string | null | undefined, fallback: string): string {
  const normalized = value?.trim();
  return normalized || fallback;
}

function sanitizeCurrent(current: CurrentChampionshipSummary): CurrentChampionshipSummary {
  return {
    ...current,
    championship: {
      ...current.championship,
      name: sanitizeText(current.championship.name, "Championship"),
      organizerName: current.championship.organizerName?.trim() || null,
    },
    leaderboard: current.leaderboard.map((entry, index) => ({
      ...entry,
      driverName: sanitizeText(entry.driverName, `Driver ${index + 1}`),
    })),
  };
}

function getImageHeight(rowCount: number): number {
  const contentHeight =
    IMAGE_PADDING * 2 +
    CARD_PADDING * 2 +
    TITLE_HEIGHT +
    SUBTITLE_HEIGHT +
    HEADER_HEIGHT +
    CHROME_BUFFER +
    Math.max(rowCount, 1) * (ROW_HEIGHT + ROW_VERTICAL_PADDING * 2);

  return Math.max(MIN_IMAGE_HEIGHT, contentHeight);
}

function renderCurrentChampionshipImage(
  current: CurrentChampionshipSummary,
  lang: "es" | "en",
) {
  const topEntries = current.leaderboard.slice(0, 8);
  const subtitle =
    lang === "en"
      ? `${current.championship.seasonYear} standings`
      : `Temporada ${current.championship.seasonYear}`;
  const heading = lang === "en" ? "Current championship" : "Torneo vigente";
  const emptyMessage = lang === "en" ? "No standings available yet." : "Todavia no hay posiciones disponibles.";

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
        padding: `${IMAGE_PADDING}px`,
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
          padding: `${CARD_PADDING}px`,
        },
      },
      createElement(
        "div",
        {
          style: {
            fontSize: `${TITLE_HEIGHT}px`,
            lineHeight: `${TITLE_HEIGHT}px`,
            fontWeight: 700,
            textTransform: "uppercase",
            color: "#ffd534",
            marginBottom: "10px",
          },
        },
        `${heading} - ${current.championship.name}`,
      ),
      createElement(
        "div",
        {
          style: {
            fontSize: `${SUBTITLE_HEIGHT}px`,
            lineHeight: `${SUBTITLE_HEIGHT}px`,
            color: "#d4d4d8",
            marginBottom: "18px",
          },
        },
        subtitle,
      ),
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
              fontSize: `${HEADER_HEIGHT}px`,
              lineHeight: `${HEADER_HEIGHT}px`,
              fontWeight: 700,
              textTransform: "uppercase",
              color: "#d4d4d8",
            },
          },
          lang === "en" ? "Driver" : "Piloto",
        ),
        ...[
          lang === "en" ? "W" : "V",
          "P",
          "T10",
          "PTS",
        ].map((label) =>
          createElement(
            "div",
            {
              key: `current-header-${label}`,
              style: {
                width: "88px",
                fontSize: `${HEADER_HEIGHT}px`,
                lineHeight: `${HEADER_HEIGHT}px`,
                fontWeight: 700,
                textAlign: "center",
                textTransform: "uppercase",
                color: "#d4d4d8",
              },
            },
            label,
          ),
        ),
      ),
      topEntries.length === 0
        ? createElement(
            "div",
            {
              style: {
                fontSize: "18px",
                lineHeight: "24px",
                color: "#d4d4d8",
                paddingTop: "6px",
              },
            },
            emptyMessage,
          )
        : topEntries.map((entry, index) =>
            createElement(
              "div",
              {
                key: `current-${entry.driverSlug}`,
                style: {
                  display: "flex",
                  alignItems: "center",
                  borderBottom: index === topEntries.length - 1 ? "none" : "1px solid #27272a",
                  backgroundColor: index % 2 === 0 ? "#2c2c2c" : "#202020",
                  paddingTop: `${ROW_VERTICAL_PADDING}px`,
                  paddingBottom: `${ROW_VERTICAL_PADDING}px`,
                },
              },
              createElement(
                "div",
                {
                  style: {
                    flex: 1,
                    fontSize: `${ROW_HEIGHT}px`,
                    lineHeight: `${ROW_HEIGHT}px`,
                    fontWeight: 700,
                  },
                },
                entry.driverName,
              ),
              ...[entry.wins, entry.podiums, entry.top10, entry.totalPoints].map((value, valueIndex) =>
                createElement(
                  "div",
                  {
                    key: `current-${entry.driverSlug}-${valueIndex}`,
                    style: {
                      width: "88px",
                      fontSize: `${ROW_HEIGHT}px`,
                      lineHeight: `${ROW_HEIGHT}px`,
                      fontWeight: 700,
                      textAlign: "center",
                      color: "#ffd534",
                    },
                  },
                  String(value),
                ),
              ),
            ),
          ),
    ),
  );
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const lang = resolveLanguage(url.searchParams.get("lang") ?? undefined);
    const current = await getCurrentChampionship(new URLSearchParams("limit=8"));

    if (!current) {
      throw new HistoryNotFoundError("Current championship not found.");
    }

    const safeCurrent = sanitizeCurrent(current);

    return new ImageResponse(renderCurrentChampionshipImage(safeCurrent, lang), {
      width: IMAGE_WIDTH,
      height: getImageHeight(safeCurrent.leaderboard.slice(0, 8).length),
      headers: {
        "Cache-Control": CACHE_CONTROL,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
