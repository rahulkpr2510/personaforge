// app/api/personas/[id]/route.ts
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Limits } from "@/lib/rate-limit";
import { getRequestId, apiSuccess, apiFailure } from "@/lib/api/response";
import { ApiErrors, classifyError } from "@/lib/api/errors";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(req: Request, { params }: Params) {
	const requestId = getRequestId(req);
	try {
		const user = await requireAuth();

		const rl = Limits.personaCrud(user.id);
		if (!rl.allowed) {
			return apiFailure(
				requestId,
				ApiErrors.rateLimitExceeded(rl.resetAt - Date.now()),
				429,
			);
		}

		const { id } = await params;

		const persona = await db.persona.findFirst({
			where: { id, ownerId: user.id, isPrebuilt: false },
			select: { id: true },
		});

		if (!persona) {
			return apiFailure(requestId, ApiErrors.personaNotFound(), 404);
		}

		await db.persona.delete({ where: { id } });
		return apiSuccess(requestId, { deleted: true });
	} catch (err) {
		const detail = classifyError(err);
		const status = detail.code === "UNAUTHORIZED" ? 401 : 500;
		return apiFailure(requestId, detail, status);
	}
}

export async function PATCH(req: Request, { params }: Params) {
	const requestId = getRequestId(req);
	try {
		const user = await requireAuth();

		const rl = Limits.personaCrud(user.id);
		if (!rl.allowed) {
			return apiFailure(
				requestId,
				ApiErrors.rateLimitExceeded(rl.resetAt - Date.now()),
				429,
			);
		}

		const { id } = await params;

		const persona = await db.persona.findFirst({
			where: { id, ownerId: user.id, isPrebuilt: false },
			select: { id: true },
		});

		if (!persona) {
			return apiFailure(requestId, ApiErrors.personaNotFound(), 404);
		}

		const raw = await req.json().catch(() => null);
		if (!raw) {
			return apiFailure(requestId, ApiErrors.invalidJson(), 400);
		}

		const { name, age, occupation, technicalLevel, goals, frustrations, tags } = raw;

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

		return apiSuccess(requestId, { persona: updated });
	} catch (err) {
		const detail = classifyError(err);
		const status = detail.code === "UNAUTHORIZED" ? 401 : 500;
		return apiFailure(requestId, detail, status);
	}
}
