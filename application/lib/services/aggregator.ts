import type { PersonaEvaluationWithLabel, AggregatedInsights } from "../types";

export function aggregateInsights(
  evaluations: PersonaEvaluationWithLabel[],
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
    allPainPoints.push(...(e.painPoints ?? []));
    allPositives.push(...(e.positives ?? []));
    allRecommendations.push(...(e.recommendations ?? []));
  }

  const dominant = (
    Object.entries(sentimentCounts) as Array<
      [keyof typeof sentimentCounts, number]
    >
  ).sort((a, b) => b[1] - a[1])[0][0];

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
  const result: string[] = [];
  for (const item of items) {
    const key = item.trim().toLowerCase();
    if (key.length > 0 && !seen.has(key)) {
      seen.add(key);
      result.push(item.trim());
    }
  }
  return result;
}
