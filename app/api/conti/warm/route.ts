import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ensureWarm } from "@/lib/conti";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST() {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const r = await ensureWarm();
    return NextResponse.json(r);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
