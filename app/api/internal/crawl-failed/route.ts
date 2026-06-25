import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";

const Schema = z.object({
  analysisId: z.string().cuid(),
  reason: z.string().max(500),
});

export async function POST(req: Request) {
  const headersList = await headers();
  const secret = headersList.get("x-internal-secret");

  if (!process.env.INTERNAL_SECRET || secret !== process.env.INTERNAL_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = await req.json().catch(() => null);
  if (!raw)
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const parsed = Schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { analysisId, reason } = parsed.data;

  await db.analysis
    .updateMany({
      where: {
        id: analysisId,
        status: { in: ["PENDING", "CRAWLING"] },
      },
      data: { status: "FAILED", error: reason },
    })
    .catch(console.error);

  return NextResponse.json({ success: true });
}
