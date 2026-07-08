import type {
  PersonaEvaluationWithLabel,
  AggregatedInsights,
  StructuredPainPoint,
  StructuredPositive,
  StructuredRecommendation,
  TopFinding,
  TopRisk,
  OpportunityItem,
  UxCategoryScores,
  CrawlCoverage,
  AnalysisReliability,
  EvidenceLevel,
} from "../types";


function uxMaturityLevel(
  score: number,
): "Emerging" | "Developing" | "Established" | "Advanced" {
  if (score >= 80) return "Advanced";
  if (score >= 65) return "Established";
  if (score >= 45) return "Developing";
  return "Emerging";
}


function getString(v: StructuredPainPoint | string): string {
  return typeof v === "string" ? v : v.issue ?? "";
}

function getStringPos(v: StructuredPositive | string): string {
  return typeof v === "string" ? v : v.finding ?? "";
}

function getStringRec(v: StructuredRecommendation | string): string {
  if (typeof v === "string") return v;
  return v.improvement ?? v.issue ?? "";
}


function deduplicateItems(items: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    const key = item.trim().toLowerCase().slice(0, 80);
    if (key.length > 0 && !seen.has(key)) {
      seen.add(key);
      result.push(item.trim());
    }
  }
  return result;
}


function buildTopStrengths(
  evaluations: PersonaEvaluationWithLabel[],
): TopFinding[] {
  const allPositives: Array<{
    finding: string;
    evidence: string;
    confidence: number;
    evidenceLevel?: EvidenceLevel;
    persona: string;
  }> = [];

  for (const e of evaluations) {
    for (const p of e.positives ?? []) {
      if (typeof p === "string") {
        allPositives.push({
          finding: p,
          evidence: "observed across personas",
          confidence: 70,
          evidenceLevel: "INFERRED",
          persona: e.label,
        });
      } else {
        allPositives.push({
          finding: p.finding,
          evidence: p.evidence,
          confidence: p.confidence,
          evidenceLevel: p.evidenceLevel ?? "INFERRED",
          persona: e.label,
        });
      }
    }
  }

  const grouped = new Map<
    string,
    { texts: string[]; evidences: string[]; personas: string[]; evidenceLevel: EvidenceLevel }
  >();
  for (const p of allPositives) {
    const key = p.finding.trim().toLowerCase().slice(0, 40);
    if (!grouped.has(key)) {
      grouped.set(key, { texts: [], evidences: [], personas: [], evidenceLevel: p.evidenceLevel ?? "INFERRED" });
    }
    const g = grouped.get(key)!;
    g.texts.push(p.finding);
    g.evidences.push(p.evidence);
    if (!g.personas.includes(p.persona)) g.personas.push(p.persona);
  }

  const sorted = [...grouped.entries()]
    .sort((a, b) => b[1].personas.length - a[1].personas.length)
    .slice(0, 3);

  return sorted.map(([, g]) => ({
    title: g.texts[0] ?? "",
    evidence: g.evidences[0] ?? "Observed across multiple personas",
    supportedByPersonas: g.personas,
    evidenceLevel: g.evidenceLevel,
  }));
}


const SEVERITY_WEIGHT: Record<string, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

function buildTopRisks(
  evaluations: PersonaEvaluationWithLabel[],
): TopRisk[] {
  const allRisks: Array<{
    issue: string;
    evidence: string;
    severity: string;
    confidence: number;
    evidenceLevel?: EvidenceLevel;
    persona: string;
  }> = [];

  for (const e of evaluations) {
    for (const pp of e.painPoints ?? []) {
      if (typeof pp === "string") {
        allRisks.push({
          issue: pp,
          evidence: "identified by persona evaluation",
          severity: "Medium",
          confidence: 65,
          evidenceLevel: "INFERRED",
          persona: e.label,
        });
      } else {
        allRisks.push({
          issue: pp.issue,
          evidence: pp.evidence,
          severity: pp.severity,
          confidence: pp.confidence,
          evidenceLevel: pp.evidenceLevel ?? "INFERRED",
          persona: e.label,
        });
      }
    }
  }

  const scored = allRisks.map((r) => ({
    ...r,
    score: (SEVERITY_WEIGHT[r.severity] ?? 1) * (r.confidence / 100),
  }));

  scored.sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const top: typeof scored = [];
  for (const r of scored) {
    const key = r.issue.trim().toLowerCase().slice(0, 50);
    if (!seen.has(key)) {
      seen.add(key);
      top.push(r);
    }
    if (top.length >= 3) break;
  }

  return top.map((r) => ({
    title: r.issue,
    evidence: r.evidence,
    severity: r.severity as "Low" | "Medium" | "High" | "Critical",
    businessImpact: buildBusinessImpact(r.severity, r.issue),
    evidenceLevel: r.evidenceLevel,
  }));
}

function buildBusinessImpact(severity: string, issue: string): string {
  const impactMap: Record<string, string> = {
    Critical:
      "Likely causing significant user abandonment and conversion loss",
    High: "Probable friction point reducing task completion and retention",
    Medium: "May reduce satisfaction and repeat usage among affected segments",
    Low: "Minor inconvenience with limited measurable business impact",
  };
  return `${impactMap[severity] ?? impactMap.Medium} — related to: ${issue.slice(0, 80)}`;
}


function buildOpportunityMatrix(
  evaluations: PersonaEvaluationWithLabel[],
): OpportunityItem[] {
  const allRecs: Array<{
    improvement: string;
    issue: string;
    persona: string;
    severity: string;
  }> = [];

  for (const e of evaluations) {
    for (const rec of e.recommendations ?? []) {
      if (typeof rec === "string") {
        allRecs.push({ improvement: rec, issue: rec, persona: e.label, severity: "Medium" });
      } else {
        allRecs.push({
          improvement: rec.improvement ?? rec.issue,
          issue: rec.issue,
          persona: e.label,
          severity: "Medium",
        });
      }
    }
    for (const pp of e.painPoints ?? []) {
      if (typeof pp !== "string" && pp.recommendation) {
        allRecs.push({
          improvement: pp.recommendation,
          issue: pp.issue,
          persona: e.label,
          severity: pp.severity,
        });
      }
    }
  }

  const seen = new Set<string>();
  const deduped: typeof allRecs = [];
  const personaMap = new Map<string, string[]>();

  for (const r of allRecs) {
    const key = r.improvement.trim().toLowerCase().slice(0, 60);
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(r);
      personaMap.set(key, [r.persona]);
    } else {
      const personas = personaMap.get(key) ?? [];
      if (!personas.includes(r.persona)) personas.push(r.persona);
      personaMap.set(key, personas);
    }
  }

  return deduped.slice(0, 8).map((r) => {
    const key = r.improvement.trim().toLowerCase().slice(0, 60);
    const personas = personaMap.get(key) ?? [r.persona];
    const impact: "Low" | "Medium" | "High" =
      personas.length >= 3 ? "High" : personas.length === 2 ? "Medium" : "Low";
    const severityW = SEVERITY_WEIGHT[r.severity] ?? 2;
    const effort: "Low" | "Medium" | "High" =
      severityW >= 3 ? "High" : severityW === 2 ? "Medium" : "Low";

    // Categorize for opportunity matrix quadrant
    let category: OpportunityItem["category"];
    if (impact === "High" && effort === "Low") category = "quick-win";
    else if (impact === "High" && effort !== "Low") category = "strategic";
    else if (impact === "Low" && effort === "Low") category = "fill-in";
    else category = "avoid";

    return { improvement: r.improvement, estimatedImpact: impact, effort, affectedPersonas: personas, category };
  });
}


function buildConfidenceDistribution(
  evaluations: PersonaEvaluationWithLabel[],
): { high: number; medium: number; low: number } {
  let high = 0;
  let medium = 0;
  let low = 0;
  let total = 0;

  for (const e of evaluations) {
    for (const ev of e.evidence ?? []) {
      total++;
      if (ev.confidence >= 80) high++;
      else if (ev.confidence >= 50) medium++;
      else low++;
    }
    for (const pp of e.painPoints ?? []) {
      if (typeof pp !== "string") {
        total++;
        if (pp.confidence >= 80) high++;
        else if (pp.confidence >= 50) medium++;
        else low++;
      }
    }
  }

  if (total === 0) return { high: 0, medium: 100, low: 0 };

  return {
    high: Math.round((high / total) * 100),
    medium: Math.round((medium / total) * 100),
    low: Math.round((low / total) * 100),
  };
}


function buildAnalysisReliability(
  evaluations: PersonaEvaluationWithLabel[],
  crawlCoverage?: CrawlCoverage,
): AnalysisReliability | undefined {
  if (!crawlCoverage) return undefined;

  let evidenceBacked = 0; // OBSERVED + MEASURED
  let measured = 0;
  let inferred = 0;
  let speculative = 0;
  let total = 0;

  const countLevel = (level: string | undefined) => {
    total++;
    if (level === "OBSERVED") evidenceBacked++;
    else if (level === "MEASURED") { evidenceBacked++; measured++; }
    else if (level === "INFERRED") inferred++;
    else speculative++; // SPECULATIVE or unknown
  };

  for (const e of evaluations) {
    for (const pp of e.painPoints ?? []) {
      if (typeof pp !== "string") countLevel(pp.evidenceLevel);
    }
    for (const pos of e.positives ?? []) {
      if (typeof pos !== "string") countLevel(pos.evidenceLevel);
    }
    for (const rec of e.recommendations ?? []) {
      if (typeof rec !== "string") countLevel((rec as { evidenceLevel?: string }).evidenceLevel);
    }
    for (const ev of e.evidence ?? []) {
      countLevel((ev as { evidenceLevel?: string }).evidenceLevel);
    }
  }

  if (total === 0) return undefined;

  // Score: 100 * evidenceBacked/total, penalized by coverage
  const rawScore = Math.round((evidenceBacked / total) * 100);
  const coveragePenalty =
    crawlCoverage.coverageConfidence === "Low"
      ? 15
      : crawlCoverage.coverageConfidence === "Medium"
        ? 5
        : 0;
  const score = Math.max(0, rawScore - coveragePenalty);

  let reliabilityNote = "";
  if (score >= 80) reliabilityNote = "High reliability — majority of findings are directly observed from crawl data.";
  else if (score >= 60) reliabilityNote = "Moderate reliability — mix of observed evidence and reasonable inferences.";
  else if (score >= 40) reliabilityNote = "Limited reliability — many inferences due to restricted crawl coverage.";
  else reliabilityNote = "Low reliability — coverage was too limited for high-confidence findings. Expand crawl to improve.";

  return { score, evidenceBacked, measured, inferred, speculative, totalFindings: total, coverage: crawlCoverage, reliabilityNote };
}


function buildResearchGaps(
  evaluations: PersonaEvaluationWithLabel[],
  pageCount: number,
  siteContext?: {
    hasPricingPage?: boolean;
    hasContactPage?: boolean;
    hasDocsPage?: boolean;
    pageTypes?: string[];
  },
): string[] {
  const gaps: string[] = [];

  if (pageCount <= 1) {
    gaps.push(`Only 1 page was analyzed. Findings are based on the homepage alone. Checkout, pricing, documentation, and support flows could not be evaluated.`);
  } else if (pageCount <= 3) {
    gaps.push(`Only ${pageCount} pages were analyzed. Additional crawling would improve findings for authenticated flows, secondary pages, and edge cases.`);
  }

  if (!siteContext?.hasPricingPage) {
    gaps.push("Pricing page was not encountered during the crawl. Pricing discoverability and clarity could not be directly assessed.");
  }
  if (!siteContext?.hasContactPage) {
    gaps.push("Contact or support page was not encountered. Support accessibility and trust signals from support pages were not assessed.");
  }
  if (!siteContext?.hasDocsPage) {
    gaps.push("Documentation was not encountered in the crawl. Developer experience and self-service support could not be evaluated.");
  }

  const pageTypes = siteContext?.pageTypes ?? [];
  if (!pageTypes.includes("CHECKOUT") && !pageTypes.includes("DETAIL")) {
    gaps.push("Checkout and product detail pages were not crawled. Conversion funnel UX could not be assessed.");
  }
  if (!pageTypes.includes("SETTINGS")) {
    gaps.push("Settings and account pages were not analyzed. Onboarding completion and account management UX could not be assessed.");
  }

  return gaps.slice(0, 6);
}


function findMostImpactfulRecommendation(matrix: OpportunityItem[]): string | undefined {
  const quickWins = matrix.filter(m => m.category === "quick-win");
  if (quickWins.length > 0) return quickWins[0].improvement;
  const strategic = matrix.filter(m => m.category === "strategic");
  if (strategic.length > 0) return strategic[0].improvement;
  return matrix[0]?.improvement;
}


function findMostAffectedPersona(
  evaluations: PersonaEvaluationWithLabel[],
): AggregatedInsights["mostAffectedPersona"] {
  // Most affected = highest friction + lowest adoption
  const scored = evaluations.map(e => ({
    label: e.label,
    name: e.name,
    frictionScore: e.frictionScore ?? 50,
    adoptionLikelihood: e.adoptionLikelihood ?? 50,
    score: (e.frictionScore ?? 50) + (100 - (e.adoptionLikelihood ?? 50)),
  }));
  scored.sort((a, b) => b.score - a.score);
  const top = scored[0];
  if (!top) return undefined;
  return { label: top.label, name: top.name, frictionScore: top.frictionScore, adoptionLikelihood: top.adoptionLikelihood };
}


function buildTechnicalDebtIndicator(
  evaluations: PersonaEvaluationWithLabel[],
): "Low" | "Medium" | "High" {
  // Derive from accessibility + errorPrevention scores
  const a11yScores = evaluations
    .map(e => e.uxCategoryScores?.accessibility?.score)
    .filter((s): s is number => s != null);
  const errScores = evaluations
    .map(e => e.uxCategoryScores?.errorPrevention?.score)
    .filter((s): s is number => s != null);

  if (a11yScores.length === 0 && errScores.length === 0) return "Medium";

  const avgA11y = a11yScores.length > 0
    ? a11yScores.reduce((a, b) => a + b, 0) / a11yScores.length
    : 50;
  const avgErr = errScores.length > 0
    ? errScores.reduce((a, b) => a + b, 0) / errScores.length
    : 50;
  const combined = (avgA11y + avgErr) / 2;

  if (combined < 40) return "High";
  if (combined < 65) return "Medium";
  return "Low";
}


function buildConversionRisk(
  evaluations: PersonaEvaluationWithLabel[],
  overallFriction: number,
): number {
  const avgAdoption =
    evaluations.reduce((s, e) => s + (e.adoptionLikelihood ?? 50), 0) /
    Math.max(evaluations.length, 1);

  // Conversion risk = blend of friction and inverse adoption
  return Math.round((overallFriction * 0.6 + (100 - avgAdoption) * 0.4));
}


function buildAccessibilityRisk(
  evaluations: PersonaEvaluationWithLabel[],
): "Low" | "Medium" | "High" {
  let criticalOrHighCount = 0;
  let totalFindings = 0;

  for (const e of evaluations) {
    for (const f of e.accessibilityFindings ?? []) {
      totalFindings++;
      if (f.severity === "Critical" || f.severity === "High") criticalOrHighCount++;
    }
  }

  if (criticalOrHighCount >= 3) return "High";
  if (criticalOrHighCount >= 1 || totalFindings >= 4) return "Medium";
  return "Low";
}


const CATEGORY_WEIGHTS: Record<string, number> = {
  navigation: 1.2,
  accessibility: 1.0,
  contentClarity: 1.1,
  visualHierarchy: 0.9,
  trustSignals: 1.2,
  interactionQuality: 1.0,
  conversionClarity: 1.1,
  performanceIndicators: 0.9,
  consistency: 0.8,
  errorPrevention: 0.9,
};

function computeWeightedUxScore(
  evaluations: PersonaEvaluationWithLabel[],
): number | undefined {
  const directScores = evaluations
    .map((e) => e.overallUxScore)
    .filter((s): s is number => typeof s === "number");

  if (directScores.length > 0) {
    return Math.round(
      directScores.reduce((a, b) => a + b, 0) / directScores.length,
    );
  }

  const allCategoryAverages: number[] = [];
  for (const e of evaluations) {
    if (e.uxCategoryScores) {
      const cats = e.uxCategoryScores as UxCategoryScores &
        Record<string, { score: number }>;
      let weightedSum = 0;
      let weightSum = 0;
      for (const [key, weight] of Object.entries(CATEGORY_WEIGHTS)) {
        const cat = cats[key];
        if (cat?.score != null) {
          weightedSum += cat.score * weight;
          weightSum += weight;
        }
      }
      if (weightSum > 0) {
        allCategoryAverages.push(Math.round(weightedSum / weightSum));
      }
    }
  }

  if (allCategoryAverages.length > 0) {
    return Math.round(
      allCategoryAverages.reduce((a, b) => a + b, 0) / allCategoryAverages.length,
    );
  }

  return undefined;
}


function buildBusinessRisk(
  overallScore: number | undefined,
  avgAdoption: number,
  topRisks: TopRisk[],
): string {
  const score = overallScore ?? 50;
  const criticalRisks = topRisks.filter((r) => r.severity === "Critical").length;
  const highRisks = topRisks.filter((r) => r.severity === "High").length;

  if (score < 45 || criticalRisks > 0) {
    return `HIGH business risk: UX score of ${score}/100 and ${criticalRisks} critical issue(s) indicate significant user experience barriers likely causing measurable conversion loss and user abandonment.`;
  }
  if (score < 65 || highRisks > 0) {
    return `MEDIUM business risk: UX score of ${score}/100 with ${highRisks} high-severity issue(s) suggests friction that may reduce conversion rates and customer satisfaction for key user segments.`;
  }
  if (avgAdoption >= 75 && score >= 70) {
    return `LOW business risk: UX score of ${score}/100 and ${Math.round(avgAdoption)}% average adoption likelihood indicate a positive experience. Focus on the identified improvement opportunities to further increase conversion.`;
  }
  return `MODERATE business risk: While UX score is ${score}/100, adoption likelihood of ${Math.round(avgAdoption)}% suggests room for improvement in meeting key persona needs. Priority recommendations above are expected to increase this by 10–20 points.`;
}


export function aggregateInsights(
  evaluations: PersonaEvaluationWithLabel[],
  opts?: {
    crawlCoverage?: CrawlCoverage;
    pageCount?: number;
    siteContext?: {
      hasPricingPage?: boolean;
      hasContactPage?: boolean;
      hasDocsPage?: boolean;
      pageTypes?: string[];
    };
  },
): AggregatedInsights {
  if (evaluations.length === 0) {
    return {
      overallSentiment: "NEUTRAL",
      overallFrictionScore: 0,
      avgAdoptionLikelihood: 0,
      sentimentBreakdown: { POSITIVE: 0, NEUTRAL: 0, NEGATIVE: 0 },
      topPainPoints: [],
      topPositives: [],
      topRecommendations: [],
    };
  }

  // ── Basic aggregation ───────────────────────────────────────────────────────
  const sentimentCounts = { POSITIVE: 0, NEUTRAL: 0, NEGATIVE: 0 };
  let totalFriction = 0;
  let totalAdoption = 0;
  const allPainPoints: string[] = [];
  const allPositives: string[] = [];
  const allRecommendations: string[] = [];

  for (const e of evaluations) {
    const sentiment = e.sentiment ?? "NEUTRAL";
    sentimentCounts[sentiment]++;
    totalFriction += e.frictionScore ?? 50;
    totalAdoption += e.adoptionLikelihood ?? 50;
    allPainPoints.push(...(e.painPoints ?? []).map(getString));
    allPositives.push(...(e.positives ?? []).map(getStringPos));
    allRecommendations.push(...(e.recommendations ?? []).map(getStringRec));
  }

  const dominant = (
    Object.entries(sentimentCounts) as Array<
      [keyof typeof sentimentCounts, number]
    >
  ).sort((a, b) => b[1] - a[1])[0][0];

  const overallFrictionScore = Math.round(totalFriction / evaluations.length);
  const avgAdoptionLikelihood = Math.round(totalAdoption / evaluations.length);

  // ── Executive scorecard ─────────────────────────────────────────────────────
  const overallUxScore = computeWeightedUxScore(evaluations);
  const topStrengths = buildTopStrengths(evaluations);
  const topRisks = buildTopRisks(evaluations);
  const opportunityMatrix = buildOpportunityMatrix(evaluations);
  const confidenceDistribution = buildConfidenceDistribution(evaluations);
  const businessRisk = buildBusinessRisk(overallUxScore, avgAdoptionLikelihood, topRisks);

  // ── New intelligence fields ─────────────────────────────────────────────────
  const analysisReliability = buildAnalysisReliability(evaluations, opts?.crawlCoverage);
  const researchGaps = buildResearchGaps(
    evaluations,
    opts?.pageCount ?? evaluations.length,
    opts?.siteContext,
  );
  const mostImpactfulRecommendation = findMostImpactfulRecommendation(opportunityMatrix);
  const mostAffectedPersona = findMostAffectedPersona(evaluations);
  const technicalDebtIndicator = buildTechnicalDebtIndicator(evaluations);
  const conversionRisk = buildConversionRisk(evaluations, overallFrictionScore);
  const accessibilityRisk = buildAccessibilityRisk(evaluations);

  // ── Adoption comparison ─────────────────────────────────────────────────────
  const adoptionComparison = evaluations
    .map((e) => ({
      label: e.label,
      name: e.name,
      score: e.adoptionLikelihood ?? 50,
      reasoning: e.adoptionReasoning,
    }))
    .sort((a, b) => b.score - a.score);

  return {
    overallSentiment: dominant,
    overallFrictionScore,
    avgAdoptionLikelihood,
    overallUxScore,
    uxMaturityLevel: overallUxScore ? uxMaturityLevel(overallUxScore) : undefined,
    sentimentBreakdown: sentimentCounts,
    topPainPoints: deduplicateItems(allPainPoints).slice(0, 8),
    topPositives: deduplicateItems(allPositives).slice(0, 6),
    topRecommendations: deduplicateItems(allRecommendations).slice(0, 8),
    topStrengths,
    topRisks,
    businessRisk,
    adoptionComparison,
    opportunityMatrix,
    confidenceDistribution,
    analysisReliability,
    researchGaps,
    mostImpactfulRecommendation,
    mostAffectedPersona,
    technicalDebtIndicator,
    conversionRisk,
    accessibilityRisk,
  };
}
