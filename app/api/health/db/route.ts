import { NextResponse } from "next/server";
import { checkDbConnection } from "@/lib/server/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const health = await checkDbConnection();
    return NextResponse.json(
      {
        ok: true,
        ...health,
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
      },
      { status: 503 },
    );
  }
}
