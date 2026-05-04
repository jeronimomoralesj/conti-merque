import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb, UserDoc } from "@/lib/mongo";
import { signSession, setSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  if (!username || !password) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }
  const db = await getDb();
  const user = await db
    .collection<UserDoc>("users")
    .findOne({ username: String(username).toLowerCase().trim() });
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  const ok = await bcrypt.compare(String(password), user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  const token = await signSession({
    uid: String(user._id),
    username: user.username,
    role: user.role,
  });
  await setSessionCookie(token);
  return NextResponse.json({
    user: { username: user.username, role: user.role },
  });
}
