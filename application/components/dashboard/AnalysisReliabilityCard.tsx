"use client";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { ShieldCheck, AlertCircle } from "lucide-react";

interface AnalysisReliability {
  score: number;
  evidenceBacked: number;
  measured: number;
  inferred: number;
  speculative: number;
  totalFindings: number;
  reliabilityNote?: string;
}

interface AnalysisReliabilityCardProps {
  reliability: AnalysisReliability;
  qualityScore?: number;
}

type EvidenceLevel = "OBSERVED" | "MEASURED" | "INFERRED" | "SPECULATIVE";

const LEVEL_META: Record<
  EvidenceLevel,
  { label: string; color: string; bg: string; border: string; dot: string; desc: string }
> = {
  OBSERVED: {
    label: "Observed",
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-500/20",
    dot: "bg-emerald-500",
    desc: "Verified directly from crawl data",
  },
  MEASURED: {
    label: "Measured",
    color: "text-blue-700 dark:text-blue-300",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-500/20",
    dot: "bg-blue-500",
    desc: "Calculated from numeric metrics",
  },
  INFERRED: {
    label: "Inferred",
    color: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-500/20",
    dot: "bg-amber-500",
    desc: "Reasonable conclusion from evidence",
  },
  SPECULATIVE: {
    label: "Speculative",
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-50 dark:bg-slate-900/30",
    border: "border-slate-400/20",
    dot: "bg-slate-400",
    desc: "Low-confidence assumption",
  },
};

function reliabilityColor(score: number) {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-blue-600 dark:text-blue-400";
  if (score >= 40) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function reliabilityLabel(score: number) {
  if (score >= 80) return "High";
  if (score >= 60) return "Moderate";
  if (score >= 40) return "Limited";
  return "Low";
}

function EvidenceLevelBadge({ level }: { level: EvidenceLevel }) {
  const m = LEVEL_META[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
        m.bg,
        m.border,
        m.color,
      )}
      title={m.desc}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />
      {m.label}
    </span>
  );
}

export function AnalysisReliabilityCard({
  reliability,
  qualityScore,
}: AnalysisReliabilityCardProps) {
  const { score, evidenceBacked, measured, inferred, speculative, totalFindings, reliabilityNote } =
    reliability;

  const observedOnly = evidenceBacked - measured;
  const pct = (n: number) =>
    totalFindings > 0 ? Math.round((n / totalFindings) * 100) : 0;

  const levels: Array<{ key: EvidenceLevel; count: number }> = [
    { key: "OBSERVED", count: observedOnly },
    { key: "MEASURED", count: measured },
    { key: "INFERRED", count: inferred },
    { key: "SPECULATIVE", count: speculative },
  ];

  return (
    <motion.div 
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 220, damping: 18, mass: 0.8 }}
      className="rounded-2xl border border-border bg-card overflow-hidden hover:shadow-2xl transition-shadow duration-500"
    >
      {/* Header */}
      <div className="border-b border-border px-5 py-3.5 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-(--pf-accent)" />
        <p className="text-sm font-semibold text-foreground">Analysis Reliability</p>
        <span className="text-xs text-muted-foreground ml-auto">
          How evidence-backed are these findings?
        </span>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Score row */}
        <div className="flex items-center gap-5">
          <div className="shrink-0 text-center">
            <p
              className={cn(
                "text-4xl font-heading font-bold tabular-nums leading-none",
                reliabilityColor(score),
              )}
            >
              {score}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {reliabilityLabel(score)} reliability
            </p>
          </div>

          {/* Stacked bar */}
          <div className="flex-1">
            <div className="h-3 rounded-full overflow-hidden flex gap-px bg-muted">
              {pct(observedOnly) > 0 && (
                <div
                  className="h-full bg-emerald-500 transition-all duration-700"
                  style={{ width: `${pct(observedOnly)}%` }}
                  title={`Observed: ${observedOnly} findings`}
                />
              )}
              {pct(measured) > 0 && (
                <div
                  className="h-full bg-blue-500 transition-all duration-700"
                  style={{ width: `${pct(measured)}%` }}
                  title={`Measured: ${measured} findings`}
                />
              )}
              {pct(inferred) > 0 && (
                <div
                  className="h-full bg-amber-400 transition-all duration-700"
                  style={{ width: `${pct(inferred)}%` }}
                  title={`Inferred: ${inferred} findings`}
                />
              )}
              {pct(speculative) > 0 && (
                <div
                  className="h-full bg-slate-300 dark:bg-slate-600 transition-all duration-700"
                  style={{ width: `${pct(speculative)}%` }}
                  title={`Speculative: ${speculative} findings`}
                />
              )}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
              {levels.map(({ key, count }) =>
                count > 0 ? (
                  <span key={key} className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className={cn("h-1.5 w-1.5 rounded-full", LEVEL_META[key].dot)} />
                    {LEVEL_META[key].label}: {count}
                  </span>
                ) : null,
              )}
            </div>
          </div>
        </div>

        {/* Evidence level legend */}
        <div className="grid grid-cols-2 gap-2">
          {levels.map(({ key, count }) => {
            const m = LEVEL_META[key];
            return (
              <div
                key={key}
                className={cn(
                  "rounded-lg border px-3 py-2 flex items-start gap-2",
                  m.bg,
                  m.border,
                )}
              >
                <span className={cn("h-2 w-2 rounded-full mt-1 shrink-0", m.dot)} />
                <div className="min-w-0">
                  <p className={cn("text-xs font-semibold", m.color)}>
                    {m.label}
                    <span className="ml-1.5 font-normal opacity-70">{count} findings</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{m.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Note */}
        {reliabilityNote && (
          <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
            <AlertCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">{reliabilityNote}</p>
          </div>
        )}

        {/* Quality gate score if available */}
        {qualityScore != null && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground border-t border-border pt-3">
            <ShieldCheck className="h-3.5 w-3.5 text-(--pf-accent)" />
            <span>Quality gate score: <span className="font-semibold text-foreground">{qualityScore}/100</span></span>
          </div>
        )}
      </div>

      {/* Definition footer */}
      <div className="border-t border-border px-5 py-3 bg-muted/20">
        <p className="text-[10px] text-muted-foreground">
          <span className="font-semibold">Evidence Levels:</span>{" "}
          OBSERVED (crawl verified) · MEASURED (numeric calculation) · INFERRED (reasonable conclusion) · SPECULATIVE (assumption)
        </p>
      </div>
    </motion.div>
  );
}

// Export the level meta for use in other components
export { LEVEL_META };
export type { EvidenceLevel };
