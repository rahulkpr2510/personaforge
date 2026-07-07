// components/dashboard/PersonaAccordion.tsx
"use client";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronDown,
  CheckCircle2,
  XCircle,
  Lightbulb,
  AlertTriangle,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { SentimentBadge } from "./SentimentBadge";
import { FrictionBar } from "./FrictionBar";
import { UxCategoryGrid } from "./UxCategoryGrid";
import { EvidenceInspectorDrawer, type FindingDetail } from "./EvidenceInspectorDrawer";
import { cn } from "@/lib/utils";

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseList(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return value.trim() ? [value] : [];
  }
}

function parseJsonField<T>(value: unknown): T[] {
  if (!value) return [];
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StructuredPainPoint {
  issue: string;
  evidence: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  confidence: number;
  confidenceReason?: string;
  evidenceLevel?: "OBSERVED" | "MEASURED" | "INFERRED" | "SPECULATIVE";
  affectedPages?: string[];
  recommendation?: string;
}

export interface StructuredRecommendation {
  issue: string;
  evidence?: string;
  reasoning?: string;
  improvement: string;
  expectedImpact?: string;
  businessImpact?: string;
  evidenceLevel?: "OBSERVED" | "MEASURED" | "INFERRED" | "SPECULATIVE";
  confidence?: number;
}

export interface StructuredPositive {
  finding: string;
  evidence: string;
  confidence: number;
  evidenceLevel?: "OBSERVED" | "MEASURED" | "INFERRED" | "SPECULATIVE";
}

interface PersonaEvaluation {
  id: string;
  label: string;
  name: string;
  age: number;
  occupation: string;
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE" | null;
  frictionScore: number | null;
  adoptionLikelihood: number | null;
  adoptionReasoning: string | null;
  overallUxScore: number | null;
  uxCategoryScores: Record<string, { score: number; reason: string }> | null;
  firstImpressions: string | null;
  personaVoice: string | null;
  positives: string | null;
  painPoints: string | null;
  recommendations: string | null;
  structuredPositives: StructuredPositive[] | null;
  structuredPainPoints: StructuredPainPoint[] | null;
  structuredRecommendations: StructuredRecommendation[] | null;
  accessibilityNotes: string | null;
  accessibilityFindings: Array<{ finding: string; evidence: string; severity: string }> | null;
}

interface PersonaAccordionProps {
  personas: PersonaEvaluation[];
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const EVIDENCE_LEVEL_META: Record<
  string,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  OBSERVED: {
    label: "Observed",
    color: "text-emerald-700 dark:text-emerald-300",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-500/20",
    dot: "bg-emerald-500",
  },
  MEASURED: {
    label: "Measured",
    color: "text-blue-700 dark:text-blue-300",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-500/20",
    dot: "bg-blue-500",
  },
  INFERRED: {
    label: "Inferred",
    color: "text-amber-700 dark:text-amber-300",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-500/20",
    dot: "bg-amber-500",
  },
  SPECULATIVE: {
    label: "Speculative",
    color: "text-slate-600 dark:text-slate-400",
    bg: "bg-slate-50 dark:bg-slate-900/30",
    border: "border-slate-400/20",
    dot: "bg-slate-400",
  },
};

function EvidenceLevelBadge({ level }: { level: string }) {
  const m = EVIDENCE_LEVEL_META[level];
  if (!m) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold",
        m.bg,
        m.border,
        m.color,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", m.dot)} />
      {m.label}
    </span>
  );
}

const SEVERITY_META = {
  Critical: {
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/20 border-red-500/20",
    dot: "bg-red-500",
    label: "Critical",
  },
  High: {
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950/20 border-orange-500/20",
    dot: "bg-orange-500",
    label: "High",
  },
  Medium: {
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/20 border-amber-500/20",
    dot: "bg-amber-500",
    label: "Medium",
  },
  Low: {
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950/20 border-blue-500/20",
    dot: "bg-blue-500",
    label: "Low",
  },
};

function ConfidenceBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500/20"
      : score >= 55
        ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-500/20"
        : "text-slate-500 bg-slate-50 dark:bg-slate-800/40 border-slate-300/40";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
        color,
      )}
    >
      {score}% conf
    </span>
  );
}

function StructuredPainPointList({
  items,
  onInspect,
  personaLabel,
  personaName,
}: {
  items: StructuredPainPoint[];
  onInspect?: (finding: FindingDetail) => void;
  personaLabel: string;
  personaName: string;
}) {
  if (!items.length) return null;
  return (
    <div className="space-y-3">
      {items.map((pp, i) => {
        const sm = SEVERITY_META[pp.severity] ?? SEVERITY_META.Medium;
        return (
          <motion.button
            key={i}
            type="button"
            whileHover={onInspect ? { y: -2, scale: 1.01 } : {}}
            transition={{ type: "spring", stiffness: 220, damping: 18, mass: 0.8 }}
            onClick={() =>
              onInspect?.({
                type: "pain-point",
                issue: pp.issue,
                evidence: pp.evidence,
                severity: pp.severity,
                confidence: pp.confidence,
                confidenceReason: pp.confidenceReason,
                evidenceLevel: pp.evidenceLevel as FindingDetail["evidenceLevel"],
                affectedPages: pp.affectedPages,
                recommendation: pp.recommendation,
                personaLabel,
                personaName,
              })
            }
            className={cn(
              "w-full rounded-xl border p-3.5 space-y-2 text-left transition-all duration-500",
              sm.bg,
              onInspect ? "hover:shadow-md hover:ring-1 hover:ring-(--pf-accent)/20 cursor-pointer group" : "",
            )}
          >
            {/* Header row */}
            <div className="flex items-start gap-2 justify-between flex-wrap">
              <p className="text-sm font-semibold text-foreground flex-1">
                {pp.issue}
              </p>
              <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                {pp.evidenceLevel && <EvidenceLevelBadge level={pp.evidenceLevel} />}
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                    sm.bg,
                    sm.color,
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", sm.dot)} />
                  {sm.label}
                </span>
                <ConfidenceBadge score={pp.confidence} />
              </div>
            </div>

            {/* Evidence */}
            <div className="rounded-lg bg-background/60 border border-border/50 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                Evidence
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {pp.evidence}
              </p>
            </div>

            {/* Affected pages */}
            {pp.affectedPages && pp.affectedPages.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-[10px] text-muted-foreground mr-1">
                  Affected:
                </span>
                {pp.affectedPages.slice(0, 3).map((url, j) => {
                  const label = (() => {
                    try {
                      return new URL(url).pathname || "/";
                    } catch {
                      return url.slice(0, 30);
                    }
                  })();
                  return (
                    <span
                      key={j}
                      className="text-[10px] rounded bg-muted/60 border border-border px-1.5 py-0.5 text-muted-foreground font-mono"
                    >
                      {label}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Recommendation */}
            {pp.recommendation && (
              <div className="flex items-start gap-2 pt-1 border-t border-border/40">
                <Lightbulb className="h-3.5 w-3.5 text-(--pf-accent) shrink-0 mt-0.5" />
                <p className="text-xs text-foreground leading-relaxed">
                  {pp.recommendation}
                </p>
              </div>
            )}

            {/* Inspect hint */}
            {onInspect && (
              <p className="text-[10px] text-(--pf-accent) opacity-0 group-hover:opacity-100 transition-opacity">
                Click to inspect evidence →
              </p>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

function FallbackBulletList({
  items,
  icon,
  colorClass,
  bgClass,
}: {
  items: string[];
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
}) {
  if (!items.length) return null;
  return (
    <ul className={`rounded-xl ${bgClass} p-3.5 space-y-2.5`}>
      {items.map((item, i) => (
        <li
          key={i}
          className="flex items-start gap-2.5 text-sm text-foreground"
        >
          <span className={`mt-0.5 shrink-0 ${colorClass}`}>{icon}</span>
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function StructuredRecommendationList({
  items,
  onInspect,
  personaLabel,
  personaName,
}: {
  items: StructuredRecommendation[];
  onInspect?: (finding: FindingDetail) => void;
  personaLabel: string;
  personaName: string;
}) {
  if (!items.length) return null;
  return (
    <div className="space-y-3">
      {items.map((rec, i) => (
        <motion.button
          key={i}
          type="button"
          whileHover={{ y: -2, scale: 1.01 }}
          transition={{ type: "spring", stiffness: 220, damping: 18, mass: 0.8 }}
          onClick={() =>
            onInspect?.({
              type: "recommendation",
              improvement: rec.improvement,
              issue: rec.issue,
              evidence: rec.evidence ?? "",
              reasoning: rec.reasoning,
              expectedImpact: rec.expectedImpact,
              businessImpact: rec.businessImpact,
              evidenceLevel: (rec.evidenceLevel ?? "INFERRED") as FindingDetail["evidenceLevel"],
              confidence: rec.confidence,
              personaLabel,
              personaName,
            })
          }
          className="w-full rounded-xl border border-(--pf-accent)/15 bg-(--pf-accent-soft) p-3.5 space-y-2 text-left transition-all hover:shadow-sm hover:ring-1 hover:ring-(--pf-accent)/30 cursor-pointer group"
        >
          {/* Issue → Improvement chain */}
          <div className="flex items-start gap-2 flex-wrap">
            <p className="text-xs text-muted-foreground">{rec.issue}</p>
            <ArrowRight className="h-3 w-3 text-(--pf-accent) shrink-0 mt-0.5" />
            <p className="text-sm font-semibold text-(--pf-accent)">
              {rec.improvement}
            </p>
          </div>

          {/* Evidence level + confidence */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {rec.evidenceLevel && <EvidenceLevelBadge level={rec.evidenceLevel} />}
            {rec.confidence != null && <ConfidenceBadge score={rec.confidence} />}
          </div>

          {/* Evidence */}
          {rec.evidence && (
            <div className="rounded-lg bg-background/60 border border-border/50 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                Evidence
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {rec.evidence}
              </p>
            </div>
          )}

          {/* Reasoning */}
          {rec.reasoning && (
            <p className="text-xs text-muted-foreground leading-relaxed italic">
              {rec.reasoning}
            </p>
          )}

          {/* Expected impact */}
          {rec.expectedImpact && (
            <div className="flex items-start gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-(--pf-accent) shrink-0">
                Expected impact:
              </span>
              <span className="text-xs text-(--pf-accent) leading-relaxed">
                {rec.expectedImpact}
              </span>
            </div>
          )}

          {/* Inspect hint */}
          <p className="text-[10px] text-(--pf-accent) opacity-0 group-hover:opacity-100 transition-opacity">
            Click to inspect full evidence chain →
          </p>
        </motion.button>
      ))}
    </div>
  );
}

// ─── Avatar colours ────────────────────────────────────────────────────────────

const sentimentHeaderBg = {
  POSITIVE:
    "bg-linear-to-r from-[var(--pf-green-soft)] to-card border-[var(--pf-green)]/20",
  NEUTRAL: "bg-linear-to-r from-muted/60 to-card border-border",
  NEGATIVE: "bg-linear-to-r from-destructive/6 to-card border-destructive/20",
};

const avatarBg = [
  "bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400",
  "bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400",
  "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
  "bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400",
  "bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400",
  "bg-cyan-100 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400",
];

function getAvatarBg(label: string) {
  let h = 0;
  for (let i = 0; i < label.length; i++)
    h = label.charCodeAt(i) + ((h << 5) - h);
  return avatarBg[Math.abs(h) % avatarBg.length];
}

// ─── UX Category Breakdown (collapsible within persona) ──────────────────────

function UxCategoryBreakdown({ scores }: { scores: Record<string, { score: number; reason: string }> }) {
  const [open, setOpen] = useState(false);
  const count = Object.keys(scores).length;
  const avg = count > 0
    ? Math.round(Object.values(scores).reduce((s, v) => s + v.score, 0) / count)
    : 0;

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <p className="text-xs font-semibold text-foreground">UX Category Breakdown</p>
          <span className="text-[10px] bg-muted/60 text-muted-foreground rounded-full px-2 py-0.5">
            {count} categories · avg {avg}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-300",
            open && "rotate-180",
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="ux-grid"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-border">
              <UxCategoryGrid scores={scores} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function PersonaAccordion({ personas }: PersonaAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(
    personas[0]?.id ?? null,
  );
  const [inspectedFinding, setInspectedFinding] = useState<FindingDetail | null>(null);
  const handleInspect = useCallback((f: FindingDetail) => setInspectedFinding(f), []);
  const handleCloseInspector = useCallback(() => setInspectedFinding(null), []);

  return (
    <>
    <div className="space-y-3">
      {personas.map((persona) => {
        const isOpen = openId === persona.id;

        // Structured data (already properly typed from DB)
        const structuredPainPoints = persona.structuredPainPoints ?? [];
        const structuredRecs = persona.structuredRecommendations ?? [];
        const structuredPositives = persona.structuredPositives ?? [];
        const accessibilityFindings = persona.accessibilityFindings ?? [];

        // Legacy fallbacks
        const positivesLegacy = parseList(persona.positives);
        const painPointsLegacy = parseList(persona.painPoints);
        const recommendationsLegacy = parseList(persona.recommendations);

        const hasStructuredPainPoints = structuredPainPoints.length > 0;
        const hasStructuredRecs = structuredRecs.length > 0;
        const hasStructuredPositives = structuredPositives.length > 0;

        const positiveCount = hasStructuredPositives
          ? structuredPositives.length
          : positivesLegacy.length;
        const painPointCount = hasStructuredPainPoints
          ? structuredPainPoints.length
          : painPointsLegacy.length;

        const headerBg = persona.sentiment
          ? sentimentHeaderBg[persona.sentiment]
          : "bg-card border-border";

        const criticalCount = structuredPainPoints.filter(
          (p) => p.severity === "Critical",
        ).length;
        const highCount = structuredPainPoints.filter(
          (p) => p.severity === "High",
        ).length;

        return (
          <div
            key={persona.id}
            className={cn(
              "rounded-2xl border overflow-hidden transition-all duration-200",
              isOpen
                ? "border-(--pf-accent)/35 shadow-[0_4px_24px_-6px_var(--pf-accent,#6366f1)18]"
                : "border-border hover:border-(--pf-accent)/25 hover:shadow-sm",
            )}
          >
            {/* ── Header ── */}
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : persona.id)}
              className="w-full text-left"
            >
              <div
                className={cn("flex items-center gap-4 px-5 py-4", headerBg)}
              >
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-heading font-bold text-base",
                    getAvatarBg(persona.label),
                  )}
                >
                  {persona.label.charAt(0)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-foreground">
                      {persona.label}
                    </p>
                    {persona.sentiment && (
                      <SentimentBadge sentiment={persona.sentiment} />
                    )}
                    {criticalCount > 0 && (
                      <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-500/20 rounded-full px-2 py-0.5">
                        {criticalCount} Critical
                      </span>
                    )}
                    {!criticalCount && highCount > 0 && (
                      <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/30 border border-orange-500/20 rounded-full px-2 py-0.5">
                        {highCount} High risk
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {persona.name} · {persona.age}y · {persona.occupation}
                  </p>
                </div>

                <div className="hidden sm:flex items-center gap-2 shrink-0">
                  {persona.overallUxScore != null && (
                    <span className="rounded-full bg-background/60 border border-border px-2.5 py-0.5 text-xs font-bold text-foreground tabular-nums">
                      UX {persona.overallUxScore}/100
                    </span>
                  )}
                  {persona.adoptionLikelihood != null && (
                    <span className="rounded-full bg-background/60 border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      {persona.adoptionLikelihood}% adoption
                    </span>
                  )}
                  {positiveCount > 0 && (
                    <span className="flex items-center gap-1 rounded-full bg-(--pf-green-soft) border border-(--pf-green)/20 px-2.5 py-0.5 text-xs font-medium text-(--pf-green)">
                      <ThumbsUp className="h-3 w-3" />
                      {positiveCount}
                    </span>
                  )}
                  {painPointCount > 0 && (
                    <span className="flex items-center gap-1 rounded-full bg-destructive/8 border border-destructive/15 px-2.5 py-0.5 text-xs font-medium text-destructive">
                      <ThumbsDown className="h-3 w-3" />
                      {painPointCount}
                    </span>
                  )}
                </div>

                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="shrink-0"
                >
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                </motion.div>
              </div>

              {/* Collapsed preview */}
              {!isOpen && (
                <div className="bg-card px-5 pb-4 pt-0">
                  {persona.frictionScore != null && (
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-xs text-muted-foreground shrink-0 w-12">
                        Friction
                      </span>
                      <div className="flex-1">
                        <FrictionBar
                          score={persona.frictionScore}
                          showLabel={false}
                        />
                      </div>
                      <span
                        className={cn(
                          "text-xs font-mono font-bold tabular-nums shrink-0",
                          persona.frictionScore <= 33
                            ? "text-(--pf-green)"
                            : persona.frictionScore <= 66
                              ? "text-(--pf-amber)"
                              : "text-destructive",
                        )}
                      >
                        {persona.frictionScore.toFixed(0)}/100
                      </span>
                    </div>
                  )}
                  {persona.personaVoice ? (
                    <p className="mt-2 text-xs text-muted-foreground italic line-clamp-1">
                      &ldquo;{persona.personaVoice}&rdquo;
                    </p>
                  ) : persona.firstImpressions ? (
                    <p className="mt-2 text-xs text-muted-foreground italic line-clamp-1">
                      &ldquo;{persona.firstImpressions}&rdquo;
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-(--pf-accent) font-medium">
                    Click to read full report ↓
                  </p>
                </div>
              )}
            </button>

            {/* ── Expanded Body ── */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="body"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-border/50 bg-card px-5 pb-6 pt-5 space-y-6">
                    {/* Friction + UX score row */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      {persona.frictionScore != null && (
                        <div className="rounded-xl border border-border bg-muted/20 p-4">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                            Friction Score
                          </p>
                          <FrictionBar
                            score={persona.frictionScore}
                            showLabel
                          />
                        </div>
                      )}
                      {persona.overallUxScore != null && (
                        <div className="rounded-xl border border-border bg-muted/20 p-4">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                            Overall UX Score
                          </p>
                          <p className="text-3xl font-heading font-bold text-foreground tabular-nums">
                            {persona.overallUxScore}
                            <span className="text-sm font-normal text-muted-foreground ml-1">
                              / 100
                            </span>
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Persona voice / first impression */}
                    {(persona.personaVoice || persona.firstImpressions) && (
                      <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                          <Sparkles className="h-3.5 w-3.5" />
                          {persona.personaVoice ? "In Their Own Words" : "First Impression"}
                        </p>
                        <p className="text-sm text-foreground leading-relaxed italic">
                          &ldquo;
                          {persona.personaVoice || persona.firstImpressions}
                          &rdquo;
                        </p>
                      </div>
                    )}

                    {/* UX Category Breakdown — collapsible */}
                    {persona.uxCategoryScores && (
                      <UxCategoryBreakdown scores={persona.uxCategoryScores} />
                    )}

                    {/* Structured Positives */}
                    {hasStructuredPositives && (
                      <div>
                        <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-(--pf-green)">
                          <CheckCircle2 className="h-3.5 w-3.5" /> What works
                        </p>
                        <div className="space-y-2.5">
                          {structuredPositives.map((pos, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() =>
                                handleInspect({
                                  type: "positive",
                                  finding: pos.finding,
                                  evidence: pos.evidence,
                                  confidence: pos.confidence,
                                  evidenceLevel: pos.evidenceLevel as FindingDetail["evidenceLevel"],
                                  personaLabel: persona.label,
                                  personaName: persona.name,
                                })
                              }
                              className="w-full rounded-xl border border-(--pf-green)/15 bg-(--pf-green-soft) p-3.5 text-left transition-all hover:shadow-sm hover:ring-1 hover:ring-(--pf-green)/30 cursor-pointer group"
                            >
                              <div className="flex items-start gap-2 justify-between flex-wrap mb-1.5">
                                <p className="text-sm text-foreground font-medium">
                                  {pos.finding}
                                </p>
                                <div className="flex items-center gap-1.5">
                                  {pos.evidenceLevel && <EvidenceLevelBadge level={pos.evidenceLevel} />}
                                  <ConfidenceBadge score={pos.confidence} />
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed italic">
                                Evidence: {pos.evidence}
                              </p>
                              <p className="text-[10px] text-(--pf-green) opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                                Click to inspect →
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {!hasStructuredPositives && positivesLegacy.length > 0 && (
                      <div>
                        <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-(--pf-green)">
                          <CheckCircle2 className="h-3.5 w-3.5" /> What works
                        </p>
                        <FallbackBulletList
                          items={positivesLegacy}
                          icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                          colorClass="text-[var(--pf-green)]"
                          bgClass="bg-[var(--pf-green-soft)] border border-[var(--pf-green)]/15"
                        />
                      </div>
                    )}

                    {/* Structured Pain Points */}
                    {hasStructuredPainPoints && (
                      <div>
                        <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-destructive">
                          <XCircle className="h-3.5 w-3.5" /> Pain Points
                          <span className="text-[10px] font-normal text-muted-foreground">
                            (with severity & evidence)
                          </span>
                        </p>
                        <StructuredPainPointList
                          items={structuredPainPoints}
                          onInspect={handleInspect}
                          personaLabel={persona.label}
                          personaName={persona.name}
                        />
                      </div>
                    )}

                    {!hasStructuredPainPoints && painPointsLegacy.length > 0 && (
                      <div>
                        <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-destructive">
                          <XCircle className="h-3.5 w-3.5" /> Pain Points
                        </p>
                        <FallbackBulletList
                          items={painPointsLegacy}
                          icon={<XCircle className="h-3.5 w-3.5" />}
                          colorClass="text-destructive"
                          bgClass="bg-destructive/5 border border-destructive/12"
                        />
                      </div>
                    )}

                    {/* Structured Recommendations */}
                    {hasStructuredRecs && (
                      <div>
                        <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-(--pf-accent)">
                          <Lightbulb className="h-3.5 w-3.5" /> Recommendations
                          <span className="text-[10px] font-normal text-muted-foreground">
                            (issue → evidence → improvement → impact)
                          </span>
                        </p>
                        <StructuredRecommendationList
                          items={structuredRecs}
                          onInspect={handleInspect}
                          personaLabel={persona.label}
                          personaName={persona.name}
                        />
                      </div>
                    )}

                    {!hasStructuredRecs && recommendationsLegacy.length > 0 && (
                      <div>
                        <p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-(--pf-accent)">
                          <Lightbulb className="h-3.5 w-3.5" /> Recommendations
                        </p>
                        <FallbackBulletList
                          items={recommendationsLegacy}
                          icon={<Lightbulb className="h-3.5 w-3.5" />}
                          colorClass="text-[var(--pf-accent)]"
                          bgClass="bg-[var(--pf-accent-soft)] border border-[var(--pf-accent)]/15"
                        />
                      </div>
                    )}

                    {/* Adoption Reasoning */}
                    {persona.adoptionReasoning && (
                      <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                        <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                          Adoption Reasoning ({persona.adoptionLikelihood}%)
                        </p>
                        <p className="text-sm text-foreground leading-relaxed">
                          {persona.adoptionReasoning}
                        </p>
                      </div>
                    )}

                    {/* Accessibility */}
                    {accessibilityFindings.length > 0 && (
                      <div>
                        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                          <ShieldAlert className="h-3.5 w-3.5" />
                          Accessibility Findings
                        </p>
                        <div className="space-y-2">
                          {accessibilityFindings.map((f, i) => {
                            const sm =
                              SEVERITY_META[
                                f.severity as keyof typeof SEVERITY_META
                              ] ?? SEVERITY_META.Medium;
                            return (
                              <div
                                key={i}
                                className="rounded-xl border border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20 px-3.5 py-3"
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <span
                                    className={cn(
                                      "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold",
                                      sm.bg,
                                      sm.color,
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        "h-1.5 w-1.5 rounded-full",
                                        sm.dot,
                                      )}
                                    />
                                    {sm.label}
                                  </span>
                                  <p className="text-xs font-medium text-foreground">
                                    {f.finding}
                                  </p>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                  {f.evidence}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {!accessibilityFindings.length && persona.accessibilityNotes && (
                      <div className="rounded-xl border border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20 p-4">
                        <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Accessibility Notes
                        </p>
                        <p className="text-sm text-foreground leading-relaxed">
                          {persona.accessibilityNotes}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
    <EvidenceInspectorDrawer finding={inspectedFinding} onClose={handleCloseInspector} />
    </>
  );
}
