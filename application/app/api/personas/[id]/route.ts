import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Limits } from "@/lib/rate-limit";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const user = await requireAuth();

    const rl = Limits.personaCrud(user.id);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { id } = await params;

    const persona = await db.persona.findFirst({
      where: { id, ownerId: user.id, isPrebuilt: false },
      select: { id: true },
    });

    if (!persona) {
      return NextResponse.json(
        { error: "Persona not found or not owned by you" },
        { status: 404 },
      );
    }

    await db.persona.delete({ where: { id } });
    return NextResponse.json({ success: true });
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

export async function PATCH(req: Request, { params }: Params) {
  try {
    const user = await requireAuth();

    const rl = Limits.personaCrud(user.id);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { id } = await params;

    // Ensure persona belongs to this user and is not a prebuilt
    const persona = await db.persona.findFirst({
      where: { id, ownerId: user.id, isPrebuilt: false },
      select: { id: true },
    });

    if (!persona) {
      return NextResponse.json(
        { error: "Persona not found or not owned by you" },
        { status: 404 },
      );
    }

    const body = await req.json();
    const {
      name,
      age,
      occupation,
      technicalLevel,
      goals,
      frustrations,
      tags,
    } = body;

    const updated = await db.persona.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(age !== undefined && { age: Number(age) }),
        ...(occupation !== undefined && { occupation }),
        ...(technicalLevel !== undefined && { technicalLevel }),
        ...(goals !== undefined && { goals }),
        ...(frustrations !== undefined && { frustrations }),
        ...(tags !== undefined && { tags }),
      },
    });

    return NextResponse.json({ persona: updated });
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
