// lib/crawl-log-messages.ts

export interface CrawlEvent {
	type: string;
	message: string;
	data?: Record<string, unknown>;
	timestamp: string;
}

/**
 * Converts a raw backend crawl event into a polished, human-friendly string.
 * Falls back to a generic message if the event type is unrecognized.
 */
export function toFriendlyLogMessage(event: CrawlEvent): string {
	const data = event.data ?? {};

	switch (event.type) {
		case "job_started":
			return "🔍 Setting up your analysis environment...";

		case "auth_form_detected":
			return "🔐 Detected a login screen — attempting to sign in...";

		case "auth_attempted":
			return "🔑 Trying to access the full product experience...";

		case "auth_succeeded":
			return "✓ Signed in successfully — exploring the real product now.";

		case "auth_failed":
			return "⚠️ Couldn't sign in automatically — continuing with what's visible.";

		case "page_visited": {
			const pageType =
				typeof data.pageType === "string" ? data.pageType.toLowerCase() : null;
			const count =
				typeof data.pagesCollected === "number" ? data.pagesCollected : null;
			if (pageType && count) {
				return `📄 Explored a ${pageType} page (${count} page${count > 1 ? "s" : ""} so far)...`;
			}
			return "📄 Explored another page of your product...";
		}

		case "page_enqueued":
			return "🔗 Found more pages to explore...";

		case "page_skipped":
			return "⏭️ Skipped a page that couldn't be loaded...";

		case "crawl_completed":
			return "✅ Finished exploring your product structure.";

		case "crawl_completed_partial":
			return "✅ Finished exploring — some areas were only partially accessible.";

		case "crawl_failed":
			return "❌ Ran into an issue while exploring your product.";

		default:
			return event.message || "Working on your analysis...";
	}
}

/**
 * Default fallback messages shown before any real crawler events exist yet,
 * or during the ANALYZING phase where events come from the AI pipeline instead.
 */
export const FALLBACK_LOG_MESSAGES: Record<string, string[]> = {
	PENDING: [
		"🔍 Setting up your analysis environment...",
		"📋 Loading persona profiles...",
		"⚙️  Configuring analysis parameters...",
	],
	CRAWLING: [
		"✓ Started exploring your product.",
		"🌐 Navigating through pages and user flows...",
		"📸 Capturing screenshots for visual analysis...",
	],
	ANALYZING: [
		"🧠 Personas are reviewing your product...",
		"Inspecting visual hierarchy and interface consistency...",
		"🎯 Evaluating accessibility and contrast ratios...",
		"💬 Generating persona-specific insights...",
		"🔄 Cross-referencing findings across personas...",
		"📝 Preparing the focus group discussion...",
	],
};
