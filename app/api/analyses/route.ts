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
      select: {
        id: true,
        url: true,
        normalizedHost: true,
        status: true,
        deviceType: true,
        overallSentiment: true,
        overallFrictionScore: true,
        startedAt: true,
        completedAt: true,
        createdAt: true,
        error: true,
        _count: { select: { pages: true, personas: true } },
        focusGroup: { select: { id: true } },
      },
    });

    return NextResponse.json({ analyses });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[GET /api/analyses]:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();

    // Rate limit: 5 analyses per hour per user
    const rl = Limits.createAnalysis(user.id);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Rate limit: maximum 5 analyses per hour" },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)),
            "X-RateLimit-Limit": "5",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(rl.resetAt),
          },
        },
      );
    }

    // Parse and validate with Zod — rejects invalid/malicious input
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
    const normalizedHost = new URL(url).hostname.toLowerCase();

    // Guard: crawler service must be configured before accepting jobs
    if (!process.env.CRAWLER_SERVICE_URL || !process.env.CRAWLER_SECRET) {
      console.error("[POST /api/analyses] Crawler env vars missing");
      return NextResponse.json(
        { error: "Analysis service is not configured" },
        { status: 503 },
      );
    }

    // Guard: INTERNAL_SECRET must be set or crawl-complete callback is open
    if (!process.env.INTERNAL_SECRET) {
      console.error("[POST /api/analyses] INTERNAL_SECRET missing");
      return NextResponse.json(
        { error: "Service misconfigured" },
        { status: 503 },
      );
    }

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

    // Fire-and-forget: dispatch to crawler service
    fetch(`${process.env.CRAWLER_SERVICE_URL}/crawl`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-crawler-secret": process.env.CRAWLER_SECRET,
      },
      body: JSON.stringify({
        url,
        analysisId: analysis.id,
        deviceType,
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/internal/crawl-complete`,
        callbackSecret: process.env.INTERNAL_SECRET,
      }),
    }).catch(async (dispatchErr) => {
      console.error(
        "[POST /api/analyses] Crawler dispatch failed:",
        dispatchErr,
      );
      await db.analysis
        .update({
          where: { id: analysis.id },
          data: { status: "FAILED", error: "Crawler service unreachable" },
        })
        .catch(console.error);
    });

    await db.analysis.update({
      where: { id: analysis.id },
      data: { status: "CRAWLING", startedAt: new Date() },
    });

    return NextResponse.json(
      { analysisId: analysis.id, status: "CRAWLING" },
      { status: 201 },
    );
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[POST /api/analyses]:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
