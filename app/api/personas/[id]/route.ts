import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const persona = await db.persona.findFirst({
      where: { id, ownerId: user.id, isPrebuilt: false },
    });
    if (!persona)
      return NextResponse.json(
        { error: "Not found or not authorized" },
        { status: 404 },
      );

    await db.persona.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
