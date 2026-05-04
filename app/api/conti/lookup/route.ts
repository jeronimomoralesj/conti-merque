import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { searchOnly } from "@/lib/conti";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { query } = await req.json().catch(() => ({}));
  const q = String(query || "").trim();
  if (!q) return NextResponse.json({ error: "Missing query" }, { status: 400 });
  try {
    const { items, debug } = await searchOnly(q);
    return NextResponse.json({ items, debug });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
