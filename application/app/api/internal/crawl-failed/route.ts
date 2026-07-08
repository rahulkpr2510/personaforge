import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import { getRequestId, apiSuccess, apiFailure } from "@/lib/api/response";
import { ApiErrors } from "@/lib/api/errors";

const Schema = z.object({
	analysisId: z.string().cuid(),
	error: z.string().max(500),
	events: z.array(z.unknown()).optional(),
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

	const { analysisId, error } = parsed.data;

	// Sanitise — strip control characters and limit length, but preserve the message
	const sanitizedError = error
		.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // strip control chars
		.trim()
		.slice(0, 400) || "Crawl failed (no reason provided)";

	await db.analysis
		.updateMany({
			where: {
				id: analysisId,
				status: { in: ["PENDING", "CRAWLING"] },
			},
			data: {
				status: "FAILED",
				error: sanitizedError,
			},
		})
		.catch((err) =>
			console.error("[crawl-failed] DB update failed:", (err as Error).message),
		);

	return apiSuccess(requestId, { received: true });
}
