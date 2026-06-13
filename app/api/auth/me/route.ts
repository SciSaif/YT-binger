import { getSessionFromCookies } from "@/lib/auth-server";
import { isMongoConfigured } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  if (!isMongoConfigured()) {
    return NextResponse.json({ user: null, configured: false });
  }

  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ user: null, configured: true });
  }

  return NextResponse.json({
    user: { username: session.username },
    configured: true,
  });
}
