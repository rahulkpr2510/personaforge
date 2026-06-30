import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const user = await requireAuth();
    if (user.role !== "ADMIN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const users = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { analyses: true, personas: true } } },
    });
    return NextResponse.json({ users });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = await requireAuth();
    if (admin.role !== "ADMIN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { userId, role } = (await req.json()) as {
      userId: string;
      role: "USER" | "ADMIN";
    };
    const updated = await db.user.update({
      where: { id: userId },
      data: { role },
    });
    return NextResponse.json({ user: updated });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
