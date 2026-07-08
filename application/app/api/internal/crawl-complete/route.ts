// app/api/internal/crawl-complete/route.ts
// Orchestration pipeline for website analysis.
// Consumes: VisionService, WebsiteIntelligence, PersonaAnalysisService, FocusGroupService.
// This route NEVER directly calls any AI provider.

import { headers } from "next/headers";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import {
	analyzeScreenshot,
	shouldRunVision,
	getMaxVisionPages,
} from "@/lib/services/vision";
import { runSequentialEvaluations } from "@/lib/services/persona-analysis-service";
import { runFocusGroup } from "@/lib/services/focus-group-service";
import {
	buildWebsiteIntelligence,
	intelligenceToSiteContext,
} from "@/lib/services/website-intelligence";
import { aggregateInsights } from "@/lib/services/aggregator";
import { runQualityGate } from "@/lib/services/quality-gate";
import { Limits } from "@/lib/rate-limit";
import { getRequestId, apiSuccess, apiFailure } from "@/lib/api/response";
import { ApiErrors, classifyError } from "@/lib/api/errors";
import type {
	PersonaContext,
	PersonaEvaluationWithLabel,
	CrawlCoverage,
	StructuredPainPoint,
} from "@/lib/types";
import type { RawPageInput } from "@/lib/services/website-intelligence";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

// ── Zod schemas ────────────────────────────────────────────────────────────────
const CrawlEventSchema = z.object({
	type: z.string(),
	message: z.string(),
	data: z.record(z.string(), z.unknown()).optional(),
	timestamp: z.string(),
});

const AccessibilitySchema = z
	.object({
		imagesWithoutAlt: z.number().optional(),
		totalImages: z.number().optional(),
		buttonsWithoutLabel: z.number().optional(),
		inputsWithoutLabel: z.number().optional(),
		headingCount: z.number().optional(),
		hasH1: z.boolean().optional(),
		landmarkCount: z.number().optional(),
	})
	.nullable()
	.optional();

const NewPageSchema = z.object({
	url: z.string().url().max(2048),
	path: z.string().nullable(),
	title: z.string().max(500).nullable(),
	depth: z.number().int().min(0).max(10),
	content: z.string().max(10000).nullable(),
	formsCount: z.number().int().min(0),
	buttonsCount: z.number().int().min(0),
	linksCount: z.number().int().min(0),
	inputCount: z.number().int().min(0).default(0),
	textLength: z.number().int().min(0),
	wordCount: z.number().int().min(0).default(0),
	interactionCount: z.number().int().min(0).default(0),
	hasAuthForm: z.boolean(),
	primaryActionLabel: z.string().max(200).nullable(),
	ctaTexts: z.array(z.string()).default([]),
	headingStructure: z.array(z.string()).default([]),
	performance: z.record(z.string(), z.number()).nullable(),
	accessibility: AccessibilitySchema,
	navStructure: z.record(z.string(), z.unknown()).nullable(),
	pageType: z.string().default("UNKNOWN"),
	screenshotBase64: z.string().nullable(),
});

const NewCrawlCompleteSchema = z.object({
	analysisId: z.string().cuid(),
	pages: z.array(NewPageSchema).min(1).max(20),
	meta: z
		.object({
			partial: z.boolean().optional(),
			partialReason: z.string().nullable().optional(),
		})
		.optional(),
	events: z.array(CrawlEventSchema).optional(),
});

type ParsedPage = z.infer<typeof NewPageSchema>;

// ── Friction Score ─────────────────────────────────────────────────────────────
function computeFrictionScore(p: ParsedPage): number {
	let score = 20;
	const a11y = p.accessibility;
	if (a11y) {
		score += (a11y.imagesWithoutAlt ?? 0) * 2;
		score += (a11y.inputsWithoutLabel ?? 0) * 5;
		if (!a11y.hasH1) score += 10;
	}
	const perf = p.performance as {
		ttfbMs?: number;
		loadEventMs?: number;
	} | null;
	if (perf?.ttfbMs && perf.ttfbMs > 800) score += 10;
	if (perf?.loadEventMs && perf.loadEventMs > 3000) score += 10;
	if (!p.primaryActionLabel) score += 5;
	return Math.min(100, Math.max(0, score));
}

// ── Handler ────────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
	const requestId = getRequestId(req);

	// ── Auth ───────────────────────────────────────────────────────────────────
	const headersList = await headers();
	const apiKey = headersList.get("x-internal-api-key");
	if (
		!process.env.CRAWLER_INTERNAL_API_KEY ||
		apiKey !== process.env.CRAWLER_INTERNAL_API_KEY
	) {
		return apiFailure(requestId, ApiErrors.unauthorized(), 401);
	}

	// ── Parse + Validate ───────────────────────────────────────────────────────
	const raw = await req.json().catch(() => null);
	if (!raw) return apiFailure(requestId, ApiErrors.invalidJson(), 400);

	const parsed = NewCrawlCompleteSchema.safeParse(raw);
	if (!parsed.success) {
		console.error(
			"[crawl-complete] Payload validation failed:",
			parsed.error.flatten(),
		);
		return apiFailure(
			requestId,
			ApiErrors.validationFailed(
				parsed.error.flatten().fieldErrors as Record<string, string[]>,
			),
			400,
		);
	}

	const { analysisId, pages, meta, events } = parsed.data;

	// ── Idempotency ────────────────────────────────────────────────────────────
	const rl = Limits.internalCrawlComplete(analysisId);
	if (!rl.allowed) {
		return apiFailure(
			requestId,
			ApiErrors.rateLimitExceeded(rl.resetAt - Date.now()),
			429,
		);
	}

	const analysis = await db.analysis.findUnique({
		where: { id: analysisId },
		select: {
			id: true,
			status: true,
			url: true,
			analysisInput: true,
			deviceType: true,
		},
	});
	if (!analysis)
		return apiFailure(requestId, ApiErrors.analysisNotFound(), 404);
	if (analysis.status === "COMPLETED" || analysis.status === "ANALYZING") {
		return apiSuccess(requestId, {
			skipped: true,
			reason: "Already processed",
		});
	}
	if (analysis.status === "FAILED") {
		return apiFailure(requestId, ApiErrors.cannotCancel(analysis.status), 409);
	}

	try {
		await db.analysis.update({
			where: { id: analysisId },
			data: {
				status: "ANALYZING",
				meta: {
					crawlerEvents: events ?? [],
					crawlMeta: meta ?? null,
				} as unknown as Prisma.InputJsonValue,
			},
		});

		// ══════════════════════════════════════════════════════════════════════════
		// PHASE 1: Store pages + selective vision analysis
		// Vision only runs on priority page types (homepage, pricing, login, etc.)
		// and is capped at maxVisionPages. Same screenshot is never analysed twice.
		// ══════════════════════════════════════════════════════════════════════════
		const maxVision = getMaxVisionPages();
		let visionCount = 0;
		const rawPageInputs: RawPageInput[] = [];

		for (const p of pages) {
			const frictionScore = computeFrictionScore(p);

			const page = await db.page.create({
				data: {
					analysisId,
					url: p.url,
					path: p.path,
					title: p.title,
					depth: p.depth,
					content: (p.content ?? "").slice(0, 8000),
					pageType: p.pageType,
					formsCount: p.formsCount,
					buttonsCount: p.buttonsCount,
					linksCount: p.linksCount,
					inputCount: p.inputCount,
					textLength: p.textLength,
					wordCount: p.wordCount,
					interactionCount: p.interactionCount,
					hasAuthForm: p.hasAuthForm,
					primaryActionLabel: p.primaryActionLabel,
					ctaTexts: p.ctaTexts as Prisma.InputJsonValue,
					headingStructure: p.headingStructure as Prisma.InputJsonValue,
					navStructure: p.navStructure as Prisma.InputJsonValue,
					performance: p.performance as Prisma.InputJsonValue,
					accessibility: p.accessibility as Prisma.InputJsonValue,
					frictionScore,
				},
			});

			// Upload screenshot to CDN
			let vpCdnUrl: string | null = null;
			if (p.screenshotBase64) {
				try {
					const { uploadScreenshot } = await import("@/lib/services/imagekit");
					const buf = Buffer.from(p.screenshotBase64, "base64");
					vpCdnUrl = await uploadScreenshot(
						buf,
						`${page.id}.jpg`,
						`/personaforge/screenshots/${analysisId}`,
					);
					await db.screenshot.create({
						data: {
							pageId: page.id,
							cdnUrl: vpCdnUrl,
							type: "VIEWPORT",
							width: 1440,
							height: 900,
						},
					});
				} catch (uploadErr) {
					console.warn(
						`[crawl-complete] Screenshot upload failed for ${p.url}:`,
						(uploadErr as Error).message,
					);
				}
			}

			// Vision: only priority page types, capped at maxVisionPages
			let visionMeta = null;
			const runVision =
				shouldRunVision(p.pageType, Boolean(vpCdnUrl)) &&
				visionCount < maxVision;
			if (runVision && vpCdnUrl) {
				visionMeta = await analyzeScreenshot(vpCdnUrl, p.title ?? p.url);
				if (visionMeta) {
					visionCount++;
					await db.page.update({
						where: { id: page.id },
						data: {
							visionMeta: visionMeta as unknown as Prisma.InputJsonValue,
						},
					});
				}
			}

			rawPageInputs.push({
				url: p.url,
				title: p.title,
				pageType: p.pageType,
				depth: p.depth,
				buttonsCount: p.buttonsCount,
				formsCount: p.formsCount,
				linksCount: p.linksCount,
				inputCount: p.inputCount,
				wordCount: p.wordCount,
				interactionCount: p.interactionCount,
				hasH1: p.accessibility?.hasH1,
				primaryActionLabel: p.primaryActionLabel,
				ctaTexts: p.ctaTexts,
				headingStructure: p.headingStructure,
				accessibility: p.accessibility ?? null,
				performance: p.performance as {
					ttfbMs?: number;
					loadEventMs?: number;
				} | null,
				navStructure: p.navStructure as { navLabels?: string[] } | null,
				frictionScore,
				visionMeta,
				content: p.content,
			});
		}

		// ══════════════════════════════════════════════════════════════════════════
		// PHASE 2: Build master WebsiteIntelligence object (ONE per analysis).
		// All downstream AI processes consume this — never re-crawl, never re-parse.
		// ══════════════════════════════════════════════════════════════════════════
		const websiteIntelligence = buildWebsiteIntelligence(
			analysis.url,
			analysis.deviceType,
			rawPageInputs,
		);
		const siteContext = intelligenceToSiteContext(websiteIntelligence);

		// ══════════════════════════════════════════════════════════════════════════
		// PHASE 3: Build persona contexts (prebuilt + custom)
		// ══════════════════════════════════════════════════════════════════════════
		const personaMeta = analysis.analysisInput as {
			personaIds: string[];
			customPersonas: Array<{
				name: string;
				age: number;
				occupation: string;
				technicalLevel: string;
				goals: string;
				frustrations: string;
			}>;
		};

		const prebuiltPersonas =
			personaMeta.personaIds?.length > 0
				? await db.persona.findMany({
						where: { id: { in: personaMeta.personaIds }, isActive: true },
					})
				: [];

		const allPersonaContexts: PersonaContext[] = [
			...prebuiltPersonas.map((p) => {
				const metadata = p.metadata as Record<string, unknown> | null;
				return {
					id: p.id,
					label: p.label,
					name: p.name,
					age: p.age,
					occupation: p.occupation,
					technicalLevel: p.technicalLevel,
					goals: p.goals,
					frustrations: p.frustrations,
					digitalLiteracy: metadata?.digitalLiteracy as string | undefined,
					browsingHabits: metadata?.browsingHabits as string | undefined,
					decisionCriteria: metadata?.decisionCriteria as string | undefined,
					personality: metadata?.personality as string | undefined,
					trustTriggers: metadata?.trustTriggers as string | undefined,
					dealBreakers: metadata?.dealBreakers as string | undefined,
				};
			}),
			...(personaMeta.customPersonas ?? []).map((c, i) => ({
				id: undefined,
				label: `Custom Persona ${i + 1}`,
				name: c.name,
				age: c.age,
				occupation: c.occupation,
				technicalLevel: c.technicalLevel,
				goals: c.goals,
				frustrations: c.frustrations,
			})),
		];

		// ══════════════════════════════════════════════════════════════════════════
		// PHASE 4: Sequential persona evaluation pipeline.
		// Personas are evaluated one-by-one with 500ms gaps between calls.
		// Rate limit 429s are handled internally with exponential backoff.
		// Only the failed persona is retried — completed ones are never repeated.
		// ══════════════════════════════════════════════════════════════════════════
		const evaluations = await runSequentialEvaluations(
			allPersonaContexts,
			siteContext as unknown as import("@/lib/types").SiteContext,
			(progress) => {
				console.log(
					`[crawl-complete] Persona pipeline: ${progress.completed}/${progress.total} — current: ${progress.current ?? "done"}`,
				);
			},
		);

		await Promise.all(
			allPersonaContexts.map((ctx, i) => {
				const ev = evaluations[i];
				return db.analysisPersona.create({
					data: {
						analysisId,
						personaId: ctx.id ?? null,
						label: ctx.label,
						name: ctx.name,
						age: ctx.age,
						occupation: ctx.occupation,
						technicalLevel: ctx.technicalLevel as "LOW" | "MEDIUM" | "HIGH",
						goals: ctx.goals,
						frustrations: ctx.frustrations,
						firstImpressions: ev.firstImpressions ?? null,
						personaVoice: ev.personaVoice ?? null,
						sentiment: ev.sentiment ?? null,
						frictionScore: ev.frictionScore ?? null,
						adoptionLikelihood: ev.adoptionLikelihood ?? null,
						adoptionReasoning: ev.adoptionReasoning ?? null,
						overallUxScore: ev.overallUxScore ?? null,
						uxCategoryScores:
							(ev.uxCategoryScores as unknown as Prisma.InputJsonValue) ?? null,
						structuredPositives:
							(ev.positives as unknown as Prisma.InputJsonValue) ?? null,
						structuredPainPoints:
							(ev.painPoints as unknown as Prisma.InputJsonValue) ?? null,
						structuredRecommendations:
							(ev.recommendations as unknown as Prisma.InputJsonValue) ?? null,
						accessibilityFindings:
							(ev.accessibilityFindings as unknown as Prisma.InputJsonValue) ??
							null,
						accessibilityNotes: ev.accessibilityNotes ?? null,
						positives: JSON.stringify(
							(ev.positives ?? []).map((p) =>
								typeof p === "string" ? p : p.finding,
							),
						),
						painPoints: JSON.stringify(
							(ev.painPoints ?? []).map((p) =>
								typeof p === "string" ? p : (p as StructuredPainPoint).issue,
							),
						),
						recommendations: JSON.stringify(
							(ev.recommendations ?? []).map((r) =>
								typeof r === "string" ? r : (r.improvement ?? r.issue),
							),
						),
						evidence: (ev.evidence ?? []) as Prisma.InputJsonValue,
						rawModelOutput: ev as unknown as Prisma.InputJsonValue,
					},
				});
			}),
		);

		// ══════════════════════════════════════════════════════════════════════════
		// PHASE 5: Focus group synthesis (FocusGroupService — never calls LLM directly)
		// ══════════════════════════════════════════════════════════════════════════
		const evaluationsWithLabels: PersonaEvaluationWithLabel[] =
			allPersonaContexts.map((ctx, i) => ({
				...evaluations[i],
				label: ctx.label,
				name: ctx.name,
				age: ctx.age,
			}));

		const focusGroupResult = await runFocusGroup(
			evaluationsWithLabels,
			analysis.url,
		);

		await db.focusGroupInsight.create({
			data: {
				analysisId,
				summary: focusGroupResult.summary,
				moderatorSummary: focusGroupResult.moderatorSummary ?? null,
				discussion:
					(focusGroupResult.discussion as unknown as Prisma.InputJsonValue) ??
					null,
				consensus:
					(focusGroupResult.consensus as unknown as Prisma.InputJsonValue) ??
					null,
				openQuestions:
					(focusGroupResult.openQuestions as unknown as Prisma.InputJsonValue) ??
					null,
				agreementMatrix:
					(focusGroupResult.personaAgreementMatrix as unknown as Prisma.InputJsonValue) ??
					null,
				conflicts:
					focusGroupResult.conflicts as unknown as Prisma.InputJsonValue,
			},
		});

		// ── Quality gate ────────────────────────────────────────────────────────
		const qualityGateResult = runQualityGate(evaluationsWithLabels, {
			pageCount: pages.length,
		});
		if (!qualityGateResult.passed) {
			console.warn(
				`[crawl-complete] Quality gate FAILED for ${analysisId}:`,
				qualityGateResult.failures,
			);
		}

		// ── CrawlCoverage + CrawlerStats ────────────────────────────────────────
		const wi = websiteIntelligence;
		const crawlCoverage: CrawlCoverage = {
			pagesCrawled: wi.crawlCoverage.pagesCrawled,
			pagesDiscovered: wi.crawlCoverage.pagesDiscovered,
			pagesBlocked: 0,
			pagesSkipped: Math.max(
				0,
				wi.crawlCoverage.pagesDiscovered - wi.crawlCoverage.pagesCrawled,
			),
			avgDepth:
				Math.round(
					(rawPageInputs.reduce((s, p) => s + p.depth, 0) /
						Math.max(rawPageInputs.length, 1)) *
						10,
				) / 10,
			maxDepthReached: wi.maxDepth,
			coverageConfidence: wi.crawlCoverage.coverageConfidence,
			coveragePercent: wi.crawlCoverage.coveragePercent,
			coverageNote: wi.crawlCoverage.coverageNote,
		};

		const perfPages = pages
			.map(
				(p) =>
					p.performance as { ttfbMs?: number; loadEventMs?: number } | null,
			)
			.filter(Boolean) as { ttfbMs?: number; loadEventMs?: number }[];
		const avgTtfbMs =
			perfPages.length > 0
				? Math.round(
						perfPages.reduce((s, p) => s + (p.ttfbMs ?? 0), 0) /
							perfPages.length,
					)
				: null;
		const avgLoadMs =
			perfPages.length > 0
				? Math.round(
						perfPages.reduce((s, p) => s + (p.loadEventMs ?? 0), 0) /
							perfPages.length,
					)
				: null;
		const totalWords = pages.reduce((s, p) => s + (p.wordCount ?? 0), 0);
		const avgWordCount =
			pages.length > 0 ? Math.round(totalWords / pages.length) : 0;
		const avgDepth =
			rawPageInputs.length > 0
				? rawPageInputs.reduce((s, p) => s + p.depth, 0) / rawPageInputs.length
				: 0;

		const crawlerStats = {
			totalPages: pages.length,
			totalForms: wi.totalForms,
			totalButtons: wi.totalButtons,
			totalImages: wi.totalImages,
			totalLinks: wi.totalLinks,
			totalInputs: wi.totalInputs,
			totalHeadings: pages.reduce(
				(s, p) => s + (p.accessibility?.headingCount ?? 0),
				0,
			),
			totalWords,
			avgWordCount,
			avgDomDepth: Math.round(avgDepth * 10) / 10,
			largestPageUrl:
				pages.length > 0
					? pages.reduce((best, p) =>
							(p.wordCount ?? 0) > (best.wordCount ?? 0) ? p : best,
						).url
					: null,
			largestPageWords:
				pages.length > 0 ? Math.max(...pages.map((p) => p.wordCount ?? 0)) : 0,
			fastestPageUrl: (() => {
				const valid = pages.filter(
					(p) =>
						(p.performance as { loadEventMs?: number } | null)?.loadEventMs !=
						null,
				);
				return valid.length > 0
					? valid.reduce((b, p) =>
							((p.performance as { loadEventMs?: number } | null)
								?.loadEventMs ?? Infinity) <
							((b.performance as { loadEventMs?: number } | null)
								?.loadEventMs ?? Infinity)
								? p
								: b,
						).url
					: null;
			})(),
			fastestPageMs: (() => {
				const vals = pages
					.map(
						(p) =>
							(p.performance as { loadEventMs?: number } | null)?.loadEventMs,
					)
					.filter((v): v is number => v != null);
				return vals.length > 0 ? Math.min(...vals) : null;
			})(),
			slowestPageUrl: (() => {
				const valid = pages.filter(
					(p) =>
						(p.performance as { loadEventMs?: number } | null)?.loadEventMs !=
						null,
				);
				return valid.length > 0
					? valid.reduce((b, p) =>
							((p.performance as { loadEventMs?: number } | null)
								?.loadEventMs ?? 0) >
							((b.performance as { loadEventMs?: number } | null)
								?.loadEventMs ?? 0)
								? p
								: b,
						).url
					: null;
			})(),
			slowestPageMs: (() => {
				const vals = pages
					.map(
						(p) =>
							(p.performance as { loadEventMs?: number } | null)?.loadEventMs,
					)
					.filter((v): v is number => v != null);
				return vals.length > 0 ? Math.max(...vals) : null;
			})(),
			skippedUrls: [],
			blockedUrls: [],
			redirectCount: 0,
			brokenLinkCount: 0,
			avgTtfbMs,
			avgLoadMs,
		};

		// ── Aggregate + executive scorecard ────────────────────────────────────
		const insights = aggregateInsights(evaluationsWithLabels, {
			crawlCoverage,
			pageCount: pages.length,
			siteContext: {
				hasPricingPage: wi.hasPricingPage,
				hasContactPage: wi.hasContactPage,
				hasDocsPage: wi.hasDocsPage,
				pageTypes: wi.pageTypes,
			},
		});

		await db.analysis.update({
			where: { id: analysisId },
			data: {
				status: "COMPLETED",
				completedAt: new Date(),
				overallSentiment: insights.overallSentiment,
				overallFrictionScore: insights.overallFrictionScore,
				overallUxScore: insights.overallUxScore ?? null,
				uxMaturityLevel: insights.uxMaturityLevel ?? null,
				executiveScorecard: {
					topStrengths: insights.topStrengths,
					topRisks: insights.topRisks,
					businessRisk: insights.businessRisk,
					adoptionComparison: insights.adoptionComparison,
					opportunityMatrix: insights.opportunityMatrix,
					confidenceDistribution: insights.confidenceDistribution,
					mostImpactfulRecommendation: insights.mostImpactfulRecommendation,
					mostAffectedPersona: insights.mostAffectedPersona,
					technicalDebtIndicator: insights.technicalDebtIndicator,
					conversionRisk: insights.conversionRisk,
					accessibilityRisk: insights.accessibilityRisk,
				} as unknown as Prisma.InputJsonValue,
				crawlCoverage: crawlCoverage as unknown as Prisma.InputJsonValue,
				analysisReliability:
					insights.analysisReliability as unknown as Prisma.InputJsonValue,
				crawlerStats: crawlerStats as unknown as Prisma.InputJsonValue,
				researchGaps: (insights.researchGaps ??
					[]) as unknown as Prisma.InputJsonValue,
				meta: {
					...insights,
					qualityGate: qualityGateResult,
					crawlerEvents: events ?? [],
					crawlMeta: meta ?? null,
				} as unknown as Prisma.InputJsonValue,
			},
		});

		return apiSuccess(requestId, { completed: true });
	} catch (err) {
		console.error("[crawl-complete] Pipeline error:", err);
		const detail = classifyError(err);
		await db.analysis
			.update({
				where: { id: analysisId },
				data: { status: "FAILED", error: detail.technicalReason.slice(0, 300) },
			})
			.catch(console.error);
		return apiFailure(requestId, detail, 500);
	}
}
