import { getSessionFromRequest, toObjectId } from "@/lib/auth-server";
import { ensureIndexes, getDb, isMongoConfigured } from "@/lib/mongodb";
import { normalizeAppState } from "@/lib/sync-merge";
import type { AppState } from "@/types";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  if (!isMongoConfigured()) {
    return NextResponse.json(
      { error: "Cloud sync is not configured." },
      { status: 503 },
    );
  }

  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    await ensureIndexes();
    const db = await getDb();
    const doc = await db.collection("userData").findOne({
      userId: toObjectId(session.userId),
    });

    const app = normalizeAppState(doc?.app as AppState | undefined);
    const updatedAt =
      doc?.updatedAt instanceof Date ? doc.updatedAt.getTime() : null;

    return NextResponse.json({ app, updatedAt });
  } catch (error) {
    console.error("Sync fetch failed:", error);
    return NextResponse.json(
      { error: "Could not load cloud data." },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  if (!isMongoConfigured()) {
    return NextResponse.json(
      { error: "Cloud sync is not configured." },
      { status: 503 },
    );
  }

  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { app?: AppState };
    const app = normalizeAppState(body.app);
    const updatedAt = new Date();

    await ensureIndexes();
    const db = await getDb();
    await db.collection("userData").updateOne(
      { userId: toObjectId(session.userId) },
      {
        $set: {
          userId: toObjectId(session.userId),
          app,
          updatedAt,
        },
      },
      { upsert: true },
    );

    return NextResponse.json({ ok: true, updatedAt: updatedAt.getTime() });
  } catch (error) {
    console.error("Sync save failed:", error);
    return NextResponse.json(
      { error: "Could not save cloud data." },
      { status: 500 },
    );
  }
}
