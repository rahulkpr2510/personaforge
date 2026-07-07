import Groq from "groq-sdk";
import type {
  PersonaEvaluation,
  PersonaContext,
  SiteContext,
  StructuredPainPoint,
  StructuredRecommendation,
  StructuredPositive,
  UxCategoryScores,
} from "../types";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

// ─── Persona Vocabulary Profiles ─────────────────────────────────────────────

const PERSONA_VOCABULARY: Record<
  string,
  { allowed: string[]; forbidden: string[] }
> = {
  student: {
    allowed: [
      "simple", "easy", "confusing", "expensive", "free", "fast", "clear",
      "overwhelming", "helpful", "frustrating", "understand", "figure out",
      "affordable", "time", "quick", "lost", "trust", "obvious",
    ],
    forbidden: [
      "enterprise", "ROI", "stakeholder", "procurement", "SLA", "API surface",
      "developer experience", "activation funnel", "market positioning",
      "conversion rate", "retention metric", "lighthouse score",
    ],
  },
  developer: {
    allowed: [
      "rendering", "responsiveness", "performance", "accessibility", "API",
      "documentation", "error handling", "feedback loop", "keyboard", "focus",
      "semantic", "ARIA", "WCAG", "load time", "interaction", "architecture",
      "developer experience", "lighthouse", "Core Web Vitals",
    ],
    forbidden: [
      "super easy", "super simple", "feels great", "love the vibe", "intuitive",
      "branding", "market fit",
    ],
  },
  pm: {
    allowed: [
      "adoption", "activation", "conversion", "retention", "market fit", "trust",
      "competitive positioning", "business value", "feature communication",
      "funnel", "drop-off", "onboarding", "time-to-value", "ROI",
      "customer success", "churn risk",
    ],
    forbidden: [
      "lighthouse score", "ARIA", "WCAG", "tabindex", "semantic HTML",
      "rendering pipeline", "DOM depth", "CSS cascade",
    ],
  },
};

function getVocabularyRules(persona: PersonaContext): string {
  const label = persona.label.toLowerCase();
  let profile = null;

  if (label.includes("student") || label.includes("learner")) {
    profile = PERSONA_VOCABULARY.student;
  } else if (
    label.includes("developer") ||
    label.includes("engineer") ||
    label.includes("dev")
  ) {
    profile = PERSONA_VOCABULARY.developer;
  } else if (
    label.includes("product manager") ||
    label.includes("pm ") ||
    label.includes(" pm") ||
    label.includes("manager")
  ) {
    profile = PERSONA_VOCABULARY.pm;
  }

  if (!profile) return "";

  return `
PERSONA VOCABULARY RULES (ENFORCE STRICTLY):
Your voice MUST reflect ${persona.label}'s background. 
✓ Use language like: ${profile.allowed.slice(0, 8).join(", ")}
✗ NEVER use: ${profile.forbidden.slice(0, 6).join(", ")}
If you use any forbidden terms, the report is INVALID.`;
}

// ─── Prompt Builder ──────────────────────────────────────────────────────────

function buildPrompt(persona: PersonaContext, ctx: SiteContext): string {
  const safe = (v: unknown, max = 500) =>
    String(v ?? "")
      .replace(/[`{}\\]/g, "")
      .slice(0, max);

  const meta = persona as PersonaContext & Record<string, unknown>;

  const slowPagesSummary =
    ctx.slowPages.length > 0
      ? `Slow pages (>3s load time): ${ctx.slowPages.slice(0, 3).join(", ")}`
      : "No slow pages detected within analyzed set";

  const perfSummary =
    ctx.avgTtfbMs != null
      ? `Avg TTFB: ${ctx.avgTtfbMs}ms | Avg page load: ${ctx.avgLoadMs}ms`
      : "Performance timing data unavailable";

  const pageBreakdown = ctx.pageEvidence
    .map(
      (p) =>
        `  • [${p.pageType}] "${p.title ?? p.url}": ${p.buttonsCount} btns, ${p.formsCount} forms, ${p.wordCount} words, friction=${p.frictionScore}/100` +
        (p.primaryActionLabel ? `, primary-CTA="${p.primaryActionLabel}"` : "") +
        (p.ctaTexts.length > 0
          ? `, all-CTAs=[${p.ctaTexts.slice(0, 5).join(", ")}]`
          : "") +
        (p.headingStructure.length > 0
          ? `, headings=[${p.headingStructure.slice(0, 3).join(" | ")}]`
          : ""),
    )
    .join("\n");

  const visionBlock =
    ctx.visionSummaries.length > 0
      ? ctx.visionSummaries.slice(0, 3).join("\n---\n")
      : "No visual analysis available";

  // Coverage context — critical for preventing "does not exist" hallucinations
  const coverageContext = ctx.crawlCoverage
    ? `CRAWL COVERAGE (CRITICAL — READ BEFORE EVERY FINDING):
• Pages analyzed: ${ctx.crawlCoverage.pagesCrawled} of ~${ctx.crawlCoverage.pagesDiscovered} discovered URLs
• Pages skipped: ${ctx.crawlCoverage.pagesSkipped} (depth/page limit reached)
• Pages blocked: ${ctx.crawlCoverage.pagesBlocked}
• Coverage confidence: ${ctx.crawlCoverage.coverageConfidence}
• Coverage note: ${ctx.crawlCoverage.coverageNote}

This means: features present on uncrawled pages CANNOT be reported as absent.`
    : `CRAWL COVERAGE:
• Pages analyzed: ${ctx.pageCount}
• Additional pages may exist but were not crawled
• This means: features not encountered on these ${ctx.pageCount} pages may exist elsewhere.`;

  // Extended accessibility context
  const a11yExtended =
    ctx.pagesWithSkipLink != null
      ? `• Pages with skip navigation link: ${ctx.pagesWithSkipLink} / ${ctx.pageCount}
• Pages with lang attribute: ${ctx.pagesWithLangAttr ?? "unknown"} / ${ctx.pageCount}
• Pages with visible focus styles: ${ctx.pagesWithFocusStyles ?? "unknown"} / ${ctx.pageCount}
• Pages with ARIA landmarks: ${ctx.pagesWithAriaLandmarks ?? "unknown"} / ${ctx.pageCount}
• Total aria-label attributes: ${ctx.totalAriaLabels ?? "unknown"}`
      : "";

  const vocabRules = getVocabularyRules(persona);

  return `You are conducting a rigorous, evidence-based UX evaluation as a synthetic user persona for an enterprise research report.

══════════════════════════════════════════════════════════════════
PERSONA PROFILE
══════════════════════════════════════════════════════════════════
Name: ${safe(persona.name, 80)} | Age: ${safe(persona.age, 3)} | Label: ${safe(persona.label, 60)}
Occupation: ${safe(persona.occupation, 120)}
Technical Level: ${safe(persona.technicalLevel, 10)}
Goals: ${safe(persona.goals, 400)}
Frustrations: ${safe(persona.frustrations, 400)}
${meta.personality ? `Personality & Voice: ${safe(meta.personality, 300)}` : ""}
${meta.digitalLiteracy ? `Digital Literacy: ${safe(meta.digitalLiteracy, 300)}` : ""}
${meta.browsingHabits ? `Browsing Habits: ${safe(meta.browsingHabits, 300)}` : ""}
${meta.decisionCriteria ? `Decision Criteria: ${safe(meta.decisionCriteria, 300)}` : ""}
${meta.trustTriggers ? `Trust Triggers: ${safe(meta.trustTriggers, 300)}` : ""}
${meta.dealBreakers ? `Deal Breakers: ${safe(meta.dealBreakers, 300)}` : ""}
${vocabRules}

══════════════════════════════════════════════════════════════════
CRAWL EVIDENCE — ${ctx.pageCount} pages analyzed on ${ctx.deviceType}
══════════════════════════════════════════════════════════════════
Site URL: ${safe(ctx.url, 2048)}
Hostname: ${safe(ctx.hostname, 200)}

${coverageContext}

AGGREGATED INTERACTION METRICS (across all ${ctx.pageCount} pages):
• Total interactive buttons: ${ctx.totalButtons} (avg: ${Math.round(ctx.totalButtons / Math.max(ctx.pageCount, 1))} per page)
• Total forms: ${ctx.totalForms}
• Total links: ${ctx.totalLinks}
• Total input fields: ${ctx.totalInputs}
• Total words: ${ctx.totalWords} (avg ${ctx.avgWordCount} per page)
• Navigation depth: ${ctx.maxDepth} levels deep
• Detected nav labels: ${ctx.navLabels.slice(0, 12).join(", ") || "none"}
• Detected CTAs: ${ctx.uniqueCtaLabels.slice(0, 10).join(", ") || "none"}
• Primary actions: ${ctx.primaryActionLabels.filter(Boolean).slice(0, 5).join(", ") || "none"}

ACCESSIBILITY EVIDENCE (directly observed):
• Images without alt text: ${ctx.totalImagesWithoutAlt} / ${ctx.totalImages} total images
• Input fields without labels: ${ctx.totalInputsWithoutLabel}
• Buttons without accessible labels: ${ctx.totalButtonsWithoutLabel}
• Pages with H1: ${ctx.pagesWithH1} / ${ctx.pageCount}
• Pages missing H1: ${ctx.pagesWithoutH1}
• Average landmark count: ${ctx.avgLandmarkCount.toFixed(1)} per page
${a11yExtended}

PERFORMANCE EVIDENCE:
• ${perfSummary}
• ${slowPagesSummary}

TRUST & CONTENT SIGNALS:
• Pricing page detected: ${ctx.hasPricingPage ? "YES — on analyzed pages" : "NOT DETECTED on analyzed pages (may exist on uncrawled pages)"}
• Contact/support page detected: ${ctx.hasContactPage ? "YES — on analyzed pages" : "NOT DETECTED on analyzed pages"}
• Documentation page detected: ${ctx.hasDocsPage ? "YES — on analyzed pages" : "NOT DETECTED on analyzed pages"}
• Page types encountered: ${ctx.pageTypes.join(", ")}

PER-PAGE BREAKDOWN:
${pageBreakdown}

VISUAL ANALYSIS:
${visionBlock}

CONTENT SAMPLE (first page):
${safe(ctx.contentSample, 1500)}

══════════════════════════════════════════════════════════════════
EVALUATION INSTRUCTIONS
══════════════════════════════════════════════════════════════════

You ARE ${safe(persona.name, 80)}, a ${safe(persona.age, 3)}-year-old ${safe(persona.occupation, 100)}.
Evaluate this website as you would actually experience it, in your authentic voice.

CRITICAL RULES — VIOLATING ANY OF THESE INVALIDATES THE REPORT:

1. NEVER CONFUSE "NOT OBSERVED" WITH "DOES NOT EXIST":
   ✓ CORRECT: "Pricing information was not encountered on the ${ctx.pageCount} analyzed pages"
   ✓ CORRECT: "API documentation was not detected within the crawled pages"
   ✗ WRONG: "There is no pricing page" or "The site lacks documentation"
   ✗ WRONG: "The website doesn't have X" (use "X was not found on analyzed pages")
   This rule applies to EVERY finding. Absolute absence claims are FORBIDDEN.

2. SCOPED LANGUAGE REQUIRED for all findings about absent features:
   ✓ "Within the ${ctx.pageCount} analyzed pages..."
   ✓ "The crawler did not detect..."
   ✓ "Among the pages visited..."
   ✗ Never make absolute claims about the entire site

3. EVIDENCE LEVELS — assign ONE of these to every finding:
   OBSERVED: Verified directly from crawl data (e.g., button count, form count)
   MEASURED: Calculated from numeric metrics (e.g., avg word count, friction score)
   INFERRED: Reasonable conclusion from multiple data points (evidence, but not direct proof)
   SPECULATIVE: Low confidence assumption or extrapolation
   HIGH CONFIDENCE (≥80) is ONLY valid for OBSERVED or MEASURED findings.
   INFERRED findings must have confidence 50-79.
   SPECULATIVE findings must have confidence ≤49.

4. PERSONA AUTHENTICITY: Sound exactly like ${safe(persona.name, 80)}.
   You care about: ${safe(persona.goals, 200)}
   You hate: ${safe(persona.frustrations, 200)}
   ${meta.personality ? `Your voice: ${safe(meta.personality, 200)}` : ""}
   Different personas MUST produce meaningfully different reports.

5. SITE TYPE AWARENESS: Suppress irrelevant recommendations.
   Page types seen: ${ctx.pageTypes.join(", ")}
   Don't recommend API docs to a portfolio site. Don't recommend developer tooling to e-commerce.

6. CONFIDENCE CALIBRATION:
   - HIGH (80–100): OBSERVED or MEASURED — direct crawl data
   - MEDIUM (50–79): INFERRED — reasonable from evidence
   - LOW (20–49): SPECULATIVE — assumption or weak signal
   Every confidence score needs a one-line reason.

7. ZERO HALLUCINATION: Before every finding, ask:
   "Can this be traced to the crawl evidence above?"
   If NO → omit entirely.

8. SPECIFICITY: Name the exact metric.
   ✓ "The ${ctx.totalButtons} buttons across ${ctx.pageCount} pages include competing CTAs"
   ✗ "Improve the call-to-action"

9. ADOPTION REASONING: Calculate as YOU, ${safe(persona.name, 80)}, based on:
   - How well this site meets YOUR goals: ${safe(persona.goals, 200)}
   - How many of YOUR frustrations it triggers: ${safe(persona.frustrations, 200)}
   ${meta.dealBreakers ? `- Your deal breakers: ${safe(meta.dealBreakers, 200)}` : ""}
   Personas MUST have different adoption scores (variance ≥10 points expected).

SELF-VALIDATION CHECKLIST (complete before generating JSON):
□ Does every pain point cite a specific metric from the crawl evidence?
□ Does every recommendation name the specific detected issue?
□ Did I use scoped language ("not detected on analyzed pages") for all absent features?
□ Does the adoption reasoning reference both MY goals and the site's evidence?
□ Does the evaluation sound like ${safe(persona.name, 80)}, or like a generic AI?
□ Is every confidence score matched to the correct evidenceLevel?
□ Are there any absolute "does not exist" statements? → Replace all with scoped language.

Respond ONLY with valid JSON, no markdown, no explanation:
{
  "firstImpressions": "2-3 sentences gut reaction in ${safe(persona.name, 80)}'s authentic voice",
  "personaVoice": "One sentence how ${safe(persona.name, 80)} would describe this site to a colleague or friend",
  "uxCategoryScores": {
    "navigation": { "score": <0-100>, "reason": "<evidence-grounded 1 sentence citing crawl data>", "confidence": <0-100> },
    "accessibility": { "score": <0-100>, "reason": "<cites specific accessibility metrics>", "confidence": <0-100> },
    "contentClarity": { "score": <0-100>, "reason": "<cites word count, heading structure, content sample>", "confidence": <0-100> },
    "visualHierarchy": { "score": <0-100>, "reason": "<cites visual analysis or element density>", "confidence": <0-100> },
    "trustSignals": { "score": <0-100>, "reason": "<cites trust signal detections — scope to analyzed pages>", "confidence": <0-100> },
    "interactionQuality": { "score": <0-100>, "reason": "<cites button/form counts and CTA labels>", "confidence": <0-100> },
    "conversionClarity": { "score": <0-100>, "reason": "<cites primary action labels and CTA diversity>", "confidence": <0-100> },
    "performanceIndicators": { "score": <0-100>, "reason": "<cites TTFB, load times, or notes unavailability>", "confidence": <0-100> },
    "consistency": { "score": <0-100>, "reason": "<cites cross-page patterns from per-page breakdown>", "confidence": <0-100> },
    "errorPrevention": { "score": <0-100>, "reason": "<cites form labels, input count, error handling evidence>", "confidence": <0-100> }
  },
  "overallUxScore": <weighted integer average of above scores>,
  "positives": [
    { "finding": "specific positive observation", "evidence": "exact crawl metric or data point", "confidence": <0-100>, "evidenceLevel": "OBSERVED|MEASURED|INFERRED|SPECULATIVE" }
  ],
  "painPoints": [
    {
      "issue": "specific problem",
      "evidence": "exact crawl metric: e.g. '${ctx.totalImagesWithoutAlt} of ${ctx.totalImages} images lack alt text across ${ctx.pageCount} pages'",
      "severity": "Low|Medium|High|Critical",
      "confidence": <0-100>,
      "confidenceReason": "directly observed|inferred from multiple data points|weak signal",
      "evidenceLevel": "OBSERVED|MEASURED|INFERRED|SPECULATIVE",
      "affectedPages": ["url1", "url2"],
      "recommendation": "specific actionable fix referencing the evidence"
    }
  ],
  "recommendations": [
    {
      "issue": "detected problem from crawl data",
      "evidence": "specific crawl metric proving the problem",
      "reasoning": "why this matters specifically for ${safe(persona.label, 60)}",
      "improvement": "specific change to make",
      "expectedImpact": "measurable expected outcome for this persona",
      "businessImpact": "business-level consequence of this fix",
      "confidence": <0-100>,
      "evidenceLevel": "OBSERVED|MEASURED|INFERRED|SPECULATIVE"
    }
  ],
  "accessibilityNotes": "overview grounded in the accessibility metrics above — use scoped language",
  "accessibilityFindings": [
    { "finding": "specific accessibility observation", "evidence": "specific metric from crawl data", "severity": "Low|Medium|High|Critical", "evidenceLevel": "OBSERVED|MEASURED|INFERRED|SPECULATIVE" }
  ],
  "adoptionLikelihood": <0-100>,
  "adoptionReasoning": "explain this specific score referencing my goals, frustrations, deal-breakers, and the site's evidence",
  "sentiment": "POSITIVE|NEUTRAL|NEGATIVE",
  "frictionScore": <0-100 where 0=frictionless, 100=extremely frustrating>,
  "evidence": [
    { "issue": "finding", "confidence": <0-100>, "reason": "why this confidence level", "evidenceLevel": "OBSERVED|MEASURED|INFERRED|SPECULATIVE", "support": { "metricName": "value" } }
  ]
}`;
}

// ─── Fallback ────────────────────────────────────────────────────────────────

const FALLBACK_EVALUATION: PersonaEvaluation = {
  sentiment: "NEUTRAL",
  frictionScore: 50,
  adoptionLikelihood: 50,
  overallUxScore: 50,
  firstImpressions:
    "Evaluation unavailable for this persona due to a service error.",
  positives: [],
  painPoints: [],
  recommendations: [],
  evidence: [],
};

// ─── Parsing & Validation ────────────────────────────────────────────────────

function parseAndValidate(raw: string, pageCount: number): PersonaEvaluation {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.replace(/^```json\n?/, "");
  else if (cleaned.startsWith("```")) cleaned = cleaned.replace(/^```\n?/, "");
  if (cleaned.endsWith("```")) cleaned = cleaned.replace(/\n?```$/, "");
  
  const parsed = JSON.parse(cleaned.trim()) as PersonaEvaluation & Record<string, unknown>;

  // Clamp numeric scores
  if (parsed.frictionScore != null)
    parsed.frictionScore = Math.min(100, Math.max(0, parsed.frictionScore));
  if (parsed.adoptionLikelihood != null)
    parsed.adoptionLikelihood = Math.min(
      100,
      Math.max(0, parsed.adoptionLikelihood),
    );
  if (parsed.overallUxScore != null)
    parsed.overallUxScore = Math.min(100, Math.max(0, parsed.overallUxScore));

  // Clamp category scores
  if (parsed.uxCategoryScores) {
    const cats = parsed.uxCategoryScores as UxCategoryScores &
      Record<string, unknown>;
    for (const key of Object.keys(cats)) {
      const cat = cats[key] as { score?: number; reason?: string; confidence?: number } | undefined;
      if (cat?.score != null) {
        cat.score = Math.min(100, Math.max(0, cat.score));
      }
      if (cat?.confidence != null) {
        cat.confidence = Math.min(100, Math.max(0, cat.confidence));
      }
    }
    // Compute weighted overall if not provided
    if (!parsed.overallUxScore) {
      const scores = Object.values(cats)
        .map((c) => (c as { score: number }).score)
        .filter((s) => typeof s === "number");
      if (scores.length > 0) {
        parsed.overallUxScore = Math.round(
          scores.reduce((a, b) => a + b, 0) / scores.length,
        );
      }
    }
  }

  // Validate pain points — ensure scoped language, drop malformed
  if (Array.isArray(parsed.painPoints)) {
    parsed.painPoints = (
      parsed.painPoints as (StructuredPainPoint | string)[]
    ).filter((pp) => {
      if (typeof pp === "string") return pp.trim().length > 0;
      return pp.issue && pp.evidence;
    }) as StructuredPainPoint[] | string[];
  }

  // Validate recommendations — drop those without evidence
  if (Array.isArray(parsed.recommendations)) {
    parsed.recommendations = (
      parsed.recommendations as (StructuredRecommendation | string)[]
    ).filter((rec) => {
      if (typeof rec === "string") return rec.trim().length > 0;
      return rec.issue && (rec.evidence || rec.improvement);
    }) as StructuredRecommendation[] | string[];
  }

  // Validate positives
  if (Array.isArray(parsed.positives)) {
    parsed.positives = (
      parsed.positives as (StructuredPositive | string)[]
    ).filter((p) => {
      if (typeof p === "string") return p.trim().length > 0;
      return p.finding && p.evidence;
    }) as StructuredPositive[] | string[];
  }

  // Clamp evidence confidence scores and validate evidence levels
  const VALID_EVIDENCE_LEVELS = new Set<string>(["OBSERVED", "MEASURED", "INFERRED", "SPECULATIVE"]);
  if (Array.isArray(parsed.evidence)) {
    parsed.evidence = parsed.evidence.map((e) => ({
      ...e,
      confidence: Math.min(100, Math.max(0, e.confidence ?? 50)),
      evidenceLevel: (VALID_EVIDENCE_LEVELS.has(e.evidenceLevel ?? "") ? e.evidenceLevel : "INFERRED") as "OBSERVED" | "MEASURED" | "INFERRED" | "SPECULATIVE",
    }));
  }

  // Enforce confidence-evidenceLevel consistency
  const enforceLevelConfidency = (
    items: StructuredPainPoint[] | StructuredPositive[] | StructuredRecommendation[],
  ) => {
    for (const item of items as unknown as Array<{ evidenceLevel?: string; confidence?: number }>) {
      const lvl = item.evidenceLevel;
      const conf = item.confidence;
      if (!lvl || conf == null) continue;
      // Cap confidence based on evidence level
      if (lvl === "SPECULATIVE" && conf > 49) item.confidence = 49;
      if (lvl === "INFERRED" && conf > 79) item.confidence = 79;
    }
  };

  if (Array.isArray(parsed.painPoints)) enforceLevelConfidency(parsed.painPoints as StructuredPainPoint[]);
  if (Array.isArray(parsed.positives)) enforceLevelConfidency(parsed.positives as StructuredPositive[]);
  if (Array.isArray(parsed.recommendations)) enforceLevelConfidency(parsed.recommendations as StructuredRecommendation[]);

  // Enforce page-count-aware confidence cap
  // If only 1 page was analyzed, no finding can be >85% confident
  if (pageCount <= 1) {
    const capAt = 85;
    if (parsed.evidence) {
      parsed.evidence = parsed.evidence.map(e => ({
        ...e,
        confidence: Math.min(capAt, e.confidence),
      }));
    }
  }

  return parsed;
}

// ─── Core Evaluation ─────────────────────────────────────────────────────────

async function evaluatePersona(
  persona: PersonaContext,
  siteContext: SiteContext | Record<string, unknown>,
): Promise<PersonaEvaluation> {
  const ctx = siteContext as SiteContext;
  const pageCount = (ctx.pageCount as number) ?? 1;
  const prompt = buildPrompt(persona, ctx);

  // Primary: Groq
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.65,
      max_tokens: 4500,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0].message.content ?? "{}";
    return parseAndValidate(raw, pageCount);
  } catch (groqErr) {
    console.error("[persona-engine] Groq failed:", (groqErr as Error).message);
  }

  // Fallback: OpenRouter
  if (!process.env.OPENROUTER_API_KEY) {
    console.warn(
      "[persona-engine] No OPENROUTER_API_KEY — returning fallback",
    );
    return { ...FALLBACK_EVALUATION };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45_000);

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://personaforge.vercel.app",
          "X-Title": "PersonaForge",
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3.3-70b-instruct",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      },
    );

    clearTimeout(timeout);

    if (!response.ok) throw new Error(`OpenRouter ${response.status}`);

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };
    return parseAndValidate(
      data.choices[0].message.content,
      pageCount,
    );
  } catch (orErr) {
    console.error(
      "[persona-engine] OpenRouter fallback also failed:",
      (orErr as Error).message,
    );
    return { ...FALLBACK_EVALUATION };
  }
}

// ─── Parallel Runner ─────────────────────────────────────────────────────────

export async function runParallelEvaluations(
  personas: PersonaContext[],
  siteContext: SiteContext | Record<string, unknown>,
): Promise<PersonaEvaluation[]> {
  const results = await Promise.allSettled(
    personas.map((p) => evaluatePersona(p, siteContext)),
  );

  return results.map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    console.error(
      `[persona-engine] Persona "${personas[i].label}" failed:`,
      r.reason,
    );
    return { ...FALLBACK_EVALUATION };
  });
}
