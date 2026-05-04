import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb, UserDoc, UserRole } from "@/lib/mongo";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const s = await getSession();
  if (!s || s.role !== "master")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const db = await getDb();
  const users = await db
    .collection<UserDoc>("users")
    .find({}, { projection: { passwordHash: 0 } })
    .sort({ createdAt: 1 })
    .toArray();
  return NextResponse.json({
    users: users.map((u) => ({
      id: String(u._id),
      username: u.username,
      role: u.role,
      createdAt: u.createdAt,
      createdBy: u.createdBy || null,
    })),
  });
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s || s.role !== "master")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { username, password, role } = await req.json();
  const u = String(username || "")
    .toLowerCase()
    .trim();
  const p = String(password || "");
  const r: UserRole = role === "master" ? "master" : "user";
  if (!u || !/^[a-z0-9._@+-]{3,64}$/.test(u))
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  if (p.length < 6)
    return NextResponse.json(
      { error: "Password must be at least 6 chars" },
      { status: 400 }
    );
  const db = await getDb();
  const existing = await db.collection<UserDoc>("users").findOne({ username: u });
  if (existing)
    return NextResponse.json({ error: "Username taken" }, { status: 409 });
  const passwordHash = await bcrypt.hash(p, 10);
  const doc: UserDoc = {
    username: u,
    passwordHash,
    role: r,
    createdAt: new Date(),
    createdBy: s.username,
  };
  const res = await db.collection<UserDoc>("users").insertOne(doc);
  return NextResponse.json({
    user: {
      id: String(res.insertedId),
      username: u,
      role: r,
      createdAt: doc.createdAt,
      createdBy: doc.createdBy,
    },
  });
}
