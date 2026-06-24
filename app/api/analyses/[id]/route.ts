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
      include: {
        pages: {
          include: { screenshots: true },
          orderBy: { depth: "asc" },
        },
        personas: { orderBy: { createdAt: "asc" } },
        focusGroup: true,
      },
    });

    if (!analysis)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ analysis });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const analysis = await db.analysis.findFirst({
      where: { id, userId: user.id },
    });
    if (!analysis)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.analysis.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
