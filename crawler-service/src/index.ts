// crawler/src/index.ts
/// <reference lib="dom" />
import {
	chromium,
	type Browser,
	type BrowserContext,
	type Page as PWPage,
	type Response,
} from "playwright";
import { setTimeout as delay } from "timers/promises";

export type DeviceType = "DESKTOP" | "MOBILE";

export interface CrawlJobInput {
	analysisId: string;
	url: string;
	deviceType: DeviceType;
	maxDepth: number;
	maxPages: number;
	credentials?: { username: string; password: string };
	callbackBaseUrl: string;
	internalApiKey: string;
}

export type PageType =
	| "LOGIN"
	| "LISTING"
	| "DETAIL"
	| "CHECKOUT"
	| "DOCS"
	| "MARKETING"
	| "SETTINGS"
	| "UNKNOWN";

export interface CrawledPageResult {
	url: string;
	path: string | null;
	title: string | null;
	depth: number;
	content: string | null;
	formsCount: number;
	buttonsCount: number;
	linksCount: number;
	inputCount: number;
	textLength: number;
	wordCount: number;
	interactionCount: number; // buttons + links
	hasAuthForm: boolean;
	primaryActionLabel: string | null;
	ctaTexts: string[]; // Top CTA button labels
	headingStructure: string[]; // h1-h3 text content
	performance: Record<string, number> | null;
	accessibility: AccessibilitySummary | null;
	navStructure: NavStructure | null;
	pageType: PageType;
	screenshotBuffer: Buffer | null;
}

export interface AccessibilitySummary {
	imagesWithoutAlt: number;
	totalImages: number;
	buttonsWithoutLabel: number;
	inputsWithoutLabel: number;
	headingCount: number;
	hasH1: boolean;
	landmarkCount: number;
	// Extended accessibility checks
	hasSkipLink: boolean;
	hasLangAttribute: boolean;
	hasFocusStyles: boolean;     // detects :focus pseudo-class in stylesheets
	ariaLabelCount: number;       // count of aria-label attributes
	hasMainLandmark: boolean;
	tabIndexAbuse: number;        // count of tabindex > 0 (bad pattern)
	hasReducedMotionQuery: boolean; // detects @media (prefers-reduced-motion)
}

export interface NavStructure {
	navLabels: string[];
	ctaLabels: string[];
}

export interface CrawlerStats {
	totalPages: number;
	totalForms: number;
	totalButtons: number;
	totalImages: number;
	totalLinks: number;
	totalInputs: number;
	totalHeadings: number;
	totalWords: number;
	avgWordCount: number;
	avgDomDepth: number;
	largestPageUrl: string | null;
	largestPageWords: number;
	fastestPageUrl: string | null;
	fastestPageMs: number | null;
	slowestPageUrl: string | null;
	slowestPageMs: number | null;
	skippedUrls: string[];
	blockedUrls: string[];
	redirectCount: number;
	brokenLinkCount: number;
	avgTtfbMs: number | null;
	avgLoadMs: number | null;
	// Coverage tracking
	pagesDiscovered: number;
	pagesCrawled: number;
	pagesSkipped: number;
	pagesBlocked: number;
}

export interface CrawlEvent {
	type:
		| "job_started"
		| "auth_form_detected"
		| "auth_attempted"
		| "auth_succeeded"
		| "auth_failed"
		| "page_visited"
		| "page_enqueued"
		| "page_skipped"
		| "crawl_completed"
		| "crawl_completed_partial"
		| "crawl_failed";
	message: string;
	data?: Record<string, unknown>;
	timestamp: string;
}

export interface CrawlOutcome {
	status: "COMPLETED" | "FAILED";
	partial: boolean;
	reason?: string;
	pages: CrawledPageResult[];
	events: CrawlEvent[];
	crawlerStats?: CrawlerStats;
}

const NAV_TIMEOUT_MS = 25_000;
const ACTION_TIMEOUT_MS = 10_000;
const CONTENT_SETTLE_MS = 800;
const MAX_RETRIES_PER_PAGE = 2;
const HARD_JOB_TIMEOUT_MS = 6 * 60 * 1000;

const BLOCKED_URL_PATTERNS: RegExp[] = [
	/^mailto:/i,
	/^tel:/i,
	/^javascript:/i,
	/^#/,
	/\/logout(\/|$)/i,
	/\/sign[-_]?out(\/|$)/i,
	/\.(png|jpe?g|gif|svg|webp|ico|css|js|woff2?|ttf|pdf|zip|mp4|mp3)(\?|$)/i,
];

const AUTH_FIELD_SELECTORS = {
	username: [
		'input[type="email"]',
		'input[name*="user" i]',
		'input[name*="email" i]',
		'input[id*="user" i]',
		'input[id*="email" i]',
		'[data-test*="username" i]',
	],
	password: ['input[type="password"]', '[data-test*="password" i]'],
	submit: [
		'button[type="submit"]',
		'input[type="submit"]',
		'[data-test*="login" i]',
		'button:has-text("Log in")',
		'button:has-text("Sign in")',
		'button:has-text("Login")',
	],
};

const SITE_AUTH_ADAPTERS: Record<
	string,
	{
		username: string;
		password: string;
		usernameSelector: string;
		passwordSelector: string;
		submitSelector: string;
		successUrlIncludes: string;
	}
> = {
	"www.saucedemo.com": {
		username: "standard_user",
		password: "secret_sauce",
		usernameSelector: '[data-test="username"]',
		passwordSelector: '[data-test="password"]',
		submitSelector: '[data-test="login-button"]',
		successUrlIncludes: "/inventory",
	},
};

class EventBus {
	private events: CrawlEvent[] = [];
	private onEmit?: (event: CrawlEvent) => void;

	constructor(onEmit?: (event: CrawlEvent) => void) {
		this.onEmit = onEmit;
	}

	emit(
		type: CrawlEvent["type"],
		message: string,
		data?: Record<string, unknown>,
	) {
		const event: CrawlEvent = {
			type,
			message,
			data,
			timestamp: new Date().toISOString(),
		};
		this.events.push(event);
		this.onEmit?.(event);
	}

	all() {
		return this.events;
	}
}

class UrlPolicy {
	private origin: string;
	private visited = new Set<string>();

	constructor(entryUrl: string) {
		this.origin = new URL(entryUrl).origin;
	}

	normalize(rawUrl: string, baseUrl: string): string | null {
		try {
			const u = new URL(rawUrl, baseUrl);
			u.hash = "";
			u.hostname = u.hostname.toLowerCase();
			if (u.port === "80" || u.port === "443") {
				u.port = "";
			}
			if (u.pathname.length > 1 && u.pathname.endsWith("/")) {
				u.pathname = u.pathname.slice(0, -1);
			}
			// ensure trailing slash is stripped from root if somehow present, although URL usually makes it '/'
			let finalUrl = u.toString();
			if (finalUrl.endsWith("/") && finalUrl.length > u.origin.length) {
			    finalUrl = finalUrl.slice(0, -1);
			}
			return finalUrl;
		} catch {
			return null;
		}
	}

	isAllowed(url: string): boolean {
		if (BLOCKED_URL_PATTERNS.some((re) => re.test(url))) return false;
		try {
			const u = new URL(url);
			if (u.origin !== this.origin) return false;
		} catch {
			return false;
		}
		return true;
	}

	markVisited(url: string) {
		this.visited.add(url);
	}

	isVisited(url: string) {
		return this.visited.has(url);
	}
}

interface QueueItem {
	url: string;
	depth: number;
	priority: number;
	source: "seed" | "post_auth" | "nav" | "cta" | "content";
}

class CrawlQueue {
	private items: QueueItem[] = [];

	push(item: QueueItem) {
		this.items.push(item);
		this.items.sort((a, b) => a.priority - b.priority || a.depth - b.depth);
	}

	pop() {
		return this.items.shift();
	}

	get size() {
		return this.items.length;
	}
}

function priorityForSource(source: QueueItem["source"]): number {
	switch (source) {
		case "seed":
		case "post_auth":
			return 0;
		case "nav":
			return 1;
		case "cta":
			return 2;
		case "content":
			return 3;
	}
}

async function detectAuthForm(page: PWPage): Promise<boolean> {
	for (const sel of AUTH_FIELD_SELECTORS.password) {
		const el = await page.$(sel).catch(() => null);
		if (el) return true;
	}
	return false;
}

async function extractVisibleDemoCredentials(
	page: PWPage,
): Promise<{ username: string; password: string } | null> {
	const bodyText = await page
		.evaluate(() => document.body.innerText)
		.catch(() => "");
	if (!bodyText) return null;

	const usernameMatch = bodyText.match(/\b[a-z0-9_]{4,20}_user\b/i);
	const passwordMatch = bodyText.match(/\bsecret_[a-z]+\b/i);

	if (usernameMatch && passwordMatch) {
		return { username: usernameMatch[0], password: passwordMatch[0] };
	}
	return null;
}

async function resolveGenericAuthSelectors(page: PWPage): Promise<{
	usernameSelector: string;
	passwordSelector: string;
	submitSelector: string;
} | null> {
	let usernameSelector: string | null = null;
	let passwordSelector: string | null = null;
	let submitSelector: string | null = null;

	for (const sel of AUTH_FIELD_SELECTORS.username) {
		if (await page.$(sel).catch(() => null)) {
			usernameSelector = sel;
			break;
		}
	}
	for (const sel of AUTH_FIELD_SELECTORS.password) {
		if (await page.$(sel).catch(() => null)) {
			passwordSelector = sel;
			break;
		}
	}
	for (const sel of AUTH_FIELD_SELECTORS.submit) {
		if (await page.$(sel).catch(() => null)) {
			submitSelector = sel;
			break;
		}
	}

	if (!usernameSelector || !passwordSelector || !submitSelector) return null;
	return { usernameSelector, passwordSelector, submitSelector };
}

async function tryLogin(
	page: PWPage,
	opts: {
		usernameSelector: string;
		passwordSelector: string;
		submitSelector: string;
		username: string;
		password: string;
		successUrlIncludes?: string;
	},
): Promise<boolean> {
	try {
		const urlBefore = page.url();

		await page.locator(opts.usernameSelector).first().fill(opts.username, {
			timeout: ACTION_TIMEOUT_MS,
		});
		await page.locator(opts.passwordSelector).first().fill(opts.password, {
			timeout: ACTION_TIMEOUT_MS,
		});

		await Promise.all([
			page
				.waitForURL((url) => url.toString() !== urlBefore, {
					timeout: NAV_TIMEOUT_MS,
				})
				.catch(() => null),
			page
				.locator(opts.submitSelector)
				.first()
				.click({ timeout: ACTION_TIMEOUT_MS }),
		]);

		await page
			.waitForLoadState("networkidle", { timeout: NAV_TIMEOUT_MS })
			.catch(() => null);

		const urlAfter = page.url();
		const stillHasPasswordField = await page
			.$(opts.passwordSelector)
			.catch(() => null);

		if (opts.successUrlIncludes) {
			return urlAfter.includes(opts.successUrlIncludes);
		}

		return urlAfter !== urlBefore && !stillHasPasswordField;
	} catch {
		return false;
	}
}

async function attemptAuthentication(
	page: PWPage,
	entryUrl: string,
	credentials: { username: string; password: string } | undefined,
	bus: EventBus,
) {
	try {
		const hostname = new URL(entryUrl).hostname;
		const adapter = SITE_AUTH_ADAPTERS[hostname];

		if (adapter) {
			bus.emit("auth_attempted", `Using known adapter for ${hostname}`, {
				strategy: "adapter",
			});
			const ok = await tryLogin(page, {
				usernameSelector: adapter.usernameSelector,
				passwordSelector: adapter.passwordSelector,
				submitSelector: adapter.submitSelector,
				username: adapter.username,
				password: adapter.password,
				successUrlIncludes: adapter.successUrlIncludes,
			});
			if (ok)
				bus.emit("auth_succeeded", `Adapter login succeeded for ${hostname}`);
			else bus.emit("auth_failed", `Adapter login failed for ${hostname}`);
			return { attempted: true, succeeded: ok };
		}

		if (credentials) {
			bus.emit("auth_attempted", "Using supplied credentials", {
				strategy: "supplied",
			});
			const selectors = await resolveGenericAuthSelectors(page);
			if (selectors) {
				const ok = await tryLogin(page, {
					...selectors,
					username: credentials.username,
					password: credentials.password,
				});
				if (ok) bus.emit("auth_succeeded", "Supplied credential login succeeded");
				else bus.emit("auth_failed", "Supplied credential login failed");
				return { attempted: true, succeeded: ok };
			}
		}

		const visibleCreds = await extractVisibleDemoCredentials(page);
		if (visibleCreds) {
			bus.emit("auth_attempted", "Using visible demo credentials found on page", {
				strategy: "visible_demo",
			});
			const selectors = await resolveGenericAuthSelectors(page);
			if (selectors) {
				const ok = await tryLogin(page, { ...selectors, ...visibleCreds });
				if (ok)
					bus.emit("auth_succeeded", "Visible demo credential login succeeded");
				else bus.emit("auth_failed", "Visible demo credential login failed");
				return { attempted: true, succeeded: ok };
			}
		}

		return { attempted: false, succeeded: false };
	} catch (err) {
		bus.emit(
			"auth_failed",
			`Unhandled auth error: ${(err as Error).message}`,
			{ stack: (err as Error).stack?.slice(0, 300) },
		);
		return { attempted: true, succeeded: false };
	}
}

async function classifyPageType(
	page: PWPage,
	hasAuthForm: boolean,
): Promise<PageType> {
	if (hasAuthForm) return "LOGIN";

	const url = page.url().toLowerCase();
	const bodyText = await page
		.evaluate(() => document.body.innerText.toLowerCase())
		.catch(() => "");

	if (
		/checkout|cart|payment|billing/.test(url) ||
		/checkout|add to cart|proceed to payment/.test(bodyText)
	) {
		return "CHECKOUT";
	}
	if (/docs|documentation|api-reference|developer/.test(url)) return "DOCS";
	if (/settings|account|profile|preferences/.test(url)) return "SETTINGS";
	if (/product|item|inventory|detail/.test(url)) return "DETAIL";
	if (/list|catalog|products|shop|browse/.test(url)) return "LISTING";
	if (
		/pricing|about|home|landing|features/.test(url) ||
		url.match(/^https?:\/\/[^/]+\/?$/)
	) {
		return "MARKETING";
	}
	return "UNKNOWN";
}

async function extractNavStructure(page: PWPage): Promise<NavStructure> {
	return page
		.evaluate(() => {
			const navLabels = Array.from(document.querySelectorAll("nav a, header a"))
				.map((el) => el.textContent?.trim())
				.filter((t): t is string => Boolean(t))
				.slice(0, 20);

			const ctaLabels = Array.from(
				document.querySelectorAll(
					'button, [role="button"], input[type="submit"]',
				),
			)
				.map((el) => el.textContent?.trim() || (el as HTMLInputElement).value)
				.filter((t): t is string => Boolean(t))
				.slice(0, 20);

			return { navLabels, ctaLabels };
		})
		.catch(() => ({ navLabels: [], ctaLabels: [] }));
}

async function extractAccessibilitySummary(
	page: PWPage,
): Promise<AccessibilitySummary> {
	// Check for :focus styles and @media prefers-reduced-motion in stylesheets
	const [hasStyleFeatures] = await Promise.all([
		page.evaluate(() => {
			try {
				const sheets = Array.from(document.styleSheets);
				let hasFocus = false;
				let hasReducedMotion = false;
				for (const sheet of sheets) {
					try {
						const rules = Array.from(sheet.cssRules || []);
						for (const rule of rules) {
							const text = rule.cssText || "";
							if (text.includes(":focus") && !text.includes("outline: none") && !text.includes("outline:none")) hasFocus = true;
							if (text.includes("prefers-reduced-motion")) hasReducedMotion = true;
						}
					} catch { /* cross-origin sheet */ }
				}
				return { hasFocusStyles: hasFocus, hasReducedMotionQuery: hasReducedMotion };
			} catch {
				return { hasFocusStyles: false, hasReducedMotionQuery: false };
			}
		}).catch(() => ({ hasFocusStyles: false, hasReducedMotionQuery: false })),
	]);

	return page
		.evaluate((styleFeats: { hasFocusStyles: boolean; hasReducedMotionQuery: boolean }) => {
			const images = Array.from(document.querySelectorAll("img"));
			const imagesWithoutAlt = images.filter(
				(img) => !img.getAttribute("alt"),
			).length;

			const buttons = Array.from(
				document.querySelectorAll('button, [role="button"]'),
			);
			const buttonsWithoutLabel = buttons.filter(
				(b) => !b.textContent?.trim() && !b.getAttribute("aria-label"),
			).length;

			const inputs = Array.from(
				document.querySelectorAll("input, textarea, select"),
			);
			const inputsWithoutLabel = inputs.filter((input) => {
				const id = input.getAttribute("id");
				const hasLabel = id
					? !!document.querySelector(`label[for="${id}"]`)
					: false;
				const hasAriaLabel = input.getAttribute("aria-label");
				return !hasLabel && !hasAriaLabel;
			}).length;

			const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
			const landmarks = document.querySelectorAll(
				'nav, main, header, footer, [role="navigation"], [role="main"]',
			);

			// Extended checks
			const hasSkipLink = !!document.querySelector('a[href^="#main"], a[href^="#content"], [class*="skip"]');
			const hasLangAttr = !!(document.documentElement.getAttribute("lang"));
			const ariaLabelCount = document.querySelectorAll("[aria-label]").length;
			const hasMainLandmark = !!document.querySelector('main, [role="main"]');
			const tabIndexAbuse = Array.from(document.querySelectorAll("[tabindex]"))
				.filter(el => parseInt(el.getAttribute("tabindex") || "0") > 0).length;

			return {
				imagesWithoutAlt,
				totalImages: images.length,
				buttonsWithoutLabel,
				inputsWithoutLabel,
				headingCount: headings.length,
				hasH1: document.querySelectorAll("h1").length > 0,
				landmarkCount: landmarks.length,
				hasSkipLink,
				hasLangAttribute: hasLangAttr,
				hasFocusStyles: styleFeats.hasFocusStyles,
				ariaLabelCount,
				hasMainLandmark,
				tabIndexAbuse,
				hasReducedMotionQuery: styleFeats.hasReducedMotionQuery,
			};
		}, hasStyleFeatures)
		.catch(() => ({
			imagesWithoutAlt: 0,
			totalImages: 0,
			buttonsWithoutLabel: 0,
			inputsWithoutLabel: 0,
			headingCount: 0,
			hasH1: false,
			landmarkCount: 0,
			hasSkipLink: false,
			hasLangAttribute: false,
			hasFocusStyles: false,
			ariaLabelCount: 0,
			hasMainLandmark: false,
			tabIndexAbuse: 0,
			hasReducedMotionQuery: false,
		}));
}

async function extractPerformanceMetrics(
	page: PWPage,
): Promise<Record<string, number> | null> {
	try {
		const metrics = await page.evaluate(() => {
			const nav = performance.getEntriesByType("navigation")[0] as
				| PerformanceNavigationTiming
				| undefined;
			if (!nav) return null;
			return {
				domContentLoadedMs: Math.round(
					nav.domContentLoadedEventEnd - nav.startTime,
				),
				loadEventMs: Math.round(nav.loadEventEnd - nav.startTime),
				ttfbMs: Math.round(nav.responseStart - nav.requestStart),
			};
		});
		return metrics;
	} catch {
		return null;
	}
}

async function extractPageData(
	page: PWPage,
	depth: number,
	hasAuthForm: boolean,
) {
	const title = await page.title().catch(() => null);

	const content = await page
		.evaluate(() => {
			const clone = document.body.cloneNode(true) as HTMLElement;
			clone
				.querySelectorAll("script, style, noscript")
				.forEach((el) => el.remove());
			return clone.innerText.replace(/\s+/g, " ").trim().slice(0, 8000);
		})
		.catch(() => null);

	const counts = await page
		.evaluate(() => ({
			forms: document.querySelectorAll("form").length,
			buttons: document.querySelectorAll(
				'button, [role="button"], input[type="submit"]',
			).length,
			links: document.querySelectorAll("a[href]").length,
			inputs: document.querySelectorAll("input, textarea, select").length,
		}))
		.catch(() => ({ forms: 0, buttons: 0, links: 0, inputs: 0 }));

	const primaryActionLabel = await page
		.evaluate(() => {
			const candidates = Array.from(
				document.querySelectorAll(
					'button, [role="button"], input[type="submit"], a.btn, a.button',
				),
			) as HTMLElement[];
			const visible = candidates.find((el) => {
				const rect = el.getBoundingClientRect();
				return rect.width > 0 && rect.height > 0;
			});
			return (
				visible?.innerText?.trim() || visible?.getAttribute("value") || null
			);
		})
		.catch(() => null);

	// Extract top CTA button labels for evidence grounding
	const ctaTexts = await page
		.evaluate(() => {
			const buttons = Array.from(
				document.querySelectorAll(
					'button, [role="button"], input[type="submit"], a[class*="btn" i], a[class*="cta" i]',
				),
			) as HTMLElement[];
			return buttons
				.map(
					(el) =>
						(el as HTMLInputElement).value?.trim() ||
						el.textContent?.trim() ||
						el.getAttribute("aria-label") ||
						"",
				)
				.filter((t) => t.length > 0 && t.length < 80)
				.slice(0, 10);
		})
		.catch(() => [] as string[]);

	// Extract heading hierarchy for content clarity analysis
	const headingStructure = await page
		.evaluate(() => {
			const headings = Array.from(
				document.querySelectorAll("h1, h2, h3"),
			) as HTMLElement[];
			return headings
				.map((h) => {
					const tag = h.tagName.toLowerCase();
					const text = h.textContent?.trim().slice(0, 120) ?? "";
					return text ? `${tag}: ${text}` : "";
				})
				.filter(Boolean)
				.slice(0, 15);
		})
		.catch(() => [] as string[]);

	const navStructure = await extractNavStructure(page);
	const accessibility = await extractAccessibilitySummary(page);
	const performance = await extractPerformanceMetrics(page);

	const wordCount = content
		? content.trim().split(/\s+/).filter(Boolean).length
		: 0;
	const interactionCount = counts.buttons + counts.links;

	return {
		title,
		depth,
		content,
		formsCount: counts.forms,
		buttonsCount: counts.buttons,
		linksCount: counts.links,
		inputCount: counts.inputs,
		textLength: content?.length ?? 0,
		wordCount,
		interactionCount,
		hasAuthForm,
		primaryActionLabel,
		ctaTexts,
		headingStructure,
		performance,
		accessibility,
		navStructure,
	};
}

async function extractInternalLinks(
	page: PWPage,
	policy: UrlPolicy,
	baseUrl: string,
): Promise<{ url: string; source: QueueItem["source"] }[]> {
	const rawLinks = await page
		.evaluate(() => {
			const anchors = Array.from(document.querySelectorAll("a[href]"));
			return anchors.map((a) => ({
				href: (a as HTMLAnchorElement).getAttribute("href") || "",
				inNav: !!a.closest("nav, header"),
				isCta: !!a.closest(
					'[class*="cta" i], [class*="btn" i], [class*="button" i]',
				),
			}));
		})
		.catch(() => []);

	const results: { url: string; source: QueueItem["source"] }[] = [];
	const seen = new Set<string>();

	for (const link of rawLinks) {
		const normalized = policy.normalize(link.href, baseUrl);
		if (!normalized || !policy.isAllowed(normalized) || seen.has(normalized))
			continue;
		seen.add(normalized);
		results.push({
			url: normalized,
			source: link.inNav ? "nav" : link.isCta ? "cta" : "content",
		});
	}

	return results;
}

async function createContext(
	browser: Browser,
	deviceType: DeviceType,
): Promise<BrowserContext> {
	const isMobile = deviceType === "MOBILE";
	return browser.newContext({
		viewport: isMobile
			? { width: 390, height: 844 }
			: { width: 1440, height: 900 },
		userAgent: isMobile
			? "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
			: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
		isMobile,
		hasTouch: isMobile,
		ignoreHTTPSErrors: true,
	});
}

async function navigateSafely(
	page: PWPage,
	url: string,
): Promise<{ ok: boolean; response: Response | null }> {
	try {
		const response = await page.goto(url, {
			waitUntil: "domcontentloaded",
			timeout: NAV_TIMEOUT_MS,
		});
		await page
			.waitForLoadState("networkidle", { timeout: NAV_TIMEOUT_MS })
			.catch(() => null);
		await delay(CONTENT_SETTLE_MS);
		return { ok: true, response };
	} catch {
		return { ok: false, response: null };
	}
}

function buildCrawlerStats(
	pages: CrawledPageResult[],
	pagesDiscovered: number,
	skippedUrls: string[],
	blockedUrls: string[],
): CrawlerStats {
	const totalForms = pages.reduce((s, p) => s + p.formsCount, 0);
	const totalButtons = pages.reduce((s, p) => s + p.buttonsCount, 0);
	const totalImages = pages.reduce((s, p) => s + (p.accessibility?.totalImages ?? 0), 0);
	const totalLinks = pages.reduce((s, p) => s + p.linksCount, 0);
	const totalInputs = pages.reduce((s, p) => s + p.inputCount, 0);
	const totalHeadings = pages.reduce((s, p) => s + (p.accessibility?.headingCount ?? 0), 0);
	const totalWords = pages.reduce((s, p) => s + p.wordCount, 0);
	const avgWordCount = pages.length > 0 ? Math.round(totalWords / pages.length) : 0;

	// DOM depth proxy: use max heading level as a rough indicator
	const avgDomDepth = pages.length > 0
		? Math.round(pages.reduce((s, p) => s + p.depth, 0) / pages.length)
		: 0;

	// Largest page by word count
	let largestPageUrl: string | null = null;
	let largestPageWords = 0;
	for (const p of pages) {
		if (p.wordCount > largestPageWords) {
			largestPageWords = p.wordCount;
			largestPageUrl = p.url;
		}
	}

	// Performance extremes
	let fastestPageUrl: string | null = null;
	let fastestPageMs: number | null = null;
	let slowestPageUrl: string | null = null;
	let slowestPageMs: number | null = null;
	const ttfbs: number[] = [];
	const loads: number[] = [];

	for (const p of pages) {
		if (!p.performance) continue;
		const loadMs = p.performance["loadEventMs"] as number | undefined;
		const ttfb = p.performance["ttfbMs"] as number | undefined;
		if (ttfb != null) ttfbs.push(ttfb);
		if (loadMs != null) {
			loads.push(loadMs);
			if (fastestPageMs === null || loadMs < fastestPageMs) {
				fastestPageMs = loadMs;
				fastestPageUrl = p.url;
			}
			if (slowestPageMs === null || loadMs > slowestPageMs) {
				slowestPageMs = loadMs;
				slowestPageUrl = p.url;
			}
		}
	}

	const avgTtfbMs = ttfbs.length > 0 ? Math.round(ttfbs.reduce((a, b) => a + b, 0) / ttfbs.length) : null;
	const avgLoadMs = loads.length > 0 ? Math.round(loads.reduce((a, b) => a + b, 0) / loads.length) : null;

	return {
		totalPages: pages.length,
		totalForms,
		totalButtons,
		totalImages,
		totalLinks,
		totalInputs,
		totalHeadings,
		totalWords,
		avgWordCount,
		avgDomDepth,
		largestPageUrl,
		largestPageWords,
		fastestPageUrl,
		fastestPageMs,
		slowestPageUrl,
		slowestPageMs,
		skippedUrls: skippedUrls.slice(0, 20),
		blockedUrls: blockedUrls.slice(0, 20),
		redirectCount: 0, // tracked via events in future
		brokenLinkCount: 0,
		avgTtfbMs,
		avgLoadMs,
		pagesDiscovered,
		pagesCrawled: pages.length,
		pagesSkipped: skippedUrls.length,
		pagesBlocked: blockedUrls.length,
	};
}

export async function runCrawlJob(
	job: CrawlJobInput,
	onEvent?: (event: CrawlEvent) => void,
): Promise<CrawlOutcome> {
	const bus = new EventBus(onEvent);
	const policy = new UrlPolicy(job.url);
	const queue = new CrawlQueue();
	const pages: CrawledPageResult[] = [];
	const skippedUrls: string[] = [];
	const blockedUrls: string[] = [];
	let pagesDiscovered = 1; // seed URL

	let browser: Browser | null = null;
	let partial = false;
	let partialReason: string | undefined;

	const startedAt = Date.now();
	const normalizedSeed = policy.normalize(job.url, job.url) || job.url;
	bus.emit("job_started", `Starting crawl for ${normalizedSeed}`, {
		analysisId: job.analysisId,
	});

	policy.markVisited(normalizedSeed);
	queue.push({ url: normalizedSeed, depth: 0, priority: 0, source: "seed" });

	try {
		browser = await chromium.launch({
			headless: true,
			args: [
				"--no-sandbox",
				"--disable-setuid-sandbox",
				"--disable-dev-shm-usage",
			],
		});

		const context = await createContext(browser, job.deviceType);
		context.setDefaultTimeout(ACTION_TIMEOUT_MS);
		context.setDefaultNavigationTimeout(NAV_TIMEOUT_MS);

		let authAttemptedOnce = false;

		while (queue.size > 0 && pages.length < job.maxPages) {
			if (Date.now() - startedAt > HARD_JOB_TIMEOUT_MS) {
				partial = true;
				partialReason = "job_timeout_exceeded";
				bus.emit("crawl_completed_partial", "Hard job timeout reached", {
					pagesCollected: pages.length,
				});
				break;
			}

			const item = queue.pop();
			if (!item) break;
			if (item.depth > job.maxDepth) {
				bus.emit("page_skipped", `Depth limit exceeded for ${item.url}`, {
					depth: item.depth,
				});
				skippedUrls.push(item.url);
				continue;
			}

			const page = await context.newPage();
			let loaded = false;

			try {
				for (let attempt = 0; attempt <= MAX_RETRIES_PER_PAGE; attempt++) {
					const result = await navigateSafely(page, item.url);
					if (result.ok) {
						loaded = true;
						break;
					}
					if (attempt < MAX_RETRIES_PER_PAGE) {
						await delay(500 * (attempt + 1));
					}
				}

				if (!loaded) {
					bus.emit("page_skipped", `Failed to load ${item.url} after retries`);
					continue;
				}

				const hasAuthForm = await detectAuthForm(page);

				if (hasAuthForm && !authAttemptedOnce) {
					authAttemptedOnce = true;
					bus.emit("auth_form_detected", `Login form detected at ${item.url}`);

					const authResult = await attemptAuthentication(
						page,
						job.url,
						job.credentials,
						bus,
					);

					if (authResult.succeeded) {
						const postAuthUrl = page.url();
						const normalizedPostAuth = policy.normalize(postAuthUrl, postAuthUrl) || postAuthUrl;
						if (!policy.isVisited(normalizedPostAuth)) {
							policy.markVisited(normalizedPostAuth);
							queue.push({
								url: normalizedPostAuth,
								depth: item.depth,
								priority: priorityForSource("post_auth"),
								source: "post_auth",
							});
						}
					} else if (authResult.attempted) {
						partial = true;
						partialReason = "auth_attempted_but_failed";
					} else {
						partial = true;
						partialReason = "auth_required_no_strategy";
					}
				}

				const finalHasAuthForm = await detectAuthForm(page);
				const pageType = await classifyPageType(page, finalHasAuthForm);
				const extracted = await extractPageData(
					page,
					item.depth,
					finalHasAuthForm,
				);

				let screenshotBuffer: Buffer | null = null;
				try {
					screenshotBuffer = await page.screenshot({
						fullPage: false,   // viewport only — fullPage blows up payload size
						type: "jpeg",
						quality: 60,        // 60 is plenty for AI vision analysis
					});
				} catch {
					screenshotBuffer = null;
				}

				const path = (() => {
					try {
						return new URL(page.url()).pathname;
					} catch {
						return null;
					}
				})();

				pages.push({
					url: page.url(),
					path,
					pageType,
					screenshotBuffer,
					...extracted,
					// Ensure defaults for new fields in case extraction fails
					wordCount: extracted.wordCount ?? 0,
					interactionCount: extracted.interactionCount ?? 0,
					ctaTexts: extracted.ctaTexts ?? [],
					headingStructure: extracted.headingStructure ?? [],
					inputCount: extracted.inputCount ?? 0,
				});

				bus.emit("page_visited", `Visited ${page.url()}`, {
					depth: item.depth,
					pageType,
					pagesCollected: pages.length,
				});

				if (pages.length < job.maxPages && item.depth < job.maxDepth) {
					const links = await extractInternalLinks(page, policy, page.url());
					for (const link of links) {
						pagesDiscovered++;
						if (policy.isVisited(link.url)) continue;
						policy.markVisited(link.url);
						if (pages.length >= job.maxPages) {
							skippedUrls.push(link.url);
							continue;
						}
						queue.push({
							url: link.url,
							depth: item.depth + 1,
							priority: priorityForSource(link.source),
							source: link.source,
						});
						bus.emit("page_enqueued", `Enqueued ${link.url}`, {
							source: link.source,
						});
					}
				}
			} finally {
				await page.close().catch(() => null);
			}
		}

		await context.close().catch(() => null);

		if (pages.length === 0) {
			bus.emit("crawl_failed", "No pages could be crawled");
			return {
				status: "FAILED",
				partial: false,
				reason: "no_pages_crawled",
				pages: [],
				events: bus.all(),
			};
		}

		if (partial) {
			bus.emit(
				"crawl_completed_partial",
				"Crawl completed with partial coverage",
				{
					reason: partialReason,
					pagesCollected: pages.length,
				},
			);
		} else {
			bus.emit("crawl_completed", "Crawl completed successfully", {
				pagesCollected: pages.length,
			});
		}

		const crawlerStats = buildCrawlerStats(pages, pagesDiscovered, skippedUrls, blockedUrls);

		return {
			status: "COMPLETED",
			partial,
			reason: partialReason,
			pages,
			events: bus.all(),
			crawlerStats,
		};
	} catch (err) {
		bus.emit(
			"crawl_failed",
			`Unhandled crawl error: ${(err as Error).message}`,
		);
		return {
			status: "FAILED",
			partial: false,
			reason: (err as Error).message.slice(0, 300),
			pages,
			events: bus.all(),
		};
	} finally {
		await browser?.close().catch(() => null);
	}
}
