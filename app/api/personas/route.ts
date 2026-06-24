import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/personas - get all prebuilt + user's custom personas
export async function GET() {
  try {
    const user = await requireAuth();
    const [prebuilt, custom] = await Promise.all([
      db.persona.findMany({
        where: { isPrebuilt: true, isActive: true },
        orderBy: { label: "asc" },
      }),
      db.persona.findMany({
        where: { ownerId: user.id, isPrebuilt: false },
        orderBy: { createdAt: "desc" },
      }),
    ]);
    return NextResponse.json({ prebuilt, custom });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

// POST /api/personas - create custom persona
export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const body = (await req.json()) as {
      name: string;
      age: number;
      occupation: string;
      technicalLevel: "LOW" | "MEDIUM" | "HIGH";
      goals: string;
      frustrations: string;
      tags?: string[];
    };

    const {
      name,
      age,
      occupation,
      technicalLevel,
      goals,
      frustrations,
      tags = [],
    } = body;
    if (
      !name ||
      !age ||
      !occupation ||
      !technicalLevel ||
      !goals ||
      !frustrations
    ) {
      return NextResponse.json(
        { error: "All fields required" },
        { status: 400 },
      );
    }

    const persona = await db.persona.create({
      data: {
        ownerId: user.id,
        label: `${name} (Custom)`,
        name,
        age,
        occupation,
        technicalLevel,
        goals,
        frustrations,
        tags,
        isPrebuilt: false,
      },
    });

    return NextResponse.json({ persona }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
