import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";

const Schema = z.object({
  analysisId: z.string().cuid(),
  error: z.string().max(500),
  events: z.array(z.unknown()).optional(),
});

export async function POST(req: Request) {
  const headersList = await headers();
  const apiKey = headersList.get("x-internal-api-key");

  if (
    !process.env.CRAWLER_INTERNAL_API_KEY ||
    apiKey !== process.env.CRAWLER_INTERNAL_API_KEY
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = await req.json().catch(() => null);
  if (!raw)
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const parsed = Schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { analysisId, error } = parsed.data;

  await db.analysis
    .updateMany({
      where: {
        id: analysisId,
        status: { in: ["PENDING", "CRAWLING"] },
      },
      data: { status: "FAILED", error: error.slice(0, 500) },
    })
    .catch(console.error);

  return NextResponse.json({ success: true });
}
