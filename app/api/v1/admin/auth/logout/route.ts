import { NextResponse } from "next/server";

import { clearAdminSessionCookie } from "@/app/api/v1/admin/_utils";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  return clearAdminSessionCookie(response);
}
