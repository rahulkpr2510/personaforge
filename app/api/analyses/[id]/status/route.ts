import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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
        _count: { select: { pages: true, personas: true } },
      },
    });

    if (!analysis)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(analysis);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
