"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Lightbulb,
  User,
  ChevronDown,
} from "lucide-react";

interface TopFinding {
  title: string;
  evidence: string;
  supportedByPersonas: string[];
}

interface TopRisk {
  title: string;
  evidence: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  businessImpact: string;
}

interface AdoptionEntry {
  label: string;
  name: string;
  score: number;
  reasoning?: string;
}

interface ConfidenceDistribution {
  high: number;
  medium: number;
  low: number;
}

interface MostAffectedPersona {
  label: string;
  name: string;
  frictionScore: number;
  adoptionLikelihood: number;
}

interface ExecutiveScorecardProps {
  overallUxScore?: number | null;
  topStrengths?: TopFinding[];
  topRisks?: TopRisk[];
  adoptionComparison?: AdoptionEntry[];
  confidenceDistribution?: ConfidenceDistribution;
  mostImpactfulRecommendation?: string | null;
  mostAffectedPersona?: MostAffectedPersona | null;
  conversionRisk?: number | null;
  accessibilityRisk?: "Low" | "Medium" | "High" | null;
}

const SEVERITY_META: Record<
  string,
  { label: string; color: string; bg: string; dot: string }
> = {
  Critical: {
    label: "Critical",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/30 border-red-500/25",
    dot: "bg-red-500",
  },
  High: {
    label: "High",
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/30 border-orange-500/25",
    dot: "bg-orange-500",
  },
  Medium: {
    label: "Medium",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-500/25",
    dot: "bg-amber-500",
  },
  Low: {
    label: "Low",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-500/25",
    dot: "bg-blue-500",
  },
};

function scoreColor(score: number) {
  if (score >= 75) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 55) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function adoptionBarColor(score: number) {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 55) return "bg-amber-500";
  return "bg-red-500";
}

// Simple FAQ-style accordion row
function AccordionRow({ children, summary }: { children: React.ReactNode; summary: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/50 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex-1 min-w-0 pr-3">{summary}</div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300",
            open && "rotate-180",
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          open ? "max-h-96" : "max-h-0",
        )}
      >
        <div className="px-5 pb-4">{children}</div>
      </div>
    </div>
  );
}

export function ExecutiveScorecard({
  overallUxScore,
  topStrengths = [],
  topRisks = [],
  adoptionComparison = [],
  confidenceDistribution,
  mostImpactfulRecommendation,
  mostAffectedPersona,
  conversionRisk,
  accessibilityRisk,
}: ExecutiveScorecardProps) {
  return (
    <div className="space-y-5">
      {/* ── UX Score row ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Overall UX Score */}
        {overallUxScore != null && (
          <div className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4">
            <BarChart3 className="h-7 w-7 text-(--pf-accent) shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">
                Overall UX Score
              </p>
              <p className={cn("text-3xl font-heading font-bold tabular-nums", scoreColor(overallUxScore))}>
                {overallUxScore}
                <span className="text-sm font-normal text-muted-foreground ml-1">/ 100</span>
              </p>
            </div>
          </div>
        )}

        {/* Conversion Risk */}
        {conversionRisk != null && (
          <div className="rounded-2xl border border-border bg-card px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Conversion Risk
            </p>
            <p className={cn("text-2xl font-bold font-heading tabular-nums", scoreColor(100 - conversionRisk))}>
              {conversionRisk}%
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Friction-based estimate</p>
          </div>
        )}

        {/* Accessibility Risk */}
        {accessibilityRisk && (() => {
          const colors: Record<string, string> = {
            High: "text-red-600 dark:text-red-400",
            Medium: "text-amber-600 dark:text-amber-400",
            Low: "text-emerald-600 dark:text-emerald-400",
          };
          return (
            <div className="rounded-2xl border border-border bg-card px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Accessibility Risk
              </p>
              <p className={cn("text-2xl font-bold font-heading", colors[accessibilityRisk])}>
                {accessibilityRisk}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Based on measured gaps</p>
            </div>
          );
        })()}
      </div>

      {/* ── Most Impactful Recommendation + Most Affected Persona ── */}
      {(mostImpactfulRecommendation || mostAffectedPersona) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {mostImpactfulRecommendation && (
            <div className="rounded-xl border border-border bg-card px-5 py-4 flex items-start gap-3">
              <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Most Impactful Recommendation
                </p>
                <p className="text-sm text-foreground leading-relaxed">
                  {mostImpactfulRecommendation}
                </p>
              </div>
            </div>
          )}
          {mostAffectedPersona && (
            <div className="rounded-xl border border-border bg-card px-5 py-4 flex items-start gap-3">
              <User className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Most Affected Persona
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {mostAffectedPersona.label} — {mostAffectedPersona.name}
                </p>
                <div className="flex gap-3 mt-1.5">
                  <span className="text-xs text-muted-foreground">
                    Friction: <span className="font-semibold text-red-600 dark:text-red-400">{mostAffectedPersona.frictionScore}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Adoption: <span className="font-semibold text-amber-600 dark:text-amber-400">{mostAffectedPersona.adoptionLikelihood}%</span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Top Strengths & Risks — accordion layout ── */}
      <div className="grid gap-5 sm:grid-cols-2">
        {/* Top Strengths */}
        {topStrengths.length > 0 && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="border-b border-border px-5 py-3.5 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <p className="text-sm font-semibold text-foreground">Top Strengths</p>
              <span className="ml-auto text-xs text-muted-foreground">{topStrengths.length}</span>
            </div>
            <div>
              {topStrengths.map((s, i) => (
                <AccordionRow
                  key={i}
                  summary={
                    <p className="text-sm font-medium text-foreground truncate">{s.title}</p>
                  }
                >
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2">{s.evidence}</p>
                  <div className="flex flex-wrap gap-1">
                    {s.supportedByPersonas.map((p) => (
                      <span
                        key={p}
                        className="text-xs rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 px-2 py-0.5"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </AccordionRow>
              ))}
            </div>
          </div>
        )}

        {/* Top Risks */}
        {topRisks.length > 0 && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="border-b border-border px-5 py-3.5 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <p className="text-sm font-semibold text-foreground">Top Risks</p>
              <span className="ml-auto text-xs text-muted-foreground">{topRisks.length}</span>
            </div>
            <div>
              {topRisks.map((r, i) => {
                const sm = SEVERITY_META[r.severity] ?? SEVERITY_META.Medium;
                return (
                  <AccordionRow
                    key={i}
                    summary={
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-1.5 py-0.5 border shrink-0",
                            sm.bg, sm.color,
                          )}
                        >
                          <span className={cn("h-1.5 w-1.5 rounded-full", sm.dot)} />
                          {sm.label}
                        </span>
                        <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                      </div>
                    }
                  >
                    <p className="text-xs text-muted-foreground leading-relaxed mb-1">
                      <span className="font-medium">Evidence:</span> {r.evidence}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <span className="font-medium">Impact:</span> {r.businessImpact}
                    </p>
                  </AccordionRow>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Adoption Comparison ── */}
      {adoptionComparison.length > 0 && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="border-b border-border px-5 py-3.5 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-(--pf-accent)" />
            <p className="text-sm font-semibold text-foreground">
              Adoption Likelihood by Persona
            </p>
            <span className="text-xs text-muted-foreground ml-auto">
              Evidence-grounded
            </span>
          </div>
          <div className="px-5 py-4 space-y-4">
            {adoptionComparison.map((a) => (
              <div key={a.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <span className="text-sm font-medium text-foreground">
                      {a.label}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {a.name}
                    </span>
                  </div>
                  <span
                    className={cn(
                      "text-sm font-bold tabular-nums font-mono",
                      scoreColor(a.score),
                    )}
                  >
                    {a.score}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", adoptionBarColor(a.score))}
                    style={{ width: `${a.score}%` }}
                  />
                </div>
                {a.reasoning && (
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {a.reasoning}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Confidence Distribution ── */}
      {confidenceDistribution && (
        <div className="rounded-xl border border-border bg-card px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Finding Confidence Distribution
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-3 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${confidenceDistribution.high}%` }}
                title={`High confidence: ${confidenceDistribution.high}%`}
              />
              <div
                className="h-full bg-amber-400"
                style={{ width: `${confidenceDistribution.medium}%` }}
                title={`Medium confidence: ${confidenceDistribution.medium}%`}
              />
              <div
                className="h-full bg-slate-300 dark:bg-slate-600"
                style={{ width: `${confidenceDistribution.low}%` }}
                title={`Low confidence: ${confidenceDistribution.low}%`}
              />
            </div>
            <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                High {confidenceDistribution.high}%
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                Med {confidenceDistribution.medium}%
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                Low {confidenceDistribution.low}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
