import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CustomPersonaSchema } from "@/lib/validation/schemas";
import { Limits } from "@/lib/rate-limit";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

/**
 * Generates a 2–3 sentence narrative description of a custom persona using Groq.
 * Returns null on any failure — persona creation is never blocked by this.
 */
async function generatePersonaDescription(data: {
	name: string;
	age: number;
	occupation: string;
	technicalLevel: string;
	goals: string;
	frustrations: string;
}): Promise<string | null> {
	try {
		const techMap: Record<string, string> = {
			LOW: "non-technical (avoids complexity, prefers simple intuitive interfaces)",
			MEDIUM: "moderately technical (comfortable with standard digital tools)",
			HIGH: "highly technical (power user who prefers control and efficiency)",
		};

		const prompt = `Write a vivid 2–3 sentence first-person narrative portrait of this user persona. 
Write as if describing them to a UX designer. Focus on their personality, daily context, and how their 
tech comfort level shapes their expectations. Be specific and concrete, not generic.

Name: ${data.name}, ${data.age} years old
Occupation: ${data.occupation}
Tech level: ${techMap[data.technicalLevel] ?? data.technicalLevel}
Goals: ${data.goals}
Frustrations: ${data.frustrations}

Portrait (2–3 sentences, no bullet points, no labels):`;

		const completion = await groq.chat.completions.create({
			model: "llama-3.1-8b-instant",
			messages: [{ role: "user", content: prompt }],
			max_tokens: 200,
			temperature: 0.7,
		});

		const text = completion.choices[0]?.message?.content?.trim();
		return text ?? null;
	} catch {
		// Non-blocking — persona saves without description if LLM fails
		return null;
	}
}

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
					metadata: true,
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
					metadata: true,
					createdAt: true,
				},
			}),
		]);

		// Extract description from metadata.description
		const withDescription = (p: { metadata: unknown; [k: string]: unknown }) => ({
			...p,
			description:
				(p.metadata as { description?: string } | null)?.description ?? null,
		});

		return NextResponse.json({
			prebuilt: prebuilt.map(withDescription),
			custom: custom.map(withDescription),
		});
	} catch (err) {
		if ((err as NodeJS.ErrnoException).code === "UNAUTHORIZED") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
				{ error: "You have reached the maximum of 20 custom personas per account." },
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

		const { name, age, occupation, technicalLevel, goals, frustrations, tags } = parsed.data;

		// Generate AI description in parallel with persona creation check
		const description = await generatePersonaDescription({
			name,
			age,
			occupation,
			technicalLevel,
			goals,
			frustrations,
		});

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
				metadata: description ? { description } : {},
			},
		});

		return NextResponse.json(
			{
				persona: {
					...persona,
					description,
				},
			},
			{ status: 201 },
		);
	} catch (err) {
		if ((err as NodeJS.ErrnoException).code === "UNAUTHORIZED") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		console.error("[POST /api/personas]:", err);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
