import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    if (user.role !== "ADMIN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = Number(searchParams.get("page") ?? 1);
    const limit = 20;

    const where = status
      ? {
          status: status as
            | "PENDING"
            | "CRAWLING"
            | "ANALYZING"
            | "COMPLETED"
            | "FAILED",
        }
      : {};

    const [analyses, total] = await Promise.all([
      db.analysis.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { email: true, name: true } },
          _count: { select: { pages: true, personas: true } },
        },
      }),
      db.analysis.count({ where }),
    ]);

    return NextResponse.json({
      analyses,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
