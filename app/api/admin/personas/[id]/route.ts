import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== "ADMIN") throw new Error("Forbidden");
  return user;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = (await req.json()) as Record<string, unknown>;
    const persona = await db.persona.update({ where: { id }, data: body });
    return NextResponse.json({ persona });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json(
      { error: msg },
      { status: msg === "Forbidden" ? 403 : 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    await db.persona.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json(
      { error: msg },
      { status: msg === "Forbidden" ? 403 : 500 },
    );
  }
}
