import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CreateAnalysisSchema } from "@/lib/validation/schemas";
import { Limits } from "@/lib/rate-limit";
import { getRequestId, apiSuccess, apiFailure } from "@/lib/api/response";
import { ApiErrors, classifyError } from "@/lib/api/errors";

export async function GET(req: Request) {
	const requestId = getRequestId(req);
	try {
		const user = await requireAuth();
		const analyses = await db.analysis.findMany({
			where: { userId: user.id },
			orderBy: { createdAt: "desc" },
			include: {
				_count: { select: { pages: true, personas: true } },
				focusGroup: { select: { id: true } },
			},
		});
		return apiSuccess(requestId, { analyses });
	} catch (err) {
		const detail = classifyError(err);
		const status = detail.code === "UNAUTHORIZED" ? 401 : 500;
		return apiFailure(requestId, detail, status);
	}
}

export async function POST(req: Request) {
	const requestId = getRequestId(req);
	try {
		const user = await requireAuth();

		const rl = Limits.createAnalysis(user.id);
		if (!rl.allowed) {
			return apiFailure(
				requestId,
				ApiErrors.rateLimitExceeded(rl.resetAt - Date.now()),
				429,
			);
		}

		const raw = await req.json().catch(() => null);
		if (!raw) {
			return apiFailure(requestId, ApiErrors.invalidJson(), 400);
		}

		const parsed = CreateAnalysisSchema.safeParse(raw);
		if (!parsed.success) {
			return apiFailure(
				requestId,
				ApiErrors.validationFailed(parsed.error.flatten().fieldErrors as Record<string, string[]>),
				400,
			);
		}

		const { url, personaIds, customPersonas, deviceType } = parsed.data;

		let normalizedHost: string;
		try {
			normalizedHost = new URL(url).hostname;
		} catch {
			return apiFailure(requestId, ApiErrors.invalidUrl(), 400);
		}

		const analysis = await db.analysis.create({
			data: {
				userId: user.id,
				url,
				normalizedHost,
				deviceType,
				status: "PENDING",
				analysisInput: { personaIds, customPersonas, deviceType },
			},
		});

		// Fire-and-forget to crawler service — do NOT await
		triggerCrawler(analysis.id, url, deviceType).catch((err) => {
			console.error(`[analyses] Crawler trigger failed for ${analysis.id}:`, err);
			db.analysis
				.update({
					where: { id: analysis.id },
					data: {
						status: "FAILED",
						error: `Failed to trigger crawler: ${err instanceof Error ? err.message.slice(0, 200) : "Unknown error"}`,
					},
				})
				.catch(console.error);
		});

		return apiSuccess(
			requestId,
			{ analysisId: analysis.id, status: "PENDING" as const },
			undefined,
			201,
		);
	} catch (err) {
		console.error("[POST /api/analyses]:", err);
		const detail = classifyError(err);
		const status = detail.code === "UNAUTHORIZED" ? 401 : 500;
		return apiFailure(requestId, detail, status);
	}
}

async function triggerCrawler(
	analysisId: string,
	url: string,
	deviceType: "DESKTOP" | "MOBILE",
) {
	const crawlerUrl = process.env.CRAWLER_SERVICE_URL;
	if (!crawlerUrl) throw new Error("CRAWLER_SERVICE_URL is not set");

	const internalApiKey = process.env.CRAWLER_INTERNAL_API_KEY;
	if (!internalApiKey) throw new Error("CRAWLER_INTERNAL_API_KEY is not set");

	const callbackBaseUrl = process.env.NEXT_PUBLIC_APP_URL;
	if (!callbackBaseUrl) throw new Error("NEXT_PUBLIC_APP_URL is not set");

	const payload = {
		analysisId,
		url,
		deviceType,
		maxDepth: 2,
		maxPages: 8,
		callbackBaseUrl,
		internalApiKey,
	};

	console.log(`[analyses] Triggering crawler for ${analysisId}:`, {
		crawlerUrl,
		payload: { ...payload, internalApiKey: "[REDACTED]" },
	});

	const res = await fetch(`${crawlerUrl}/crawl`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"x-internal-api-key": internalApiKey,
		},
		body: JSON.stringify(payload),
	});

	if (!res.ok) {
		const body = await res.text();
		throw new Error(`Crawler responded ${res.status}: ${body}`);
	}
}
