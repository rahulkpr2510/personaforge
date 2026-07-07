// ─────────────────────────────────────────────────────────────────────────────
// Crawler types
// ─────────────────────────────────────────────────────────────────────────────

export interface CrawledPage {
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
  screenshotBuffer: Buffer;
  viewportBuffer: Buffer;
}

export interface CrawlResult {
  pages: CrawledPage[];
  origin: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Evidence Level — attached to every AI finding
// ─────────────────────────────────────────────────────────────────────────────

/**
 * OBSERVED  — Verified directly from crawl data
 * MEASURED  — Calculated from numeric metrics
 * INFERRED  — Likely based on observed evidence, not direct proof
 * SPECULATIVE — Low-confidence assumption, extrapolation
 */
export type EvidenceLevel = "OBSERVED" | "MEASURED" | "INFERRED" | "SPECULATIVE";

// ─────────────────────────────────────────────────────────────────────────────
// Crawl Coverage — tracks what was and wasn't analyzed
// ─────────────────────────────────────────────────────────────────────────────

export interface CrawlCoverage {
  pagesCrawled: number;
  pagesDiscovered: number; // Total URLs found during crawl (including uncrawled)
  pagesBlocked: number;    // Blocked by robots/pattern/auth
  pagesSkipped: number;    // Discovered but not crawled (depth/page limit)
  avgDepth: number;
  maxDepthReached: number;
  coverageConfidence: "Low" | "Medium" | "High";
  coveragePercent: number; // pagesCrawled / pagesDiscovered * 100
  coverageNote: string;    // Human-readable summary e.g. "1 of ~12 pages analyzed"
}

// ─────────────────────────────────────────────────────────────────────────────
// Full Crawler Statistics — raw metrics for transparency panel
// ─────────────────────────────────────────────────────────────────────────────

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
  avgLargestContentfulPaintMs: number | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Analysis Reliability — computed meta-score
// ─────────────────────────────────────────────────────────────────────────────

export interface AnalysisReliability {
  score: number;            // 0–100
  evidenceBacked: number;   // Count of OBSERVED + MEASURED findings
  inferred: number;         // Count of INFERRED findings
  speculative: number;      // Count of SPECULATIVE findings
  measured: number;         // Count of MEASURED findings specifically
  totalFindings: number;
  coverage: CrawlCoverage;
  reliabilityNote: string;  // Human-readable explanation
}

// ─────────────────────────────────────────────────────────────────────────────
// Persona Context — full behavioural profile
// ─────────────────────────────────────────────────────────────────────────────

export interface PersonaContext {
  id?: string;
  label: string;
  name: string;
  age: number;
  occupation: string;
  technicalLevel: string;
  goals: string;
  frustrations: string;
  // Enriched behavioural profile (stored in persona.metadata)
  digitalLiteracy?: string;
  browsingHabits?: string;
  decisionCriteria?: string;
  personality?: string;
  trustTriggers?: string;
  dealBreakers?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Evidence & scoring types
// ─────────────────────────────────────────────────────────────────────────────

/** Per-category UX score with a single evidence-grounded reason */
export interface UxCategoryScore {
  score: number;        // 0–100
  reason: string;       // One-line, cites specific crawl data
  weight?: number;      // Relative weight in overall score
  confidence?: number;  // 0–100 — how confident is this category score
}

/** 10-category UX breakdown — replaces single friction number */
export interface UxCategoryScores {
  navigation: UxCategoryScore;
  accessibility: UxCategoryScore;
  contentClarity: UxCategoryScore;
  visualHierarchy: UxCategoryScore;
  trustSignals: UxCategoryScore;
  interactionQuality: UxCategoryScore;
  conversionClarity: UxCategoryScore;
  performanceIndicators: UxCategoryScore;
  consistency: UxCategoryScore;
  errorPrevention: UxCategoryScore;
}

/** Structured positive finding with evidence, confidence, and evidence level */
export interface StructuredPositive {
  finding: string;
  evidence: string;           // Specific crawl metric or observation
  confidence: number;         // 0–100
  evidenceLevel?: EvidenceLevel;
}

/** Structured pain point: every issue requires evidence + severity + recommendation */
export interface StructuredPainPoint {
  issue: string;
  evidence: string;           // e.g. "45 buttons detected across 5 pages"
  severity: "Low" | "Medium" | "High" | "Critical";
  confidence: number;         // 0–100
  confidenceReason: string;   // "directly observed" | "inferred" | "weak signal"
  evidenceLevel?: EvidenceLevel;
  affectedPages: string[];    // URLs
  recommendation: string;     // Specific actionable fix
}

/** Structured recommendation: causal chain from issue to expected impact */
export interface StructuredRecommendation {
  issue: string;              // Detected problem
  evidence: string;           // Crawl metric proving the problem
  reasoning: string;          // Why it matters for THIS persona
  improvement: string;        // Specific change to make
  expectedImpact: string;     // Measurable expected outcome
  evidenceLevel?: EvidenceLevel;
  businessImpact?: string;    // Business-level consequence
  confidence?: number;        // 0–100 confidence in this recommendation
}

export interface AccessibilityFinding {
  finding: string;
  evidence: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  evidenceLevel?: EvidenceLevel;
  wcagCriteria?: string;      // e.g. "WCAG 2.1 AA 1.1.1" — only if measurable
}

// ─────────────────────────────────────────────────────────────────────────────
// Persona Evaluation — structured, evidence-first output
// ─────────────────────────────────────────────────────────────────────────────

export interface PersonaEvaluation {
  firstImpressions?: string;
  personaVoice?: string;        // How this persona would describe site to a friend
  uxCategoryScores?: UxCategoryScores;
  overallUxScore?: number;       // Weighted average of category scores
  positives?: StructuredPositive[] | string[];
  painPoints?: StructuredPainPoint[] | string[];
  recommendations?: StructuredRecommendation[] | string[];
  accessibilityNotes?: string;
  accessibilityFindings?: AccessibilityFinding[];
  adoptionLikelihood?: number;  // 0–100
  adoptionReasoning?: string;   // Why this score — references persona goals
  sentiment?: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  frictionScore?: number;       // 0–100
  evidence?: Array<{
    issue: string;
    confidence: number;
    reason: string;
    evidenceLevel?: EvidenceLevel;
    support: Record<string, string | number>;
  }>;
}

export interface PersonaEvaluationWithLabel extends PersonaEvaluation {
  label: string;
  name: string;
  age: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Focus Group — moderated, cross-referencing discussion
// ─────────────────────────────────────────────────────────────────────────────

export interface FocusGroupTurn {
  speaker: string;              // "Alex Chen (Student)"
  statement: string;
  referencesPersona: string | null; // Name of persona being agreed/disagreed with
  turnType?: "opening" | "challenge" | "agreement" | "partial_agreement" | "moderator" | "conclusion";
}

export interface FocusGroupConflict {
  topic: string;
  personasAgree: string[];
  personasDisagree: string[];
  reason: string;
  segmentExplanation: string;
}

/** Full moderated focus group result */
export interface FocusGroupResult {
  summary: string;              // Top-line summary for executive dashboard
  moderatorSummary?: string;    // 3–4 sentence synthesis
  discussion?: FocusGroupTurn[];// Turn-by-turn debate
  consensus?: string[];          // Points all personas agree on
  openQuestions?: string[];      // Unresolved disagreements
  researchGaps?: string[];       // Areas not analyzed due to crawl limitations
  conflicts: {
    items: FocusGroupConflict[];
  };
  personaAgreementMatrix?: Record<
    string,
    Record<string, "agree" | "disagree" | "neutral">
  >;
}

// ─────────────────────────────────────────────────────────────────────────────
// Aggregated Insights — executive scorecard
// ─────────────────────────────────────────────────────────────────────────────

export interface TopFinding {
  title: string;
  evidence: string;
  supportedByPersonas: string[];
  evidenceLevel?: EvidenceLevel;
}

export interface TopRisk {
  title: string;
  evidence: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  businessImpact: string;
  evidenceLevel?: EvidenceLevel;
}

export interface OpportunityItem {
  improvement: string;
  estimatedImpact: "Low" | "Medium" | "High";
  effort: "Low" | "Medium" | "High";
  affectedPersonas: string[];
  category?: "quick-win" | "strategic" | "fill-in" | "avoid";
}

export type AggregatedInsights = {
  overallSentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  overallFrictionScore: number;
  avgAdoptionLikelihood: number;
  overallUxScore?: number;
  uxMaturityLevel?: "Emerging" | "Developing" | "Established" | "Advanced";
  sentimentBreakdown: { POSITIVE: number; NEUTRAL: number; NEGATIVE: number };
  topPainPoints: string[];
  topPositives: string[];
  topRecommendations: string[];
  // Executive scorecard
  topStrengths?: TopFinding[];
  topRisks?: TopRisk[];
  businessRisk?: string;
  adoptionComparison?: Array<{
    label: string;
    name: string;
    score: number;
    reasoning?: string;
  }>;
  opportunityMatrix?: OpportunityItem[];
  confidenceDistribution?: { high: number; medium: number; low: number };
  // New intelligence fields
  analysisReliability?: AnalysisReliability;
  researchGaps?: string[];
  mostImpactfulRecommendation?: string;
  mostAffectedPersona?: { label: string; name: string; frictionScore: number; adoptionLikelihood: number };
  technicalDebtIndicator?: "Low" | "Medium" | "High";
  conversionRisk?: number;      // 0–100
  accessibilityRisk?: "Low" | "Medium" | "High";
};

// ─────────────────────────────────────────────────────────────────────────────
// Vision Analysis
// ─────────────────────────────────────────────────────────────────────────────

export interface VisionAnalysis {
  uiStructure: string;
  layoutHierarchy: string;
  visualComplexity: "low" | "medium" | "high";
  formComplexity: "simple" | "moderate" | "complex";
  accessibilityObservations: string[];
  navigationPatterns: string;
  interfaceElements: string[];
  primaryPurpose: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Site Context — rich evidence passed to every persona
// ─────────────────────────────────────────────────────────────────────────────

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

export interface SiteContext {
  url: string;
  hostname: string;
  pageCount: number;
  deviceType: string;
  // Crawl coverage context — CRITICAL for scoped language
  pagesDiscovered?: number;     // Total URLs the crawler found (inc. uncrawled)
  pagesSkipped?: number;        // URLs found but not visited (limit hit)
  pagesBlocked?: number;        // URLs blocked by policy
  crawlCoverage?: CrawlCoverage;
  // Aggregated interaction metrics
  totalButtons: number;
  totalForms: number;
  totalLinks: number;
  totalInputs: number;
  totalWords: number;
  avgWordCount: number;
  maxDepth: number;
  totalInteractions: number;
  // Accessibility evidence (directly observed)
  totalImagesWithoutAlt: number;
  totalImages: number;
  totalInputsWithoutLabel: number;
  pagesWithH1: number;
  pagesWithoutH1: number;
  totalButtonsWithoutLabel: number;
  avgLandmarkCount: number;
  // Extended accessibility evidence
  pagesWithSkipLink?: number;
  pagesWithLangAttr?: number;
  pagesWithFocusStyles?: number;
  pagesWithAriaLandmarks?: number;
  totalAriaLabels?: number;
  // Performance evidence
  avgTtfbMs: number | null;
  avgLoadMs: number | null;
  slowPages: string[];          // URLs where loadMs > 3000
  // Navigation evidence
  navLabels: string[];
  uniqueCtaLabels: string[];
  primaryActionLabels: string[];
  // Page type breakdown
  pageTypes: string[];
  // Basic trust signal detection
  hasPricingPage: boolean;
  hasContactPage: boolean;
  hasDocsPage: boolean;
  // Per-page evidence (for citation in AI output)
  pageEvidence: PageEvidence[];
  // Vision analysis summaries
  visionSummaries: string[];
  contentSample: string;
}
