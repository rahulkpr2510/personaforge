"use client";
import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface UxCategoryScore {
  score: number;
  reason: string;
  confidence?: number;
  evidenceLevel?: string;
  observedMetrics?: string[];
}

interface UxCategoryScores {
  navigation?: UxCategoryScore;
  accessibility?: UxCategoryScore;
  contentClarity?: UxCategoryScore;
  visualHierarchy?: UxCategoryScore;
  trustSignals?: UxCategoryScore;
  interactionQuality?: UxCategoryScore;
  conversionClarity?: UxCategoryScore;
  performanceIndicators?: UxCategoryScore;
  consistency?: UxCategoryScore;
  errorPrevention?: UxCategoryScore;
}

const CATEGORY_META: Record<
  string,
  { label: string; description: string; weight: number; metrics: string[] }
> = {
  navigation: {
    label: "Navigation",
    description: "Clarity and discoverability of site structure",
    weight: 1.2,
    metrics: ["nav links", "primary CTA", "avg click depth", "broken links"],
  },
  accessibility: {
    label: "Accessibility",
    description: "WCAG compliance and assistive technology support",
    weight: 1.0,
    metrics: ["alt text coverage", "form labels", "ARIA attributes", "heading hierarchy", "focus states"],
  },
  contentClarity: {
    label: "Content Clarity",
    description: "Readability, hierarchy, and information density",
    weight: 1.1,
    metrics: ["heading structure", "paragraph density", "avg word count", "duplicate headings"],
  },
  visualHierarchy: {
    label: "Visual Hierarchy",
    description: "Layout emphasis and attention guidance",
    weight: 0.9,
    metrics: ["H1 presence", "button count", "image count", "CTA density"],
  },
  trustSignals: {
    label: "Trust Signals",
    description: "Credibility indicators and social proof",
    weight: 1.2,
    metrics: ["pricing page", "contact page", "docs page", "form count"],
  },
  interactionQuality: {
    label: "Interaction Quality",
    description: "Button states, form UX, and micro-feedback",
    weight: 1.0,
    metrics: ["form count", "input labels", "CTA texts", "interaction count"],
  },
  conversionClarity: {
    label: "Conversion Clarity",
    description: "CTA prominence and primary action guidance",
    weight: 1.1,
    metrics: ["primary CTA", "CTA count", "button density", "conversion flow"],
  },
  performanceIndicators: {
    label: "Performance",
    description: "Load times and perceived responsiveness",
    weight: 0.9,
    metrics: ["avg TTFB", "avg load time", "slow pages", "page weight"],
  },
  consistency: {
    label: "Consistency",
    description: "Pattern reuse and design language coherence",
    weight: 0.8,
    metrics: ["nav structure", "CTA patterns", "heading levels", "page types"],
  },
  errorPrevention: {
    label: "Error Prevention",
    description: "Form validation, labels, and guidance",
    weight: 0.9,
    metrics: ["inputs without labels", "form validation", "required field indicators"],
  },
};

function scoreColor(score: number) {
  if (score >= 75) return { text: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500" };
  if (score >= 55) return { text: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500" };
  return { text: "text-red-600 dark:text-red-400", bar: "bg-red-500" };
}

const EVIDENCE_COLORS: Record<string, string> = {
  OBSERVED: "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/20",
  MEASURED: "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/30 border-blue-500/20",
  INFERRED: "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border-amber-500/20",
  SPECULATIVE: "text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/30 border-slate-400/20",
};

// Animated bar — fills from 0 to target when visible
function AnimatedBar({ score, color }: { score: number; color: string }) {
  const [width, setWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setWidth(score);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [score]);

  return (
    <div ref={ref} className="h-1 rounded-full bg-muted overflow-hidden flex-1">
      <div
        className={cn("h-full rounded-full", color)}
        style={{
          width: `${width}%`,
          transition: "width 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
    </div>
  );
}

interface UxCategoryGridProps {
  scores: UxCategoryScores;
}

export function UxCategoryGrid({ scores }: UxCategoryGridProps) {
  const [openKey, setOpenKey] = useState<string | null>(null);

  const entries = Object.entries(CATEGORY_META)
    .map(([key, meta]) => ({
      key,
      meta,
      score: scores[key as keyof UxCategoryScores],
    }))
    .filter((e) => e.score != null);

  if (entries.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border/50">
      {entries.map(({ key, meta, score }) => {
        if (!score) return null;
        const colors = scoreColor(score.score);
        const isOpen = openKey === key;
        const evidenceClr = EVIDENCE_COLORS[score.evidenceLevel ?? ""] ?? EVIDENCE_COLORS.INFERRED;

        return (
          <div key={key}>
            {/* Single-line summary row */}
            <button
              type="button"
              onClick={() => setOpenKey(isOpen ? null : key)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left group"
            >
              {/* Label */}
              <span className="text-xs font-semibold text-foreground w-28 shrink-0">
                {meta.label}
              </span>

              {/* Score bar */}
              <AnimatedBar score={score.score} color={colors.bar} />

              {/* Score value */}
              <span className={cn("text-sm font-bold font-mono tabular-nums shrink-0 w-10 text-right", colors.text)}>
                {score.score}
              </span>

              {/* Evidence badge */}
              {score.evidenceLevel && (
                <span className={cn("hidden sm:inline-flex text-[9px] font-semibold border rounded px-1.5 py-0.5 shrink-0", evidenceClr)}>
                  {score.evidenceLevel}
                </span>
              )}

              {/* Chevron */}
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform duration-300",
                  isOpen && "rotate-180",
                )}
              />
            </button>

            {/* Expanded detail */}
            <div
              className={cn(
                "overflow-hidden transition-all duration-300",
                isOpen ? "max-h-64" : "max-h-0",
              )}
            >
              <div className="px-4 pb-4 pt-1 space-y-2.5 bg-muted/20 border-t border-border/40">
                <p className="text-xs text-muted-foreground leading-relaxed italic">
                  &ldquo;{score.reason}&rdquo;
                </p>
                <div className="flex flex-wrap gap-1">
                  <span className="text-[10px] text-muted-foreground mr-1 font-medium">Metrics:</span>
                  {(score.observedMetrics ?? meta.metrics).map((m, i) => (
                    <span
                      key={i}
                      className="text-[10px] bg-muted/60 text-muted-foreground rounded px-1.5 py-0.5"
                    >
                      {m}
                    </span>
                  ))}
                </div>
                {score.confidence != null && (
                  <p className="text-[10px] text-muted-foreground">
                    Confidence: <span className="font-semibold">{score.confidence}%</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
