import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getOneAvailability } from "@/lib/conti";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { articleNum, query } = await req.json().catch(() => ({}));
  const a = String(articleNum || "").trim();
  if (!a)
    return NextResponse.json(
      { error: "Missing articleNum" },
      { status: 400 }
    );
  try {
    const result = await getOneAvailability(
      a,
      query ? String(query).trim() : undefined
    );
    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
