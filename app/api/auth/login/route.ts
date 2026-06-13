import {
  normalizeUsername,
  setSessionCookie,
  validateCredentials,
  verifyPassword,
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

    const user = await db.collection("users").findOne({ username: normalized });
    if (!user || typeof user.passwordHash !== "string") {
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 },
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 },
      );
    }

    await setSessionCookie({
      userId: user._id.toString(),
      username: normalized,
    });

    return NextResponse.json({ user: { username: normalized } });
  } catch (error) {
    console.error("Login failed:", error);
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}
