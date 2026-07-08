
import type { VisionAnalysis } from "../types";

export interface PageEvidence {
	url: string;
	title: string | null;
	pageType: string;
	buttonsCount: number;
	formsCount: number;
	linksCount: number;
	wordCount: number;
	interactionCount: number;
	frictionScore: number;
	hasH1: boolean;
	primaryActionLabel: string | null;
	ctaTexts: string[];
	headingStructure: string[];
}

export interface WebsiteIntelligence {
	url: string;
	hostname: string;
	deviceType: string;

	pageCount: number;
	maxDepth: number;
	pageTypes: string[];
	navLabels: string[];
	uniqueCtaLabels: string[];
	primaryActionLabels: string[];

	totalWords: number;
	avgWordCount: number;
	contentSample: string;

	totalButtons: number;
	totalForms: number;
	totalLinks: number;
	totalInputs: number;
	totalInteractions: number;

	totalImagesWithoutAlt: number;
	totalImages: number;
	totalInputsWithoutLabel: number;
	totalButtonsWithoutLabel: number;
	pagesWithH1: number;
	pagesWithoutH1: number;
	avgLandmarkCount: number;

	avgTtfbMs: number | null;
	avgLoadMs: number | null;
	slowPages: string[];

	hasPricingPage: boolean;
	hasContactPage: boolean;
	hasDocsPage: boolean;

	visionSummaries: string[];
	pageEvidence: PageEvidence[];

	crawlCoverage: {
		pagesCrawled: number;
		pagesDiscovered: number;
		coverageConfidence: "High" | "Medium" | "Low";
		coveragePercent: number;
		coverageNote: string;
	};
}

export interface RawPageInput {
	url: string;
	title: string | null;
	pageType: string;
	depth: number;
	buttonsCount: number;
	formsCount: number;
	linksCount: number;
	inputCount: number;
	wordCount: number;
	interactionCount: number;
	hasH1?: boolean;
	primaryActionLabel: string | null;
	ctaTexts: string[];
	headingStructure: string[];
	accessibility: {
		imagesWithoutAlt?: number;
		totalImages?: number;
		inputsWithoutLabel?: number;
		buttonsWithoutLabel?: number;
		headingCount?: number;
		hasH1?: boolean;
		landmarkCount?: number;
	} | null;
	performance: { ttfbMs?: number; loadEventMs?: number } | null;
	navStructure: { navLabels?: string[] } | null;
	frictionScore: number;
	visionMeta: VisionAnalysis | null;
	content: string | null;
}

/**
 * Picks the best representative content sample from the crawled pages.
 * Priority order:
 *   1. A page explicitly typed as HOMEPAGE or HOME
 *   2. The highest word-count page that is NOT a login/auth page
 *   3. Fallback to pages[0]
 * This prevents sending a login wall or redirect page as the LLM's "first impression".
 */
function pickContentSample(pages: RawPageInput[]): string {
	const HOME_TYPES = new Set(["HOMEPAGE", "HOME"]);
	const LOGIN_TYPES = new Set(["LOGIN", "AUTH", "SIGNUP", "REGISTER"]);

	// 1. Prefer a homepage
	const homePage = pages.find((p) => HOME_TYPES.has(p.pageType.toUpperCase()));
	if (homePage?.content) return homePage.content.slice(0, 1500);

	// 2. Highest-wordcount non-login page
	const nonAuth = pages.filter((p) => !LOGIN_TYPES.has(p.pageType.toUpperCase()));
	if (nonAuth.length > 0) {
		const best = nonAuth.reduce((b, p) => ((p.wordCount ?? 0) > (b.wordCount ?? 0) ? p : b));
		if (best?.content) return best.content.slice(0, 1500);
	}

	// 3. Fallback
	return pages[0]?.content?.slice(0, 1500) ?? "";
}

/**
 * Builds the single WebsiteIntelligence object from all crawled pages.
 * Called once per analysis — result shared with all personas and focus group.
 */
export function buildWebsiteIntelligence(
	url: string,
	deviceType: string,
	pages: RawPageInput[],
): WebsiteIntelligence {
	const hostname = (() => {
		try {
			return new URL(url).hostname;
		} catch {
			return url;
		}
	})();

	// Accessibility aggregates
	const totalImagesWithoutAlt = pages.reduce(
		(s, p) => s + (p.accessibility?.imagesWithoutAlt ?? 0),
		0,
	);
	const totalImages = pages.reduce(
		(s, p) => s + (p.accessibility?.totalImages ?? 0),
		0,
	);
	const totalInputsWithoutLabel = pages.reduce(
		(s, p) => s + (p.accessibility?.inputsWithoutLabel ?? 0),
		0,
	);
	const totalButtonsWithoutLabel = pages.reduce(
		(s, p) => s + (p.accessibility?.buttonsWithoutLabel ?? 0),
		0,
	);
	const pagesWithH1 = pages.filter(
		(p) => p.accessibility?.hasH1 === true,
	).length;
	const avgLandmarkCount =
		pages.length > 0
			? pages.reduce((s, p) => s + (p.accessibility?.landmarkCount ?? 0), 0) /
				pages.length
			: 0;

	// Performance aggregates
	const perfPages = pages.map((p) => p.performance).filter(Boolean) as {
		ttfbMs?: number;
		loadEventMs?: number;
	}[];
	const avgTtfbMs =
		perfPages.length > 0
			? Math.round(
					perfPages.reduce((s, p) => s + (p.ttfbMs ?? 0), 0) / perfPages.length,
				)
			: null;
	const avgLoadMs =
		perfPages.length > 0
			? Math.round(
					perfPages.reduce((s, p) => s + (p.loadEventMs ?? 0), 0) /
						perfPages.length,
				)
			: null;
	const slowPages = pages
		.filter((p) => (p.performance?.loadEventMs ?? 0) > 3000)
		.map((p) => p.url);

	// Navigation
	const allNavLabels = pages.flatMap((p) => p.navStructure?.navLabels ?? []);
	const navLabels = [...new Set(allNavLabels)].slice(0, 20);
	const uniqueCtaLabels = [
		...new Set(pages.flatMap((p) => p.ctaTexts ?? [])),
	].slice(0, 20);
	const primaryActionLabels = pages
		.map((p) => p.primaryActionLabel)
		.filter((l): l is string => Boolean(l));

	// Trust signals
	const allUrls = pages.map((p) => p.url.toLowerCase());
	const hasPricingPage = allUrls.some(
		(u) => u.includes("pric") || u.includes("plan"),
	);
	const hasContactPage = allUrls.some(
		(u) => u.includes("contact") || u.includes("support") || u.includes("help"),
	);
	const hasDocsPage = allUrls.some(
		(u) => u.includes("doc") || u.includes("api") || u.includes("developer"),
	);

	// Vision summaries (already analyzed; just compile text)
	const visionSummaries = pages
		.map((p) => {
			const vm = p.visionMeta;
			if (!vm) return null;
			return [
				`Page: ${p.title ?? p.url}`,
				`Purpose: ${vm.primaryPurpose}`,
				`UI: ${vm.uiStructure}`,
				`Complexity: visual=${vm.visualComplexity}, forms=${vm.formComplexity}`,
				`Navigation: ${vm.navigationPatterns}`,
				vm.accessibilityObservations?.length > 0
					? `A11y notes: ${vm.accessibilityObservations.slice(0, 2).join("; ")}`
					: "",
			]
				.filter(Boolean)
				.join("\n");
		})
		.filter((s): s is string => s !== null);

	// Per-page evidence (structured JSON for prompts — never raw HTML)
	const pageEvidence: PageEvidence[] = pages.map((p) => ({
		url: p.url,
		title: p.title,
		pageType: p.pageType,
		buttonsCount: p.buttonsCount,
		formsCount: p.formsCount,
		linksCount: p.linksCount,
		wordCount: p.wordCount,
		interactionCount: p.interactionCount,
		frictionScore: p.frictionScore,
		hasH1: p.accessibility?.hasH1 ?? false,
		primaryActionLabel: p.primaryActionLabel,
		ctaTexts: p.ctaTexts ?? [],
		headingStructure: p.headingStructure ?? [],
	}));

	const totalWords = pages.reduce((s, p) => s + (p.wordCount ?? 0), 0);
	const avgWordCount =
		pages.length > 0 ? Math.round(totalWords / pages.length) : 0;

	// Coverage
	const estimatedTotal = Math.max(
		pages.length,
		pages.reduce((s, p) => s + Math.min(p.linksCount, 50), 0),
	);
	const coveragePercent = Math.min(
		100,
		Math.round((pages.length / Math.max(estimatedTotal, 1)) * 100),
	);
	const coverageConfidence: "High" | "Medium" | "Low" =
		pages.length >= 10 ? "High" : pages.length >= 4 ? "Medium" : "Low";

	return {
		url,
		hostname,
		deviceType,
		pageCount: pages.length,
		// Use reduce instead of spread into Math.max to avoid call-stack overflow
		// on very large page arrays (spread is limited by JS engine argument limits).
		maxDepth: pages.reduce((m, p) => (p.depth > m ? p.depth : m), 0),
		pageTypes: [...new Set(pages.map((p) => p.pageType))],
		navLabels,
		uniqueCtaLabels,
		primaryActionLabels,
		totalWords,
		avgWordCount,
		contentSample: pickContentSample(pages),
		totalButtons: pages.reduce((s, p) => s + p.buttonsCount, 0),
		totalForms: pages.reduce((s, p) => s + p.formsCount, 0),
		totalLinks: pages.reduce((s, p) => s + p.linksCount, 0),
		totalInputs: pages.reduce((s, p) => s + (p.inputCount ?? 0), 0),
		totalInteractions: pages.reduce((s, p) => s + (p.interactionCount ?? 0), 0),
		totalImagesWithoutAlt,
		totalImages,
		totalInputsWithoutLabel,
		totalButtonsWithoutLabel,
		pagesWithH1,
		pagesWithoutH1: pages.length - pagesWithH1,
		avgLandmarkCount,
		avgTtfbMs,
		avgLoadMs,
		slowPages,
		hasPricingPage,
		hasContactPage,
		hasDocsPage,
		visionSummaries,
		pageEvidence,
		crawlCoverage: {
			pagesCrawled: pages.length,
			pagesDiscovered: estimatedTotal,
			coverageConfidence,
			coveragePercent,
			coverageNote:
				pages.length === 1
					? `1 page analyzed. Recommendations may change after additional crawling.`
					: `${pages.length} pages analyzed (~${coveragePercent}% estimated coverage).`,
		},
	};
}

/**
 * Converts WebsiteIntelligence into the SiteContext shape expected by persona prompts.
 * This is the ONLY bridge between intelligence and prompts — keeps SiteContext stable.
 */
export function intelligenceToSiteContext(
	wi: WebsiteIntelligence,
): Record<string, unknown> {
	return {
		url: wi.url,
		hostname: wi.hostname,
		pageCount: wi.pageCount,
		deviceType: wi.deviceType,
		totalButtons: wi.totalButtons,
		totalForms: wi.totalForms,
		totalLinks: wi.totalLinks,
		totalInputs: wi.totalInputs,
		totalWords: wi.totalWords,
		avgWordCount: wi.avgWordCount,
		maxDepth: wi.maxDepth,
		totalInteractions: wi.totalInteractions,
		totalImagesWithoutAlt: wi.totalImagesWithoutAlt,
		totalImages: wi.totalImages,
		totalInputsWithoutLabel: wi.totalInputsWithoutLabel,
		pagesWithH1: wi.pagesWithH1,
		pagesWithoutH1: wi.pagesWithoutH1,
		totalButtonsWithoutLabel: wi.totalButtonsWithoutLabel,
		avgLandmarkCount: wi.avgLandmarkCount,
		avgTtfbMs: wi.avgTtfbMs,
		avgLoadMs: wi.avgLoadMs,
		slowPages: wi.slowPages,
		navLabels: wi.navLabels,
		uniqueCtaLabels: wi.uniqueCtaLabels,
		primaryActionLabels: wi.primaryActionLabels,
		pageTypes: wi.pageTypes,
		hasPricingPage: wi.hasPricingPage,
		hasContactPage: wi.hasContactPage,
		hasDocsPage: wi.hasDocsPage,
		pageEvidence: wi.pageEvidence,
		visionSummaries: wi.visionSummaries,
		contentSample: wi.contentSample,
		crawlCoverage: wi.crawlCoverage,
	};
}
