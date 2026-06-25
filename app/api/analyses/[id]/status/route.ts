import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const analysis = await db.analysis.findFirst({
      where: { id, userId: user.id },
      select: {
        id: true,
        status: true,
        error: true,
        startedAt: true,
        completedAt: true,
        overallSentiment: true,
        overallFrictionScore: true,
        _count: { select: { pages: true, personas: true } },
      },
    });

    if (!analysis) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(analysis, {
      headers: {
        // Tell clients not to cache status — it changes during pipeline
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
