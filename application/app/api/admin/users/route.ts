import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const viewer = await requireAuth();
    if (viewer.role !== "ADMIN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const users = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { analyses: true, personas: true } } },
    });
    // Return currentUserId so the UI can disable self-role-change
    return NextResponse.json({ users, currentUserId: viewer.id });
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

    // Prevent admins from changing their own role
    if (userId === admin.id) {
      return NextResponse.json(
        { error: "You cannot change your own role." },
        { status: 400 },
      );
    }

    const updated = await db.user.update({
      where: { id: userId },
      data: { role },
    });
    return NextResponse.json({ user: updated });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
