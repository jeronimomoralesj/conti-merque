import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb, UserDoc } from "@/lib/mongo";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const s = await getSession();
  if (!s || s.role !== "master")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  if (!ObjectId.isValid(id))
    return NextResponse.json({ error: "Bad id" }, { status: 400 });
  const _id = new ObjectId(id);
  if (String(_id) === s.uid)
    return NextResponse.json(
      { error: "Cannot delete yourself" },
      { status: 400 }
    );
  const db = await getDb();
  await db.collection<UserDoc>("users").deleteOne({ _id });
  return NextResponse.json({ ok: true });
}
