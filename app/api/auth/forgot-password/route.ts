import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb, UserDoc } from "@/lib/mongo";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { email, newPassword } = await req.json();
  const id = String(email || "").toLowerCase().trim();
  const np = String(newPassword || "");
  if (!id) {
    return NextResponse.json({ error: "Email requerido" }, { status: 400 });
  }
  if (np.length < 6) {
    return NextResponse.json(
      { error: "La nueva contraseña debe tener al menos 6 caracteres" },
      { status: 400 }
    );
  }
  const db = await getDb();
  const user = await db
    .collection<UserDoc>("users")
    .findOne({ username: id });
  if (!user) {
    return NextResponse.json(
      { error: "No existe una cuenta con ese email" },
      { status: 404 }
    );
  }
  const passwordHash = await bcrypt.hash(np, 10);
  await db
    .collection<UserDoc>("users")
    .updateOne({ _id: user._id }, { $set: { passwordHash } });
  return NextResponse.json({ ok: true });
}
