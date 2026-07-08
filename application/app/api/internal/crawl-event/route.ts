import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { getRequestId, apiSuccess, apiFailure } from "@/lib/api/response";
import { ApiErrors } from "@/lib/api/errors";

const Schema = z.object({
	analysisId: z.string().cuid(),
	event: z.object({
		type: z.string(),
		message: z.string(),
		data: z.record(z.string(), z.unknown()).optional(),
		timestamp: z.string(),
	}),
});

export async function POST(req: Request) {
	const requestId = getRequestId(req);
	const headersList = await headers();
	const apiKey = headersList.get("x-internal-api-key");

	if (
		!process.env.CRAWLER_INTERNAL_API_KEY ||
		apiKey !== process.env.CRAWLER_INTERNAL_API_KEY
	) {
		return apiFailure(requestId, ApiErrors.unauthorized(), 401);
	}

	const raw = await req.json().catch(() => null);
	if (!raw) {
		return apiFailure(requestId, ApiErrors.invalidJson(), 400);
	}

	const parsed = Schema.safeParse(raw);
	if (!parsed.success) {
		return apiFailure(
			requestId,
			ApiErrors.validationFailed(parsed.error.flatten().fieldErrors as Record<string, string[]>),
			400,
		);
	}

	const { analysisId, event } = parsed.data;

	// Append the event to the meta.crawlerEvents array in the database
	try {
		const analysis = await db.analysis.findUnique({
			where: { id: analysisId },
			select: { meta: true, status: true },
		});

		if (!analysis || analysis.status === "COMPLETED" || analysis.status === "FAILED") {
			return apiSuccess(requestId, { ok: true });
		}

		const currentMeta = (analysis.meta as Record<string, unknown> | null) ?? {};
		const existingEvents = Array.isArray(currentMeta.crawlerEvents)
			? currentMeta.crawlerEvents
			: [];

		await db.analysis.update({
			where: { id: analysisId },
			data: {
				// Mark as CRAWLING on first real event if still PENDING
				...(analysis.status === "PENDING" && event.type === "job_started"
					? { status: "CRAWLING" }
					: {}),
				meta: {
					...currentMeta,
					crawlerEvents: [...existingEvents, event],
				} as unknown as Prisma.InputJsonValue,
			},
		});
	} catch (err) {
		// Non-fatal — do not block the crawler
		console.warn("[crawl-event] DB update failed:", (err as Error).message);
	}

	return apiSuccess(requestId, { ok: true });
}
