import { clearSessionCookie } from "@/lib/auth-server";
import { NextResponse } from "next/server";

export async function POST() {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
