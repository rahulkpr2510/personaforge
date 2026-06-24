import type { PersonaEvaluationWithLabel, AggregatedInsights } from "../types";

export function aggregateInsights(
  evaluations: PersonaEvaluationWithLabel[],
): AggregatedInsights {
  const sentimentCounts = { POSITIVE: 0, NEUTRAL: 0, NEGATIVE: 0 };
  let totalFriction = 0;
  let totalAdoption = 0;
  const allPainPoints: string[] = [];
  const allPositives: string[] = [];
  const allRecommendations: string[] = [];

  for (const e of evaluations) {
    if (e.sentiment) sentimentCounts[e.sentiment]++;
    totalFriction += e.frictionScore ?? 50;
    totalAdoption += e.adoptionLikelihood ?? 50;
    allPainPoints.push(...(e.painPoints ?? []));
    allPositives.push(...(e.positives ?? []));
    allRecommendations.push(...(e.recommendations ?? []));
  }

  const dominant = Object.entries(sentimentCounts).sort(
    (a, b) => b[1] - a[1],
  )[0][0] as "POSITIVE" | "NEUTRAL" | "NEGATIVE";

  return {
    overallSentiment: dominant,
    overallFrictionScore: Math.round(totalFriction / evaluations.length),
    avgAdoptionLikelihood: Math.round(totalAdoption / evaluations.length),
    sentimentBreakdown: sentimentCounts,
    topPainPoints: deduplicateItems(allPainPoints).slice(0, 8),
    topPositives: deduplicateItems(allPositives).slice(0, 6),
    topRecommendations: deduplicateItems(allRecommendations).slice(0, 8),
  };
}

function deduplicateItems(items: string[]): string[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.toLowerCase().slice(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
