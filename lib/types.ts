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

export interface PersonaContext {
  id?: string;
  label: string;
  name: string;
  age: number;
  occupation: string;
  technicalLevel: string;
  goals: string;
  frustrations: string;
}

export interface PersonaEvaluation {
  firstImpressions?: string;
  positives?: string[];
  painPoints?: string[];
  recommendations?: string[];
  accessibilityNotes?: string;
  adoptionLikelihood?: number;
  sentiment?: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  frictionScore?: number;
  evidence?: Array<{
    issue: string;
    confidence: number;
    reason: string;
    support: Record<string, string | number>;
  }>;
}

export interface PersonaEvaluationWithLabel extends PersonaEvaluation {
  label: string;
  name: string;
  age: number;
}

export interface FocusGroupResult {
  summary: string;
  conflicts: {
    items: Array<{
      topic: string;
      personasAgree: string[];
      personasDisagree: string[];
      reason: string;
      segmentExplanation: string;
    }>;
  };
}

export type AggregatedInsights = {
  overallSentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  overallFrictionScore: number;
  avgAdoptionLikelihood: number;
  sentimentBreakdown: { POSITIVE: number; NEUTRAL: number; NEGATIVE: number };
  topPainPoints: string[];
  topPositives: string[];
  topRecommendations: string[];
};
