import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CreateAnalysisSchema } from "@/lib/validation/schemas";
import { Limits } from "@/lib/rate-limit";

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

    const rl = Limits.createAnalysis(user.id);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later.", resetAt: rl.resetAt },
        { status: 429 },
      );
    }

    const raw = await req.json().catch(() => null);
    if (!raw) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = CreateAnalysisSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { url, personaIds, customPersonas, deviceType } = parsed.data;

    let normalizedHost: string;
    try {
      normalizedHost = new URL(url).hostname;
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Create analysis record — store persona selection in analysisInput (immutable)
    const analysis = await db.analysis.create({
      data: {
        userId: user.id,
        url,
        normalizedHost,
        deviceType,
        status: "PENDING",
        analysisInput: { personaIds, customPersonas, deviceType },
      },
    });

    // Fire-and-forget to crawler service — do NOT await
    triggerCrawler(analysis.id, url, deviceType).catch((err) => {
      console.error(
        `[analyses] Failed to trigger crawler for ${analysis.id}:`,
        err,
      );
      db.analysis
        .update({
          where: { id: analysis.id },
          data: {
            status: "FAILED",
            error: "Failed to trigger crawler service",
          },
        })
        .catch(console.error);
    });

    return NextResponse.json(
      { analysisId: analysis.id, status: "PENDING" },
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

async function triggerCrawler(
  analysisId: string,
  url: string,
  deviceType: "DESKTOP" | "MOBILE",
) {
  const crawlerUrl = process.env.CRAWLER_SERVICE_URL;
  if (!crawlerUrl) throw new Error("CRAWLER_SERVICE_URL is not set");

  const internalApiKey = process.env.CRAWLER_INTERNAL_API_KEY;
  if (!internalApiKey) throw new Error("CRAWLER_INTERNAL_API_KEY is not set");

  const callbackBaseUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!callbackBaseUrl) throw new Error("NEXT_PUBLIC_APP_URL is not set");

  const payload = {
    analysisId,
    url,
    deviceType,
    maxDepth: 2,
    maxPages: 8,
    callbackBaseUrl,
    internalApiKey,
  };

  console.log(`[analyses] Triggering crawler for ${analysisId}:`, {
    crawlerUrl,
    payload: { ...payload, internalApiKey: "[REDACTED]" },
  });

  const res = await fetch(`${crawlerUrl}/crawl`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-api-key": internalApiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Crawler responded ${res.status}: ${body}`);
  }
}
