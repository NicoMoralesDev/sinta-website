import { NextResponse } from "next/server";

import { HistoryNotFoundError, HistoryValidationError } from "@/lib/server/history/errors";

const DEFAULT_CACHE_CONTROL = "public, s-maxage=120, stale-while-revalidate=600";

type ResponseBody = Record<string, unknown>;

export function jsonOk(body: ResponseBody, cacheControl = DEFAULT_CACHE_CONTROL): NextResponse {
  return NextResponse.json(body, {
    status: 200,
    headers: {
      "Cache-Control": cacheControl,
    },
  });
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof HistoryValidationError) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
      },
      { status: 400 },
    );
  }

  if (error instanceof HistoryNotFoundError) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
      },
      { status: 404 },
    );
  }

  return NextResponse.json(
    {
      ok: false,
      error: "Internal server error.",
    },
    { status: 500 },
  );
}

