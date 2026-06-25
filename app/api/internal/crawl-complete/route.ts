import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { analyzeScreenshot } from "@/lib/services/vision";
import { runParallelEvaluations } from "@/lib/services/persona-engine";
import { runFocusGroup } from "@/lib/services/focus-group";
import { aggregateInsights } from "@/lib/services/aggregator";
import { CrawlCompletePayloadSchema } from "@/lib/validation/schemas";
import { Limits } from "@/lib/rate-limit";
import type {
  PersonaContext,
  PersonaEvaluationWithLabel,
  VisionAnalysis,
} from "@/lib/types";

export const maxDuration = 300;

export async function POST(req: Request) {
  // ── Auth: validate internal secret ─────────────────────────────────────────
  const headersList = await headers();
  const secret = headersList.get("x-internal-secret");

  if (!process.env.INTERNAL_SECRET || secret !== process.env.INTERNAL_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Parse + validate payload ────────────────────────────────────────────────
  const raw = await req.json().catch(() => null);
  if (!raw) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = CrawlCompletePayloadSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { analysisId, result } = parsed.data;

  // ── Idempotency guard ───────────────────────────────────────────────────────
  const rl = Limits.internalCrawlComplete(analysisId);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many retries for this analysis" },
      { status: 429 },
    );
  }

  const analysis = await db.analysis.findUnique({
    where: { id: analysisId },
    select: { id: true, status: true, url: true, meta: true },
  });

  if (!analysis) {
    return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
  }

  // Already processed — return 200 so the crawler doesn't retry
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
      data: { status: "ANALYZING" },
    });

    // ── Phase 1: Store pages and run vision in parallel ─────────────────────
    const storedPages = await Promise.all(
      result.pages.map(async (p) => {
        const page = await db.page.create({
          data: {
            analysisId,
            url: p.url,
            title: p.title,
            depth: p.depth,
            content: p.content.slice(0, 8000),
            formsCount: p.metrics.formsCount,
            buttonsCount: p.metrics.buttonsCount,
            linksCount: p.metrics.linksCount,
            textLength: p.metrics.textLength,
            hasAuthForm: p.metrics.hasAuthForm,
            primaryActionLabel: p.metrics.primaryActionLabel,
            navStructure: p.metrics.navStructure as Prisma.InputJsonValue,
          },
        });

        await db.screenshot.createMany({
          data: p.screenshots.map((s) => ({
            pageId: page.id,
            cdnUrl: s.cdnUrl,
            type: s.type,
          })),
        });

        const vpUrl = p.screenshots.find((s) => s.type === "VIEWPORT")?.cdnUrl;

        // ✅ Fix: type as VisionAnalysis | null — cast to InputJsonValue only at DB write
        let visionMeta: VisionAnalysis | null = null;

        if (vpUrl) {
          try {
            visionMeta = await analyzeScreenshot(vpUrl, p.title ?? p.url);
            await db.page.update({
              where: { id: page.id },
              data: {
                visionMeta: visionMeta as unknown as Prisma.InputJsonValue,
              },
            });
          } catch (visionErr) {
            // Vision failure is non-fatal — log and continue
            console.warn(
              `[crawl-complete] Vision failed for ${p.url}:`,
              (visionErr as Error).message,
            );
          }
        }

        return { ...page, visionMeta };
      }),
    );

    // ── Phase 2: Build persona contexts ─────────────────────────────────────
    const personaMeta = analysis.meta as {
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
      ...prebuiltPersonas.map((p) => ({
        id: p.id,
        label: p.label,
        name: p.name,
        age: p.age,
        occupation: p.occupation,
        technicalLevel: p.technicalLevel,
        goals: p.goals,
        frustrations: p.frustrations,
      })),
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

    const siteContext = {
      url: analysis.url,
      pageCount: storedPages.length,
      formsCount: result.pages.reduce((s, p) => s + p.metrics.formsCount, 0),
      buttonsCount: result.pages.reduce(
        (s, p) => s + p.metrics.buttonsCount,
        0,
      ),
      navDepth: Math.max(...result.pages.map((p) => p.depth), 0),
      visionSummary: JSON.stringify(storedPages[0]?.visionMeta ?? "N/A").slice(
        0,
        800,
      ),
      contentSample: result.pages[0]?.content?.slice(0, 2000) ?? "",
    };

    // ── Phase 3: Parallel persona evaluations (allSettled — never fails) ─────
    const evaluations = await runParallelEvaluations(
      allPersonaContexts,
      siteContext,
    );

    // Write persona records in parallel
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
            positives: JSON.stringify(ev.positives ?? []),
            painPoints: JSON.stringify(ev.painPoints ?? []),
            recommendations: JSON.stringify(ev.recommendations ?? []),
            accessibilityNotes: ev.accessibilityNotes ?? null,
            adoptionLikelihood: ev.adoptionLikelihood ?? null,
            sentiment: ev.sentiment ?? null,
            frictionScore: ev.frictionScore ?? null,
            evidence: (ev.evidence ?? []) as Prisma.InputJsonValue,
            rawModelOutput: ev as unknown as Prisma.InputJsonValue,
          },
        });
      }),
    );

    // ── Phase 4: Focus group ─────────────────────────────────────────────────
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
        conflicts: focusGroupResult.conflicts as Prisma.InputJsonValue,
      },
    });

    // ── Phase 5: Aggregate + mark complete ───────────────────────────────────
    const insights = aggregateInsights(evaluationsWithLabels);

    await db.analysis.update({
      where: { id: analysisId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        overallSentiment: insights.overallSentiment,
        overallFrictionScore: insights.overallFrictionScore,
        meta: insights as unknown as Prisma.InputJsonValue,
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
