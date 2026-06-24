import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { analyzeScreenshot } from "@/lib/services/vision";
import { runParallelEvaluations } from "@/lib/services/persona-engine";
import { runFocusGroup } from "@/lib/services/focus-group";
import { aggregateInsights } from "@/lib/services/aggregator";
import type { PersonaContext, PersonaEvaluationWithLabel } from "@/lib/types";

export const maxDuration = 300; // Vercel Pro: 5 min for AI pipeline

export async function POST(req: Request) {
  const headersList = await headers();
  if (headersList.get("x-internal-secret") !== process.env.INTERNAL_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { analysisId, result } = (await req.json()) as {
    analysisId: string;
    result: {
      pages: Array<{
        url: string;
        depth: number;
        title: string;
        content: string;
        metrics: {
          formsCount: number;
          buttonsCount: number;
          linksCount: number;
          textLength: number;
          hasAuthForm: boolean;
          primaryActionLabel: string | null;
          navStructure: Array<{ text: string | undefined; href: string }>;
        };
        links: string[];
        screenshots: Array<{ cdnUrl: string; type: "FULL_PAGE" | "VIEWPORT" }>;
      }>;
    };
  };

  try {
    const analysis = await db.analysis.findUnique({
      where: { id: analysisId },
    });
    if (!analysis)
      return NextResponse.json(
        { error: "Analysis not found" },
        { status: 404 },
      );

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

    await db.analysis.update({
      where: { id: analysisId },
      data: { status: "ANALYZING" },
    });

    // Store pages + run vision analysis
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
            navStructure: p.metrics.navStructure,
          },
        });

        await db.screenshot.createMany({
          data: p.screenshots.map((s) => ({
            pageId: page.id,
            cdnUrl: s.cdnUrl,
            type: s.type,
          })),
        });

        // Vision on viewport screenshot
        const vpUrl = p.screenshots.find((s) => s.type === "VIEWPORT")?.cdnUrl;
        let visionMeta = null;
        if (vpUrl) {
          try {
            visionMeta = await analyzeScreenshot(vpUrl, p.title ?? p.url);
            await db.page.update({
              where: { id: page.id },
              data: { visionMeta: visionMeta as unknown as Prisma.InputJsonValue },
            });
          } catch (e) {
            console.warn("[vision]", e);
          }
        }

        return { ...page, visionMeta };
      }),
    );

    // Build persona contexts
    const prebuiltPersonas = personaMeta.personaIds?.length
      ? await db.persona.findMany({
          where: { id: { in: personaMeta.personaIds } },
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

    // Parallel persona evaluations
    const evaluations = await runParallelEvaluations(
      allPersonaContexts,
      siteContext,
    );

    for (let i = 0; i < allPersonaContexts.length; i++) {
      const ctx = allPersonaContexts[i];
      const ev = evaluations[i];
      await db.analysisPersona.create({
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
          firstImpressions: ev.firstImpressions,
          positives: JSON.stringify(ev.positives),
          painPoints: JSON.stringify(ev.painPoints),
          recommendations: JSON.stringify(ev.recommendations),
          accessibilityNotes: ev.accessibilityNotes,
          adoptionLikelihood: ev.adoptionLikelihood,
          sentiment: ev.sentiment,
          frictionScore: ev.frictionScore,
          evidence: ev.evidence ?? [],
          rawModelOutput: ev as unknown as Prisma.InputJsonValue,
        },
      });
    }

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
        conflicts: focusGroupResult.conflicts,
      },
    });

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
    console.error("[crawl-complete]:", err);
    await db.analysis.update({
      where: { id: analysisId },
      data: { status: "FAILED", error: String(err) },
    });
    return NextResponse.json({ error: "Pipeline failed" }, { status: 500 });
  }
}
