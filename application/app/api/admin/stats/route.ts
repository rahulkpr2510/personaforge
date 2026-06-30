import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

const ADMIN_USER_IDS = (process.env.ADMIN_CLERK_IDS ?? "")
  .split(",")
  .filter(Boolean);

export async function GET() {
  const { userId } = await auth();

  if (!userId || !ADMIN_USER_IDS.includes(userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [totalUsers, totalAnalyses, statusBreakdown, recentErrors] =
    await Promise.all([
      db.user.count(),
      db.analysis.count(),
      db.analysis.groupBy({ by: ["status"], _count: { status: true } }),
      db.analysis.findMany({
        where: { status: "FAILED", error: { not: null } },
        orderBy: { updatedAt: "desc" },
        take: 20,
        select: { id: true, url: true, error: true, updatedAt: true },
      }),
    ]);

  return NextResponse.json({
    totalUsers,
    totalAnalyses,
    statusBreakdown: Object.fromEntries(
      statusBreakdown.map((r) => [r.status, r._count.status]),
    ),
    recentErrors,
  });
}
