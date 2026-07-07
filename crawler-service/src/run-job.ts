// crawler/src/run-job.ts
import {
	runCrawlJob,
	type CrawlEvent,
	type CrawlJobInput,
	type CrawledPageResult,
} from "./index.js";

interface CallbackPagePayload {
	url: string;
	path: string | null;
	title: string | null;
	depth: number;
	content: string | null;
	formsCount: number;
	buttonsCount: number;
	linksCount: number;
	textLength: number;
	hasAuthForm: boolean;
	primaryActionLabel: string | null;
	performance: Record<string, number> | null;
	accessibility: Record<string, unknown> | null;
	navStructure: Record<string, unknown> | null;
	pageType: string;
	screenshotBase64: string | null;
}

export async function executeCrawlJob(job: CrawlJobInput): Promise<void> {
	const events: CrawlEvent[] = [];

	const outcome = await runCrawlJob(job, (event: CrawlEvent) => {
		events.push(event);
		void postEvent(job, event);
	});

	if (outcome.status === "FAILED") {
		await postFailure(job, outcome.reason ?? "unknown_error", events);
		return;
	}

	const pages: CallbackPagePayload[] = outcome.pages.map(
		(p: CrawledPageResult) => ({
			url: p.url,
			path: p.path,
			title: p.title,
			depth: p.depth,
			content: p.content,
			formsCount: p.formsCount,
			buttonsCount: p.buttonsCount,
			linksCount: p.linksCount,
			textLength: p.textLength,
			hasAuthForm: p.hasAuthForm,
			primaryActionLabel: p.primaryActionLabel,
			performance: p.performance,
			accessibility: p.accessibility as unknown as Record<
				string,
				unknown
			> | null,
			navStructure: p.navStructure as unknown as Record<string, unknown> | null,
			pageType: p.pageType,
			screenshotBase64: p.screenshotBuffer
				? p.screenshotBuffer.toString("base64")
				: null,
		}),
	);

	await postSuccess(job, pages, outcome.partial, outcome.reason, events);
}

async function postEvent(job: CrawlJobInput, event: CrawlEvent) {
	try {
		await fetch(`${job.callbackBaseUrl}/api/internal/crawl-event`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-internal-api-key": job.internalApiKey,
			},
			body: JSON.stringify({
				analysisId: job.analysisId,
				event,
			}),
		});
	} catch {
		// do not block the crawl
	}
}

async function postSuccess(
	job: CrawlJobInput,
	pages: CallbackPagePayload[],
	partial: boolean,
	reason: string | undefined,
	events: CrawlEvent[],
) {
	await fetch(`${job.callbackBaseUrl}/api/internal/crawl-complete`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"x-internal-api-key": job.internalApiKey,
		},
		body: JSON.stringify({
			analysisId: job.analysisId,
			pages,
			meta: {
				partial,
				partialReason: reason ?? null,
			},
			events,
		}),
	});
}

async function postFailure(
	job: CrawlJobInput,
	reason: string,
	events: CrawlEvent[],
) {
	await fetch(`${job.callbackBaseUrl}/api/internal/crawl-failed`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"x-internal-api-key": job.internalApiKey,
		},
		body: JSON.stringify({
			analysisId: job.analysisId,
			error: reason,
			events,
		}),
	});
}
