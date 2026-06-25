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
      include: {
        pages: {
          orderBy: { depth: "asc" },
          include: {
            screenshots: { select: { id: true, cdnUrl: true, type: true } },
          },
          // Never return raw page content in list — only for full fetch
          select: {
            id: true,
            url: true,
            title: true,
            depth: true,
            formsCount: true,
            buttonsCount: true,
            linksCount: true,
            textLength: true,
            hasAuthForm: true,
            primaryActionLabel: true,
            navStructure: true,
            visionMeta: true,
            createdAt: true,
            screenshots: { select: { id: true, cdnUrl: true, type: true } },
          },
        },
        personas: {
          orderBy: { createdAt: "asc" },
          // Exclude rawModelOutput from API responses — internal only
          select: {
            id: true,
            label: true,
            name: true,
            age: true,
            occupation: true,
            technicalLevel: true,
            goals: true,
            frustrations: true,
            firstImpressions: true,
            positives: true,
            painPoints: true,
            recommendations: true,
            accessibilityNotes: true,
            adoptionLikelihood: true,
            sentiment: true,
            frictionScore: true,
            evidence: true,
            createdAt: true,
          },
        },
        focusGroup: true,
      },
    });

    if (!analysis) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ analysis });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[GET /api/analyses/[id]]:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(_req: Request, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const analysis = await db.analysis.findFirst({
      where: { id, userId: user.id },
      select: { id: true, status: true },
    });

    if (!analysis) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const cancellableStatuses = ["PENDING", "CRAWLING", "ANALYZING"];
    if (!cancellableStatuses.includes(analysis.status)) {
      return NextResponse.json(
        { error: `Cannot cancel analysis in status: ${analysis.status}` },
        { status: 409 },
      );
    }

    await db.analysis.update({
      where: { id },
      data: { status: "FAILED", error: "Cancelled by user" },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[PATCH /api/analyses/[id]]:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const analysis = await db.analysis.findFirst({
      where: { id, userId: user.id },
      select: { id: true, status: true },
    });

    if (!analysis) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Prevent deleting a running analysis — cancel first
    if (["CRAWLING", "ANALYZING"].includes(analysis.status)) {
      return NextResponse.json(
        { error: "Cancel the analysis before deleting" },
        { status: 409 },
      );
    }

    await db.analysis.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[DELETE /api/analyses/[id]]:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
