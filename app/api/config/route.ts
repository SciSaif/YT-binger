import { isGuestKeyAvailable } from "@/lib/youtube-server-key";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    guestKeyAvailable: isGuestKeyAvailable(),
  });
}
