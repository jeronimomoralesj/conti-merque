import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { getDb, UserDoc } from "@/lib/mongo";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const s = await getSession();
  if (!s || s.role !== "master")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  if (!ObjectId.isValid(id))
    return NextResponse.json({ error: "Bad id" }, { status: 400 });
  const { newPassword } = await req.json();
  if (!newPassword || String(newPassword).length < 6)
    return NextResponse.json(
      { error: "Password must be at least 6 chars" },
      { status: 400 }
    );
  const passwordHash = await bcrypt.hash(String(newPassword), 10);
  const db = await getDb();
  const r = await db
    .collection<UserDoc>("users")
    .updateOne({ _id: new ObjectId(id) }, { $set: { passwordHash } });
  if (r.matchedCount === 0)
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
