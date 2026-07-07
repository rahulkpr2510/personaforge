import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";
import { analyzeScreenshot } from "@/lib/services/vision";
import { runParallelEvaluations } from "@/lib/services/persona-engine";
import { runFocusGroup } from "@/lib/services/focus-group";
import { aggregateInsights } from "@/lib/services/aggregator";
import { runQualityGate } from "@/lib/services/quality-gate";
import { Limits } from "@/lib/rate-limit";
import type {
  PersonaContext,
  PersonaEvaluationWithLabel,
  VisionAnalysis,
  SiteContext,
  StructuredPainPoint,
  CrawlCoverage,
} from "@/lib/types";

export const maxDuration = 300;

// Raise body limit for this route — the crawler sends base64-encoded
// screenshots (up to 20 pages × ~500KB each = ~10MB+ as JSON).
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

// ── Handler ────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  // Auth
  const headersList = await headers();
  const apiKey = headersList.get("x-internal-api-key");

  if (
    !process.env.CRAWLER_INTERNAL_API_KEY ||
    apiKey !== process.env.CRAWLER_INTERNAL_API_KEY
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse + validate
  const raw = await req.json().catch(() => null);
  if (!raw) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = NewCrawlCompleteSchema.safeParse(raw);
  if (!parsed.success) {
    console.error(
      "[crawl-complete] Payload validation failed:",
      parsed.error.flatten(),
    );
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { analysisId, pages, meta, events } = parsed.data;

  // Idempotency
  const rl = Limits.internalCrawlComplete(analysisId);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many retries for this analysis" },
      { status: 429 },
    );
  }

  const analysis = await db.analysis.findUnique({
    where: { id: analysisId },
    select: { id: true, status: true, url: true, analysisInput: true, deviceType: true },
  });

  if (!analysis) {
    return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
  }

  if (analysis.status === "COMPLETED" || analysis.status === "ANALYZING") {
    return NextResponse.json({ skipped: true, reason: "Already processed" });
  }

  if (analysis.status === "FAILED") {
    return NextResponse.json(
      { error: "Analysis was already marked FAILED" },
      { status: 409 },
    );
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

    // ── Phase 1: Store pages + run vision ────────────────────────────────────
    const storedPages: any[] = [];
    for (const p of pages) {
      // Small delay between pages to avoid API rate limit bursts
      if (storedPages.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
        // Compute page friction score from accessibility + performance evidence
        let frictionScore = 20;
        const a11y = p.accessibility;
        if (a11y) {
          frictionScore += (a11y.imagesWithoutAlt ?? 0) * 2;
          frictionScore += (a11y.inputsWithoutLabel ?? 0) * 5;
          if (!a11y.hasH1) frictionScore += 10;
        }
        const perf = p.performance as {
          ttfbMs?: number;
          loadEventMs?: number;
        } | null;
        if (perf) {
          if (perf.ttfbMs && perf.ttfbMs > 800) frictionScore += 10;
          if (perf.loadEventMs && perf.loadEventMs > 3000) frictionScore += 10;
        }
        if (!p.primaryActionLabel) frictionScore += 5;
        frictionScore = Math.min(100, Math.max(0, frictionScore));

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

        // Upload screenshot
        let vpCdnUrl: string | null = null;
        if (p.screenshotBase64) {
          try {
            const { uploadScreenshot } = await import(
              "@/lib/services/imagekit"
            );
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

        // Vision analysis
        let visionMeta: VisionAnalysis | null = null;
        if (vpCdnUrl) {
          try {
            visionMeta = await analyzeScreenshot(vpCdnUrl, p.title ?? p.url);
            await db.page.update({
              where: { id: page.id },
              data: {
                visionMeta: visionMeta as unknown as Prisma.InputJsonValue,
              },
            });
          } catch (visionErr) {
            console.warn(
              `[crawl-complete] Vision failed for ${p.url}:`,
              (visionErr as Error).message,
            );
          }
        }

        storedPages.push({ ...page, visionMeta, rawPage: p });
    }

    // ── Phase 2: Build rich SiteContext ───────────────────────────────────────
    const hostname = (() => {
      try {
        return new URL(analysis.url).hostname;
      } catch {
        return analysis.url;
      }
    })();

    // Aggregate accessibility metrics
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
        ? pages.reduce(
            (s, p) => s + (p.accessibility?.landmarkCount ?? 0),
            0,
          ) / pages.length
        : 0;

    // Performance metrics
    const perfPages = pages
      .map((p) => p.performance as { ttfbMs?: number; loadEventMs?: number } | null)
      .filter(Boolean);
    const avgTtfbMs =
      perfPages.length > 0
        ? Math.round(
            perfPages.reduce((s, p) => s + (p?.ttfbMs ?? 0), 0) /
              perfPages.length,
          )
        : null;
    const avgLoadMs =
      perfPages.length > 0
        ? Math.round(
            perfPages.reduce((s, p) => s + (p?.loadEventMs ?? 0), 0) /
              perfPages.length,
          )
        : null;
    const slowPages = pages
      .filter(
        (p) =>
          ((p.performance as { loadEventMs?: number } | null)?.loadEventMs ??
            0) > 3000,
      )
      .map((p) => p.url);

    // Navigation
    const allNavLabels = pages.flatMap(
      (p) =>
        ((p.navStructure as { navLabels?: string[] } | null)?.navLabels ?? []),
    );
    const navLabels = [...new Set(allNavLabels)].slice(0, 20);

    const allCtaLabels = pages.flatMap((p) => p.ctaTexts ?? []);
    const uniqueCtaLabels = [...new Set(allCtaLabels)].slice(0, 20);

    const primaryActionLabels = pages
      .map((p) => p.primaryActionLabel)
      .filter((l): l is string => Boolean(l));

    // Trust signals from URLs
    const allUrls = pages.map((p) => p.url.toLowerCase());
    const hasPricingPage = allUrls.some(
      (u) => u.includes("pric") || u.includes("plan"),
    );
    const hasContactPage = allUrls.some(
      (u) =>
        u.includes("contact") ||
        u.includes("support") ||
        u.includes("help"),
    );
    const hasDocsPage = allUrls.some(
      (u) =>
        u.includes("doc") || u.includes("api") || u.includes("developer"),
    );

    // Vision summaries
    const visionSummaries = storedPages
      .map((sp) => {
        const vm = sp.visionMeta;
        if (!vm) return null;
        return [
          `Page: ${sp.rawPage.title ?? sp.url}`,
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

    // Per-page evidence
    const pageEvidence = pages.map((p) => ({
      url: p.url,
      title: p.title,
      pageType: p.pageType,
      buttonsCount: p.buttonsCount,
      formsCount: p.formsCount,
      linksCount: p.linksCount,
      wordCount: p.wordCount,
      interactionCount: p.interactionCount,
      frictionScore:
        storedPages.find((sp) => sp.url === p.url)?.frictionScore ?? 20,
      hasH1: p.accessibility?.hasH1 ?? false,
      primaryActionLabel: p.primaryActionLabel,
      ctaTexts: p.ctaTexts ?? [],
      headingStructure: p.headingStructure ?? [],
    }));

    const totalWords = pages.reduce((s, p) => s + (p.wordCount ?? 0), 0);
    const avgWordCount =
      pages.length > 0 ? Math.round(totalWords / pages.length) : 0;

    const siteContext: SiteContext = {
      url: analysis.url,
      hostname,
      pageCount: pages.length,
      deviceType: analysis.deviceType,
      totalButtons: pages.reduce((s, p) => s + p.buttonsCount, 0),
      totalForms: pages.reduce((s, p) => s + p.formsCount, 0),
      totalLinks: pages.reduce((s, p) => s + p.linksCount, 0),
      totalInputs: pages.reduce((s, p) => s + (p.inputCount ?? 0), 0),
      totalWords,
      avgWordCount,
      maxDepth: Math.max(...pages.map((p) => p.depth), 0),
      totalInteractions: pages.reduce(
        (s, p) => s + (p.interactionCount ?? 0),
        0,
      ),
      totalImagesWithoutAlt,
      totalImages,
      totalInputsWithoutLabel,
      pagesWithH1,
      pagesWithoutH1: pages.length - pagesWithH1,
      totalButtonsWithoutLabel,
      avgLandmarkCount,
      avgTtfbMs,
      avgLoadMs,
      slowPages,
      navLabels,
      uniqueCtaLabels,
      primaryActionLabels,
      pageTypes: [...new Set(pages.map((p) => p.pageType))],
      hasPricingPage,
      hasContactPage,
      hasDocsPage,
      pageEvidence,
      visionSummaries,
      contentSample: pages[0]?.content?.slice(0, 1500) ?? "",
    };

    // ── Phase 3: Build persona contexts ───────────────────────────────────────
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
        const metadata = p.metadata as Record<string, string> | null;
        return {
          id: p.id,
          label: p.label,
          name: p.name,
          age: p.age,
          occupation: p.occupation,
          technicalLevel: p.technicalLevel,
          goals: p.goals,
          frustrations: p.frustrations,
          // Inject enriched behavioural profile
          digitalLiteracy: metadata?.digitalLiteracy,
          browsingHabits: metadata?.browsingHabits,
          decisionCriteria: metadata?.decisionCriteria,
          personality: metadata?.personality,
          trustTriggers: metadata?.trustTriggers,
          dealBreakers: metadata?.dealBreakers,
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

    // ── Phase 4: Parallel persona evaluations ─────────────────────────────────
    const evaluations = await runParallelEvaluations(
      allPersonaContexts,
      siteContext,
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
              (ev.accessibilityFindings as unknown as Prisma.InputJsonValue) ?? null,
            accessibilityNotes: ev.accessibilityNotes ?? null,
            // Legacy string columns (backwards compat)
            positives: JSON.stringify(
              (ev.positives ?? []).map((p) =>
                typeof p === "string" ? p : p.finding,
              ),
            ),
            painPoints: JSON.stringify(
              (ev.painPoints ?? []).map((p) =>
                typeof p === "string"
                  ? p
                  : (p as StructuredPainPoint).issue,
              ),
            ),
            recommendations: JSON.stringify(
              (ev.recommendations ?? []).map((r) =>
                typeof r === "string" ? r : r.improvement ?? r.issue,
              ),
            ),
            evidence: (ev.evidence ?? []) as Prisma.InputJsonValue,
            rawModelOutput: ev as unknown as Prisma.InputJsonValue,
          },
        });
      }),
    );

    // ── Phase 5: Focus group ──────────────────────────────────────────────────
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
          (focusGroupResult.discussion as unknown as Prisma.InputJsonValue) ?? null,
        consensus:
          (focusGroupResult.consensus as unknown as Prisma.InputJsonValue) ?? null,
        openQuestions:
          (focusGroupResult.openQuestions as unknown as Prisma.InputJsonValue) ?? null,
        agreementMatrix:
          (focusGroupResult.personaAgreementMatrix as unknown as Prisma.InputJsonValue) ??
          null,
        conflicts: focusGroupResult.conflicts as unknown as Prisma.InputJsonValue,
      },
    });

    // ── Phase 6: Quality gate ─────────────────────────────────────────────────
    const qualityGateResult = runQualityGate(evaluationsWithLabels, { pageCount: pages.length });
    if (!qualityGateResult.passed) {
      console.warn(`[crawl-complete] Quality gate FAILED for ${analysisId}:`, qualityGateResult.failures);
    }

    // ── Phase 7: Build CrawlCoverage + CrawlerStats ───────────────────────────
    // Derive coverage from payload (total URLs discovered tracked via linksCount heuristic)
    const estimatedTotalUrls = Math.max(
      pages.length,
      pages.reduce((s, p) => s + Math.min(p.linksCount, 50), 0),
    );
    const avgDepth = pages.length > 0
      ? pages.reduce((s, p) => s + p.depth, 0) / pages.length
      : 0;
    const coveragePercent = Math.min(100, Math.round((pages.length / Math.max(estimatedTotalUrls, 1)) * 100));
    const crawlCoverage: CrawlCoverage = {
      pagesCrawled: pages.length,
      pagesDiscovered: estimatedTotalUrls,
      pagesBlocked: 0,
      pagesSkipped: Math.max(0, estimatedTotalUrls - pages.length),
      avgDepth: Math.round(avgDepth * 10) / 10,
      maxDepthReached: Math.max(...pages.map((p) => p.depth), 0),
      coverageConfidence: pages.length >= 10 ? "High" : pages.length >= 4 ? "Medium" : "Low",
      coveragePercent,
      coverageNote: pages.length === 1
        ? `1 page analyzed. Recommendations may change after additional crawling.`
        : `${pages.length} pages analyzed (~${coveragePercent}% estimated coverage).`,
    };

    const totalWordsAll = pages.reduce((s, p) => s + (p.wordCount ?? 0), 0);
    const crawlerStats = {
      totalPages: pages.length,
      totalForms: pages.reduce((s, p) => s + p.formsCount, 0),
      totalButtons: pages.reduce((s, p) => s + p.buttonsCount, 0),
      totalImages: pages.reduce((s, p) => s + (p.accessibility?.totalImages ?? 0), 0),
      totalLinks: pages.reduce((s, p) => s + p.linksCount, 0),
      totalInputs: pages.reduce((s, p) => s + (p.inputCount ?? 0), 0),
      totalHeadings: pages.reduce((s, p) => s + (p.accessibility?.headingCount ?? 0), 0),
      totalWords: totalWordsAll,
      avgWordCount: pages.length > 0 ? Math.round(totalWordsAll / pages.length) : 0,
      avgDomDepth: Math.round(avgDepth * 10) / 10,
      largestPageUrl: pages.length > 0
        ? pages.reduce((best, p) => (p.wordCount ?? 0) > (best.wordCount ?? 0) ? p : best).url
        : null,
      largestPageWords: pages.length > 0
        ? Math.max(...pages.map((p) => p.wordCount ?? 0))
        : 0,
      fastestPageUrl: (() => {
        const perf = pages.filter((p) => (p.performance as { loadEventMs?: number } | null)?.loadEventMs != null);
        return perf.length > 0 ? perf.reduce((best, p) => {
          const bLoad = (best.performance as { loadEventMs?: number } | null)?.loadEventMs ?? Infinity;
          const pLoad = (p.performance as { loadEventMs?: number } | null)?.loadEventMs ?? Infinity;
          return pLoad < bLoad ? p : best;
        }).url : null;
      })(),
      fastestPageMs: (() => {
        const vals = pages.map((p) => (p.performance as { loadEventMs?: number } | null)?.loadEventMs).filter((v): v is number => v != null);
        return vals.length > 0 ? Math.min(...vals) : null;
      })(),
      slowestPageUrl: (() => {
        const perf = pages.filter((p) => (p.performance as { loadEventMs?: number } | null)?.loadEventMs != null);
        return perf.length > 0 ? perf.reduce((best, p) => {
          const bLoad = (best.performance as { loadEventMs?: number } | null)?.loadEventMs ?? 0;
          const pLoad = (p.performance as { loadEventMs?: number } | null)?.loadEventMs ?? 0;
          return pLoad > bLoad ? p : best;
        }).url : null;
      })(),
      slowestPageMs: (() => {
        const vals = pages.map((p) => (p.performance as { loadEventMs?: number } | null)?.loadEventMs).filter((v): v is number => v != null);
        return vals.length > 0 ? Math.max(...vals) : null;
      })(),
      skippedUrls: [],
      blockedUrls: [],
      redirectCount: 0,
      brokenLinkCount: 0,
      avgTtfbMs: avgTtfbMs,
      avgLoadMs: avgLoadMs,
    };

    // ── Phase 8: Aggregate + executive scorecard ──────────────────────────────
    const insights = aggregateInsights(evaluationsWithLabels, {
      crawlCoverage,
      pageCount: pages.length,
      siteContext: { hasPricingPage, hasContactPage, hasDocsPage, pageTypes: [...new Set(pages.map((p) => p.pageType))] },
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
        // New fields — now persisted to dedicated columns (migration applied)
        crawlCoverage: crawlCoverage as unknown as Prisma.InputJsonValue,
        analysisReliability: insights.analysisReliability as unknown as Prisma.InputJsonValue,
        crawlerStats: crawlerStats as unknown as Prisma.InputJsonValue,
        researchGaps: (insights.researchGaps ?? []) as unknown as Prisma.InputJsonValue,
        meta: {
          ...insights,
          qualityGate: qualityGateResult,
          crawlerEvents: events ?? [],
          crawlMeta: meta ?? null,
        } as unknown as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[crawl-complete] Pipeline error:", err);
    await db.analysis
      .update({
        where: { id: analysisId },
        data: { status: "FAILED", error: String(err).slice(0, 500) },
      })
      .catch(console.error);

    return NextResponse.json({ error: "Pipeline failed" }, { status: 500 });
  }
}
