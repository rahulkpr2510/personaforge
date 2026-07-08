// lib/services/persona-engine-internals.ts
// Extracted prompt builder — shared between persona-engine.ts and persona-analysis-service.ts.
// This is a pure function: no side effects, no I/O.

import type { PersonaContext, SiteContext } from "../types";

const PERSONA_VOCABULARY: Record<string, { allowed: string[]; forbidden: string[] }> = {
  student: {
    allowed: ["simple","easy","confusing","expensive","free","fast","clear","overwhelming","helpful","frustrating","understand","figure out","affordable","time","quick","lost","trust","obvious"],
    forbidden: ["enterprise","ROI","stakeholder","procurement","SLA","API surface","developer experience","activation funnel","market positioning","conversion rate","retention metric","lighthouse score"],
  },
  developer: {
    allowed: ["rendering","responsiveness","performance","accessibility","API","documentation","error handling","feedback loop","keyboard","focus","semantic","ARIA","WCAG","load time","interaction","architecture","developer experience","lighthouse","Core Web Vitals"],
    forbidden: ["super easy","super simple","feels great","love the vibe","intuitive","branding","market fit"],
  },
  pm: {
    allowed: ["adoption","activation","conversion","retention","market fit","trust","competitive positioning","business value","feature communication","funnel","drop-off","onboarding","time-to-value","ROI","customer success","churn risk"],
    forbidden: ["lighthouse score","ARIA","WCAG","tabindex","semantic HTML","rendering pipeline","DOM depth","CSS cascade"],
  },
  researcher: {
    allowed: ["evidence","hypothesis","usability","task completion","mental model","cognitive load","heuristic","user flow","friction","findability","learnability","consistency","affordance","error recovery","information architecture"],
    forbidden: ["just ship it","growth hack","viral","engagement bait","lighthouse score","sprint velocity","OKR"],
  },
  marketer: {
    allowed: ["brand","messaging","value proposition","trust","social proof","call-to-action","above the fold","landing page","conversion","headline","copy","campaign","awareness","credibility","differentiation"],
    forbidden: ["ARIA","WCAG","semantic HTML","tabindex","API surface","DOM depth","rendering pipeline","Core Web Vitals"],
  },
  executive: {
    allowed: ["risk","ROI","competitive advantage","revenue","cost","brand perception","market share","strategic","investment","scalability","growth","trust","enterprise readiness","compliance","SLA"],
    forbidden: ["ARIA","tabindex","lighthouse","CSS cascade","DOM depth","rendering pipeline","WCAG compliance level"],
  },
};

function getVocabularyRules(persona: PersonaContext): string {
  const label = persona.label.toLowerCase();
  let profile: { allowed: string[]; forbidden: string[] } | null = null;
  if (label.includes("student") || label.includes("learner")) profile = PERSONA_VOCABULARY.student;
  else if (label.includes("developer") || label.includes("engineer") || label.includes("dev")) profile = PERSONA_VOCABULARY.developer;
  else if (label.includes("product manager") || label.includes("pm ") || label.includes(" pm") || label.includes("manager")) profile = PERSONA_VOCABULARY.pm;
  else if (label.includes("researcher") || label.includes("ux ") || label.includes(" ux") || label.includes("usability")) profile = PERSONA_VOCABULARY.researcher;
  else if (label.includes("market") || label.includes("growth") || label.includes("brand")) profile = PERSONA_VOCABULARY.marketer;
  else if (label.includes("executive") || label.includes("ceo") || label.includes("cto") || label.includes("coo") || label.includes("director") || label.includes("vp ") || label.includes(" vp")) profile = PERSONA_VOCABULARY.executive;
  if (!profile) return "";
  return `\nPERSONA VOCABULARY RULES (ENFORCE STRICTLY):
Your voice MUST reflect ${persona.label}'s background.
✓ Use language like: ${profile.allowed.slice(0, 8).join(", ")}
✗ NEVER use: ${profile.forbidden.slice(0, 6).join(", ")}
If you use any forbidden terms, the report is INVALID.`;
}

export function buildPersonaPrompt(persona: PersonaContext, ctx: SiteContext): string {
  const safe = (v: unknown, max = 500) => String(v ?? "").replace(/[`{}\\\]]/g, "").slice(0, max);
  const meta = persona as PersonaContext & Record<string, unknown>;

  const slowPagesSummary = ctx.slowPages?.length > 0
    ? `Slow pages (>3s load time): ${ctx.slowPages.slice(0, 3).join(", ")}`
    : "No slow pages detected within analyzed set";
  const perfSummary = ctx.avgTtfbMs != null
    ? `Avg TTFB: ${ctx.avgTtfbMs}ms | Avg page load: ${ctx.avgLoadMs}ms`
    : "Performance timing data unavailable";

  const pageBreakdown = (ctx.pageEvidence ?? [])
    .map((p) =>
      ` • [${p.pageType}] "${p.title ?? p.url}": ${p.buttonsCount} btns, ${p.formsCount} forms, ${p.wordCount} words, friction=${p.frictionScore}/100` +
      (p.primaryActionLabel ? `, primary-CTA="${p.primaryActionLabel}"` : "") +
      (p.ctaTexts?.length > 0 ? `, all-CTAs=[${p.ctaTexts.slice(0, 5).join(", ")}]` : "") +
      (p.headingStructure?.length > 0 ? `, headings=[${p.headingStructure.slice(0, 3).join(" | ")}]` : ""),
    ).join("\n");

  const visionBlock = ctx.visionSummaries?.length > 0
    ? ctx.visionSummaries.slice(0, 3).join("\n---\n")
    : "No visual analysis available";

  const coverageContext = ctx.crawlCoverage
    ? `CRAWL COVERAGE (CRITICAL — READ BEFORE EVERY FINDING):
• Pages analyzed: ${ctx.crawlCoverage.pagesCrawled} of ~${ctx.crawlCoverage.pagesDiscovered} discovered URLs
• Coverage confidence: ${ctx.crawlCoverage.coverageConfidence}
• Coverage note: ${ctx.crawlCoverage.coverageNote}
This means: features present on uncrawled pages CANNOT be reported as absent.`
    : `CRAWL COVERAGE:\n• Pages analyzed: ${ctx.pageCount}\n• Additional pages may exist but were not crawled.`;

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
• Detected nav labels: ${ctx.navLabels?.slice(0, 12).join(", ") || "none"}
• Detected CTAs: ${ctx.uniqueCtaLabels?.slice(0, 10).join(", ") || "none"}
• Primary actions: ${ctx.primaryActionLabels?.filter(Boolean).slice(0, 5).join(", ") || "none"}

ACCESSIBILITY EVIDENCE (directly observed):
• Images without alt text: ${ctx.totalImagesWithoutAlt} / ${ctx.totalImages} total images
• Input fields without labels: ${ctx.totalInputsWithoutLabel}
• Buttons without accessible labels: ${ctx.totalButtonsWithoutLabel}
• Pages with H1: ${ctx.pagesWithH1} / ${ctx.pageCount}
• Pages missing H1: ${ctx.pagesWithoutH1}
• Average landmark count: ${ctx.avgLandmarkCount?.toFixed(1)} per page

PERFORMANCE EVIDENCE:
• ${perfSummary}
• ${slowPagesSummary}

TRUST & CONTENT SIGNALS:
• Pricing page detected: ${ctx.hasPricingPage ? "YES — on analyzed pages" : "NOT DETECTED on analyzed pages"}
• Contact/support page detected: ${ctx.hasContactPage ? "YES — on analyzed pages" : "NOT DETECTED on analyzed pages"}
• Documentation page detected: ${ctx.hasDocsPage ? "YES — on analyzed pages" : "NOT DETECTED on analyzed pages"}
• Page types encountered: ${ctx.pageTypes?.join(", ")}

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

CRITICAL RULES:
1. NEVER CONFUSE "NOT OBSERVED" WITH "DOES NOT EXIST". Always use scoped language.
2. EVIDENCE LEVELS: OBSERVED / MEASURED / INFERRED / SPECULATIVE — assign one per finding.
3. HIGH CONFIDENCE (≥80) ONLY for OBSERVED or MEASURED findings.
4. PERSONA AUTHENTICITY: Sound exactly like ${safe(persona.name, 80)}.
5. ZERO HALLUCINATION: Every finding must trace to crawl evidence above.
6. SPECIFICITY: Name the exact metric.

Respond ONLY with valid JSON, no markdown:
{
  "firstImpressions": "2-3 sentences gut reaction in ${safe(persona.name, 80)}'s authentic voice",
  "personaVoice": "One sentence how ${safe(persona.name, 80)} would describe this site to a colleague",
  "uxCategoryScores": {
    "navigation": { "score": <0-100>, "reason": "", "confidence": <0-100> },
    "accessibility": { "score": <0-100>, "reason": "", "confidence": <0-100> },
    "contentClarity": { "score": <0-100>, "reason": "", "confidence": <0-100> },
    "visualHierarchy": { "score": <0-100>, "reason": "", "confidence": <0-100> },
    "trustSignals": { "score": <0-100>, "reason": "", "confidence": <0-100> },
    "interactionQuality": { "score": <0-100>, "reason": "", "confidence": <0-100> },
    "conversionClarity": { "score": <0-100>, "reason": "", "confidence": <0-100> },
    "performanceIndicators": { "score": <0-100>, "reason": "", "confidence": <0-100> },
    "consistency": { "score": <0-100>, "reason": "", "confidence": <0-100> },
    "errorPrevention": { "score": <0-100>, "reason": "", "confidence": <0-100> }
  },
  "overallUxScore": <0-100>,
  "positives": [{ "finding": "", "evidence": "", "confidence": <0-100>, "evidenceLevel": "OBSERVED|MEASURED|INFERRED|SPECULATIVE" }],
  "painPoints": [{ "issue": "", "evidence": "", "severity": "Low|Medium|High|Critical", "confidence": <0-100>, "confidenceReason": "", "evidenceLevel": "OBSERVED|MEASURED|INFERRED|SPECULATIVE", "affectedPages": [], "recommendation": "" }],
  "recommendations": [{ "issue": "", "evidence": "", "reasoning": "", "improvement": "", "expectedImpact": "", "businessImpact": "", "confidence": <0-100>, "evidenceLevel": "OBSERVED|MEASURED|INFERRED|SPECULATIVE" }],
  "accessibilityNotes": "",
  "accessibilityFindings": [{ "finding": "", "evidence": "", "severity": "Low|Medium|High|Critical", "evidenceLevel": "OBSERVED|MEASURED|INFERRED|SPECULATIVE" }],
  "adoptionLikelihood": <0-100>,
  "adoptionReasoning": "",
  "sentiment": "POSITIVE|NEUTRAL|NEGATIVE",
  "frictionScore": <0-100>,
  "evidence": [{ "issue": "", "confidence": <0-100>, "reason": "", "evidenceLevel": "OBSERVED|MEASURED|INFERRED|SPECULATIVE", "support": {} }]
}`;
}