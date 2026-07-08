import { NextResponse } from "next/server";

export function getRequestId(req: Request): string {
	return req.headers.get("x-request-id") ?? crypto.randomUUID();
}

export const NO_CACHE_HEADERS: Record<string, string> = {
	"Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
	Pragma: "no-cache",
	Expires: "0",
};

export function apiSuccess<T>(
	requestId: string,
	data: T,
	_unused?: any,
	status = 200,
	headers?: Record<string, string>,
): NextResponse {
	return NextResponse.json(
		{ success: true, requestId, data },
		{ status, headers },
	);
}

export function apiFailure(
	requestId: string,
	error: {
		code: string;
		message: string;
		technicalReason: string;
		fieldErrors?: Record<string, string[]>;
	},
	status: number,
	headers?: Record<string, string>,
): NextResponse {
	return NextResponse.json(
		{ success: false, requestId, error },
		{ status, headers },
	);
}
