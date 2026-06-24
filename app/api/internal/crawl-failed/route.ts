// app/api/internal/crawl-failed/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const headersList = await headers();
  if (headersList.get("x-internal-secret") !== process.env.INTERNAL_SECRET)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { analysisId, error } = (await req.json()) as {
    analysisId: string;
    error: string;
  };
  await db.analysis.update({
    where: { id: analysisId },
    data: { status: "FAILED", error: error ?? "Crawler failed" },
  });
  return NextResponse.json({ success: true });
}
