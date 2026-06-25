import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CustomPersonaSchema } from "@/lib/validation/schemas";
import { Limits } from "@/lib/rate-limit";

export async function GET() {
  try {
    const user = await requireAuth();

    const [prebuilt, custom] = await Promise.all([
      db.persona.findMany({
        where: { isPrebuilt: true, isActive: true },
        orderBy: { label: "asc" },
        select: {
          id: true,
          label: true,
          name: true,
          age: true,
          occupation: true,
          technicalLevel: true,
          goals: true,
          frustrations: true,
          tags: true,
        },
      }),
      db.persona.findMany({
        where: { ownerId: user.id, isPrebuilt: false },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          label: true,
          name: true,
          age: true,
          occupation: true,
          technicalLevel: true,
          goals: true,
          frustrations: true,
          tags: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({ prebuilt, custom });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();

    const rl = Limits.personaCrud(user.id);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Slow down." },
        { status: 429, headers: { "Retry-After": "60" } },
      );
    }

    // Cap custom personas per user to prevent DB bloat
    const existingCount = await db.persona.count({
      where: { ownerId: user.id, isPrebuilt: false },
    });
    if (existingCount >= 20) {
      return NextResponse.json(
        { error: "Maximum 20 custom personas per account" },
        { status: 409 },
      );
    }

    const raw = await req.json().catch(() => null);
    if (!raw) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = CustomPersonaSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { name, age, occupation, technicalLevel, goals, frustrations, tags } =
      parsed.data;

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
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[POST /api/personas]:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
