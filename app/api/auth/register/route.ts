import {
  hashPassword,
  normalizeUsername,
  setSessionCookie,
  validateCredentials,
} from "@/lib/auth-server";
import { ensureIndexes, getDb, isMongoConfigured } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  if (!isMongoConfigured()) {
    return NextResponse.json(
      { error: "Cloud sync is not configured." },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as {
      username?: string;
      password?: string;
    };

    const username = body.username ?? "";
    const password = body.password ?? "";
    const validationError = validateCredentials(username, password);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const normalized = normalizeUsername(username);
    await ensureIndexes();
    const db = await getDb();

    const existing = await db
      .collection("users")
      .findOne({ username: normalized });
    if (existing) {
      return NextResponse.json(
        { error: "Username is already taken." },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);
    const result = await db.collection("users").insertOne({
      username: normalized,
      passwordHash,
      createdAt: new Date(),
    });

    await setSessionCookie({
      userId: result.insertedId.toString(),
      username: normalized,
    });

    return NextResponse.json({ user: { username: normalized } });
  } catch (error) {
    console.error("Register failed:", error);
    return NextResponse.json(
      { error: "Registration failed." },
      { status: 500 },
    );
  }
}
