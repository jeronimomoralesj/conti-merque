import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { getDb, UserDoc } from "@/lib/mongo";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword || String(newPassword).length < 6) {
    return NextResponse.json(
      { error: "New password must be at least 6 characters" },
      { status: 400 }
    );
  }
  const db = await getDb();
  const user = await db
    .collection<UserDoc>("users")
    .findOne({ _id: new ObjectId(session.uid) });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const ok = await bcrypt.compare(String(currentPassword), user.passwordHash);
  if (!ok)
    return NextResponse.json({ error: "Current password incorrect" }, { status: 401 });
  const passwordHash = await bcrypt.hash(String(newPassword), 10);
  await db
    .collection<UserDoc>("users")
    .updateOne({ _id: user._id }, { $set: { passwordHash } });
  return NextResponse.json({ ok: true });
}
