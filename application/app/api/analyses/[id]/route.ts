import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getRequestId, apiSuccess, apiFailure } from "@/lib/api/response";
import { ApiErrors, classifyError } from "@/lib/api/errors";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
	const requestId = getRequestId(req);
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
			return apiFailure(requestId, ApiErrors.analysisNotFound(), 404);
		}

		return apiSuccess(requestId, { analysis });
	} catch (err) {
		const detail = classifyError(err);
		const status = detail.code === "UNAUTHORIZED" ? 401 : 500;
		console.error("[GET /api/analyses/[id]]:", err);
		return apiFailure(requestId, detail, status);
	}
}

export async function PATCH(req: Request, { params }: Params) {
	const requestId = getRequestId(req);
	try {
		const user = await requireAuth();
		const { id } = await params;

		const analysis = await db.analysis.findFirst({
			where: { id, userId: user.id },
			select: { id: true, status: true },
		});

		if (!analysis) {
			return apiFailure(requestId, ApiErrors.analysisNotFound(), 404);
		}

		const cancellableStatuses = ["PENDING", "CRAWLING", "ANALYZING"];
		if (!cancellableStatuses.includes(analysis.status)) {
			return apiFailure(
				requestId,
				ApiErrors.cannotCancel(analysis.status),
				409,
			);
		}

		await db.analysis.update({
			where: { id },
			data: { status: "FAILED", error: "Cancelled by user" },
		});

		return apiSuccess(requestId, { cancelled: true });
	} catch (err) {
		const detail = classifyError(err);
		const status = detail.code === "UNAUTHORIZED" ? 401 : 500;
		console.error("[PATCH /api/analyses/[id]]:", err);
		return apiFailure(requestId, detail, status);
	}
}

export async function DELETE(req: Request, { params }: Params) {
	const requestId = getRequestId(req);
	try {
		const user = await requireAuth();
		const { id } = await params;

		const analysis = await db.analysis.findFirst({
			where: { id, userId: user.id },
			select: { id: true, status: true },
		});

		if (!analysis) {
			return apiFailure(requestId, ApiErrors.analysisNotFound(), 404);
		}

		if (["CRAWLING", "ANALYZING"].includes(analysis.status)) {
			return apiFailure(requestId, ApiErrors.cannotDeleteRunning(), 409);
		}

		await db.analysis.delete({ where: { id } });
		return apiSuccess(requestId, { deleted: true });
	} catch (err) {
		const detail = classifyError(err);
		const status = detail.code === "UNAUTHORIZED" ? 401 : 500;
		console.error("[DELETE /api/analyses/[id]]:", err);
		return apiFailure(requestId, detail, status);
	}
}
