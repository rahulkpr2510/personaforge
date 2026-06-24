import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const user = await requireAuth();
    const analyses = await db.analysis.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { pages: true, personas: true } },
        focusGroup: { select: { id: true } },
      },
    });
    return NextResponse.json({ analyses });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = (await req.json()) as {
      url: string;
      personaIds?: string[];
      customPersonas?: Array<{
        name: string;
        age: number;
        occupation: string;
        technicalLevel: string;
        goals: string;
        frustrations: string;
      }>;
      deviceType?: "DESKTOP" | "MOBILE";
    };

    const {
      url,
      personaIds = [],
      customPersonas = [],
      deviceType = "DESKTOP",
    } = body;

    if (!url)
      return NextResponse.json({ error: "URL is required" }, { status: 400 });

    const totalPersonas = personaIds.length + customPersonas.length;
    if (totalPersonas === 0)
      return NextResponse.json(
        { error: "At least 1 persona required" },
        { status: 400 },
      );
    if (totalPersonas > 5)
      return NextResponse.json(
        { error: "Maximum 5 personas allowed" },
        { status: 400 },
      );

    let normalizedHost: string;
    try {
      normalizedHost = new URL(url).hostname;
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Store persona config in meta so the callback can pick it up
    const analysis = await db.analysis.create({
      data: {
        userId: user.id,
        url,
        normalizedHost,
        deviceType,
        status: "PENDING",
        meta: { personaIds, customPersonas },
      },
    });

    // Fire off crawler service (non-blocking)
    fetch(`${process.env.CRAWLER_SERVICE_URL}/crawl`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-crawler-secret": process.env.CRAWLER_SECRET!,
      },
      body: JSON.stringify({ url, analysisId: analysis.id, deviceType }),
    }).catch((err) => {
      console.error("[POST /api/analyses] Crawler dispatch failed:", err);
      db.analysis
        .update({
          where: { id: analysis.id },
          data: { status: "FAILED", error: "Crawler unreachable" },
        })
        .catch(console.error);
    });

    // Mark as CRAWLING immediately after dispatch
    await db.analysis.update({
      where: { id: analysis.id },
      data: { status: "CRAWLING", startedAt: new Date() },
    });

    return NextResponse.json(
      { analysisId: analysis.id, status: "CRAWLING" },
      { status: 201 },
    );
  } catch (err) {
    console.error("[POST /api/analyses]:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
