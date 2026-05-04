import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import { getSession } from "@/lib/auth";
import { getLastError } from "@/lib/conti";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const s = await getSession();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const last = getLastError();
  if (!last)
    return NextResponse.json({ error: "No recent error" }, { status: 404 });

  const view = req.nextUrl.searchParams.get("view");
  if (view === "image" && last.screenshot) {
    try {
      const buf = await fs.readFile(last.screenshot);
      return new NextResponse(buf, {
        headers: {
          "content-type": "image/png",
          "cache-control": "no-store",
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  }
  return NextResponse.json({
    message: last.message,
    url: last.url,
    hasScreenshot: !!last.screenshot,
    at: last.at,
  });
}
