import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== "ADMIN") throw new Error("Forbidden");
  return user;
}

export async function GET() {
  try {
    await requireAdmin();
    const personas = await db.persona.findMany({
      orderBy: [{ isPrebuilt: "desc" }, { label: "asc" }],
      include: { _count: { select: { analysisPersonas: true } } },
    });
    return NextResponse.json({ personas });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json(
      { error: msg },
      { status: msg === "Forbidden" ? 403 : 401 },
    );
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = (await req.json()) as {
      label: string;
      name: string;
      age: number;
      occupation: string;
      technicalLevel: "LOW" | "MEDIUM" | "HIGH";
      goals: string;
      frustrations: string;
      tags?: string[];
      isPrebuilt?: boolean;
    };
    const persona = await db.persona.create({
      data: { ...body, isPrebuilt: body.isPrebuilt ?? true },
    });
    return NextResponse.json({ persona }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json(
      { error: msg },
      { status: msg === "Forbidden" ? 403 : 500 },
    );
  }
}
