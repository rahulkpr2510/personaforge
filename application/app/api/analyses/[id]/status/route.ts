// app/api/analyses/[id]/status/route.ts
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getRequestId, apiSuccess, apiFailure, NO_CACHE_HEADERS } from "@/lib/api/response";
import { ApiErrors, classifyError } from "@/lib/api/errors";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
	const requestId = getRequestId(req);
	try {
		const user = await requireAuth();
		const { id } = await params;

		const analysis = await db.analysis.findFirst({
			where: { id, userId: user.id },
			select: {
				id: true,
				status: true,
				error: true,
				startedAt: true,
				completedAt: true,
				overallSentiment: true,
				overallFrictionScore: true,
				meta: true,
				_count: { select: { pages: true, personas: true } },
				personas: { orderBy: { createdAt: "asc" } },
				focusGroup: true,
			},
		});

		if (!analysis) {
			return apiFailure(requestId, ApiErrors.analysisNotFound(), 404, NO_CACHE_HEADERS);
		}

		// Extract crawlerEvents and crawlMeta from the meta JSON column
		const meta = (analysis.meta as Record<string, unknown> | null) ?? {};
		const crawlerEvents = Array.isArray(meta.crawlerEvents) ? meta.crawlerEvents : [];
		const crawlMeta = (meta.crawlMeta as {
			partial?: boolean;
			partialReason?: string | null;
		} | null) ?? null;

		return apiSuccess(
			requestId,
			{
				...analysis,
				crawlerEvents,
				crawlMeta,
			},
			undefined,
			200,
			NO_CACHE_HEADERS,
		);
	} catch (err) {
		const detail = classifyError(err);
		const status = detail.code === "UNAUTHORIZED" ? 401 : 500;
		return apiFailure(requestId, detail, status, NO_CACHE_HEADERS);
	}
}
