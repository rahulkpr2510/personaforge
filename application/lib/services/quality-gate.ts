
import type {
  PersonaEvaluationWithLabel,
  StructuredPainPoint,
  StructuredRecommendation,
  StructuredPositive,
} from "../types";

export interface QualityGateResult {
  passed: boolean;
  failures: string[];
  warnings: string[];
  score: number;
}

const ABSOLUTE_ABSENCE_PATTERNS = [
  /\bthere is no\b/i,
  /\bthere are no\b/i,
  /\bthe site (lacks|doesn't have|does not have)\b/i,
  /\bthe website (lacks|doesn't have|does not have)\b/i,
  /\bno pricing page\b/i,
  /\bno (api|developer) docs?\b/i,
  /\bno contact page\b/i,
  /\bno support page\b/i,
  /\bdoes not (offer|provide|include|have)\b/i,
  /\bdoesn't (offer|provide|include|have)\b/i,
  /\bnot available on (this|the) site\b/i,
  /\bmissing entirely\b/i,
  /\bcompletely absent\b/i,
  /\bnowhere to be found\b/i,
];

function hasAbsoluteAbsenceClaim(text: string): boolean {
  return ABSOLUTE_ABSENCE_PATTERNS.some((re) => re.test(text));
}

// ─── Similarity Check ────────────────────────────────────────────────────────

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().slice(0, 100);
}

function similarity(a: string, b: string): number {
  const na = normalizeText(a);
  const nb = normalizeText(b);
  if (na === nb) return 1.0;

  const wordsA = new Set(na.split(/\s+/));
  const wordsB = new Set(nb.split(/\s+/));
  const intersection = [...wordsA].filter((w) => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  return union === 0 ? 0 : intersection / union;
}

// ─── Checks ──────────────────────────────────────────────────────────────────

function checkScopedLanguage(
  evaluations: PersonaEvaluationWithLabel[],
): string[] {
  const violations: string[] = [];

  for (const e of evaluations) {
    for (const pp of e.painPoints ?? []) {
      const text = typeof pp === "string" ? pp : pp.issue + " " + (pp as StructuredPainPoint).evidence;
      if (hasAbsoluteAbsenceClaim(text)) {
        violations.push(`[${e.label}] Pain point uses absolute absence language: "${text.slice(0, 80)}..."`);
      }
    }
    for (const rec of e.recommendations ?? []) {
      const text = typeof rec === "string" ? rec : (rec as StructuredRecommendation).reasoning ?? "";
      if (hasAbsoluteAbsenceClaim(text)) {
        violations.push(`[${e.label}] Recommendation uses absolute absence language: "${text.slice(0, 80)}..."`);
      }
    }
  }

  return violations;
}

function checkDuplicatePainPoints(
  evaluations: PersonaEvaluationWithLabel[],
): string[] {
  const warnings: string[] = [];

  if (evaluations.length < 2) return warnings;

  // Check cross-persona duplicates (>80% similarity is a flag)
  for (let i = 0; i < evaluations.length; i++) {
    for (let j = i + 1; j < evaluations.length; j++) {
      const aPoints = (evaluations[i].painPoints ?? []).map((p) =>
        typeof p === "string" ? p : p.issue,
      );
      const bPoints = (evaluations[j].painPoints ?? []).map((p) =>
        typeof p === "string" ? p : p.issue,
      );

      let dupCount = 0;
      for (const a of aPoints) {
        for (const b of bPoints) {
          if (similarity(a, b) > 0.8) dupCount++;
        }
      }

      const maxPossible = Math.min(aPoints.length, bPoints.length);
      if (maxPossible > 0 && dupCount / maxPossible > 0.7) {
        warnings.push(
          `[${evaluations[i].label}] and [${evaluations[j].label}] have very similar pain points (${Math.round((dupCount / maxPossible) * 100)}% overlap). Personas may not be differentiated enough.`,
        );
      }
    }
  }

  return warnings;
}

function checkEvidencePresence(
  evaluations: PersonaEvaluationWithLabel[],
): string[] {
  const failures: string[] = [];

  for (const e of evaluations) {
    const emptyPainPoints = (e.painPoints ?? []).filter((pp) => {
      if (typeof pp === "string") return false;
      return !pp.evidence || pp.evidence.trim().length < 10;
    });

    if (emptyPainPoints.length > 0) {
      failures.push(
        `[${e.label}] ${emptyPainPoints.length} pain point(s) have empty or insufficient evidence field`,
      );
    }

    const emptyRecs = (e.recommendations ?? []).filter((rec) => {
      if (typeof rec === "string") return false;
      const r = rec as StructuredRecommendation;
      return !r.evidence || r.evidence.trim().length < 10;
    });

    if (emptyRecs.length > 0) {
      failures.push(
        `[${e.label}] ${emptyRecs.length} recommendation(s) have empty or insufficient evidence field`,
      );
    }
  }

  return failures;
}

function checkConfidenceCalibration(
  evaluations: PersonaEvaluationWithLabel[],
  pageCount: number,
): string[] {
  const warnings: string[] = [];

  for (const e of evaluations) {
    for (const pp of e.painPoints ?? []) {
      if (typeof pp === "string") continue;
      const p = pp as StructuredPainPoint;
      // SPECULATIVE findings must not have high confidence
      if (p.evidenceLevel === "SPECULATIVE" && p.confidence > 49) {
        warnings.push(
          `[${e.label}] SPECULATIVE finding has confidence ${p.confidence}% — must be ≤49%. Issue: "${p.issue.slice(0, 50)}"`,
        );
      }
      // INFERRED findings must not claim ≥80% confidence
      if (p.evidenceLevel === "INFERRED" && p.confidence >= 80) {
        warnings.push(
          `[${e.label}] INFERRED finding has confidence ${p.confidence}% — must be ≤79%. Issue: "${p.issue.slice(0, 50)}"`,
        );
      }
    }

    // Single-page analysis: no finding should exceed 85%
    if (pageCount <= 1) {
      for (const ev of e.evidence ?? []) {
        if (ev.confidence > 85) {
          warnings.push(
            `[${e.label}] Single-page analysis has finding with ${ev.confidence}% confidence — exceeds 85% cap for 1-page crawls`,
          );
        }
      }
    }
  }

  return warnings;
}

function checkScoreVariance(evaluations: PersonaEvaluationWithLabel[]): string[] {
  const warnings: string[] = [];

  if (evaluations.length < 2) return warnings;

  // Check that overall UX scores differ by at least 5 points
  const uxScores = evaluations
    .map((e) => e.overallUxScore)
    .filter((s): s is number => s != null);

  if (uxScores.length >= 2) {
    const min = Math.min(...uxScores);
    const max = Math.max(...uxScores);
    if (max - min < 5) {
      warnings.push(
        `All persona UX scores are within ${max - min} points of each other (${uxScores.join(", ")}). Personas may not be producing sufficiently differentiated evaluations.`,
      );
    }
  }

  // Check adoption likelihood variance
  const adoptionScores = evaluations
    .map((e) => e.adoptionLikelihood)
    .filter((s): s is number => s != null);

  if (adoptionScores.length >= 2) {
    const min = Math.min(...adoptionScores);
    const max = Math.max(...adoptionScores);
    if (max - min < 10) {
      warnings.push(
        `Adoption likelihood scores have low variance (range: ${max - min} points). Different personas should experience the site differently.`,
      );
    }
  }

  return warnings;
}

function checkGenericRecommendations(
  evaluations: PersonaEvaluationWithLabel[],
): string[] {
  const warnings: string[] = [];

  const GENERIC_PATTERNS = [
    /^improve the (cta|call.to.action|navigation|ux|ui|design)$/i,
    /^add a (cta|call.to.action|search|menu)$/i,
    /^make it (more|less) (intuitive|accessible|user.friendly|clear)$/i,
    /^consider (adding|improving|redesigning)/i,
    /^enhance the (user|overall) experience$/i,
    /^optimize for (mobile|performance|accessibility)$/i,
  ];

  for (const e of evaluations) {
    for (const rec of e.recommendations ?? []) {
      const text = typeof rec === "string" ? rec : (rec as StructuredRecommendation).improvement;
      if (!text) continue;
      if (GENERIC_PATTERNS.some((re) => re.test(text.trim()))) {
        warnings.push(
          `[${e.label}] Generic recommendation detected: "${text.slice(0, 80)}"`,
        );
      }
    }
  }

  return warnings;
}

// ─── Main Gate ───────────────────────────────────────────────────────────────

export function runQualityGate(
  evaluations: PersonaEvaluationWithLabel[],
  opts?: { pageCount?: number },
): QualityGateResult {
  const pageCount = opts?.pageCount ?? 1;
  const failures: string[] = [];
  const warnings: string[] = [];

  // Hard failures
  failures.push(...checkScopedLanguage(evaluations));
  failures.push(...checkEvidencePresence(evaluations));

  // Warnings (do not block but are logged)
  warnings.push(...checkDuplicatePainPoints(evaluations));
  warnings.push(...checkConfidenceCalibration(evaluations, pageCount));
  warnings.push(...checkScoreVariance(evaluations));
  warnings.push(...checkGenericRecommendations(evaluations));

  // Score: starts at 100, deduct for failures and warnings
  const score = Math.max(
    0,
    100 - failures.length * 15 - warnings.length * 5,
  );

  const passed = failures.length === 0;

  if (failures.length > 0) {
    console.warn(
      `[quality-gate] FAILED with ${failures.length} violation(s):`,
      failures,
    );
  }
  if (warnings.length > 0) {
    console.warn(
      `[quality-gate] ${warnings.length} warning(s):`,
      warnings,
    );
  }

  return { passed, failures, warnings, score };
}
