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

// OBSERVED=crawl data, MEASURED=numeric metrics, INFERRED=likely, SPECULATIVE=low-confidence
export type EvidenceLevel = "OBSERVED" | "MEASURED" | "INFERRED" | "SPECULATIVE";

export interface CrawlCoverage {
  pagesCrawled: number;
  pagesDiscovered: number;
  pagesBlocked: number;
  pagesSkipped: number;
  avgDepth: number;
  maxDepthReached: number;
  coverageConfidence: "Low" | "Medium" | "High";
  coveragePercent: number;
  coverageNote: string;
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
  avgLargestContentfulPaintMs: number | null;
}

export interface AnalysisReliability {
  score: number;
  evidenceBacked: number;
  inferred: number;
  speculative: number;
  measured: number;
  totalFindings: number;
  coverage: CrawlCoverage;
  reliabilityNote: string;
}

export interface PersonaContext {
  id?: string;
  label: string;
  name: string;
  age: number;
  occupation: string;
  technicalLevel: string;
  goals: string;
  frustrations: string;
  digitalLiteracy?: string;
  browsingHabits?: string;
  decisionCriteria?: string;
  personality?: string;
  trustTriggers?: string;
  dealBreakers?: string;
}

export interface UxCategoryScore {
  score: number;
  reason: string;
  weight?: number;
  confidence?: number;
}

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

export interface StructuredPositive {
  finding: string;
  evidence: string;
  confidence: number;
  evidenceLevel?: EvidenceLevel;
}

export interface StructuredPainPoint {
  issue: string;
  evidence: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  confidence: number;
  confidenceReason: string;
  evidenceLevel?: EvidenceLevel;
  affectedPages: string[];
  recommendation: string;
}

export interface StructuredRecommendation {
  issue: string;
  evidence: string;
  reasoning: string;
  improvement: string;
  expectedImpact: string;
  evidenceLevel?: EvidenceLevel;
  businessImpact?: string;
  confidence?: number;
}

export interface AccessibilityFinding {
  finding: string;
  evidence: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  evidenceLevel?: EvidenceLevel;
  wcagCriteria?: string;
}

export interface PersonaEvaluation {
  firstImpressions?: string;
  personaVoice?: string;
  uxCategoryScores?: UxCategoryScores;
  overallUxScore?: number;
  positives?: StructuredPositive[] | string[];
  painPoints?: StructuredPainPoint[] | string[];
  recommendations?: StructuredRecommendation[] | string[];
  accessibilityNotes?: string;
  accessibilityFindings?: AccessibilityFinding[];
  adoptionLikelihood?: number;
  adoptionReasoning?: string;
  sentiment?: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  frictionScore?: number;
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

export interface FocusGroupTurn {
  speaker: string;
  statement: string;
  referencesPersona: string | null;
  turnType?: "opening" | "challenge" | "agreement" | "partial_agreement" | "moderator" | "conclusion";
}

export interface FocusGroupConflict {
  topic: string;
  personasAgree: string[];
  personasDisagree: string[];
  reason: string;
  segmentExplanation: string;
}

export interface FocusGroupResult {
  summary: string;
  moderatorSummary?: string;
  discussion?: FocusGroupTurn[];
  consensus?: string[];
  openQuestions?: string[];
  researchGaps?: string[];
  conflicts: {
    items: FocusGroupConflict[];
  };
  personaAgreementMatrix?: Record<
    string,
    Record<string, "agree" | "disagree" | "neutral">
  >;
}

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
  analysisReliability?: AnalysisReliability;
  researchGaps?: string[];
  mostImpactfulRecommendation?: string;
  mostAffectedPersona?: { label: string; name: string; frictionScore: number; adoptionLikelihood: number };
  technicalDebtIndicator?: "Low" | "Medium" | "High";
  conversionRisk?: number;
  accessibilityRisk?: "Low" | "Medium" | "High";
};

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
  pagesDiscovered?: number;
  pagesSkipped?: number;
  pagesBlocked?: number;
  crawlCoverage?: CrawlCoverage;
  totalButtons: number;
  totalForms: number;
  totalLinks: number;
  totalInputs: number;
  totalWords: number;
  avgWordCount: number;
  maxDepth: number;
  totalInteractions: number;
  totalImagesWithoutAlt: number;
  totalImages: number;
  totalInputsWithoutLabel: number;
  pagesWithH1: number;
  pagesWithoutH1: number;
  totalButtonsWithoutLabel: number;
  avgLandmarkCount: number;
  pagesWithSkipLink?: number;
  pagesWithLangAttr?: number;
  pagesWithFocusStyles?: number;
  pagesWithAriaLandmarks?: number;
  totalAriaLabels?: number;
  avgTtfbMs: number | null;
  avgLoadMs: number | null;
  slowPages: string[];
  navLabels: string[];
  uniqueCtaLabels: string[];
  primaryActionLabels: string[];
  pageTypes: string[];
  hasPricingPage: boolean;
  hasContactPage: boolean;
  hasDocsPage: boolean;
  pageEvidence: PageEvidence[];
  visionSummaries: string[];
  contentSample: string;
}
