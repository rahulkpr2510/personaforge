"use client";
import { cn } from "@/lib/utils";
import { Layers, AlertTriangle, CheckCircle2, Info } from "lucide-react";

interface CrawlCoverage {
  pagesCrawled: number;
  pagesDiscovered: number;
  pagesBlocked: number;
  pagesSkipped: number;
  avgDepth: number;
  maxDepthReached?: number;
  coverageConfidence: "Low" | "Medium" | "High";
  coveragePercent: number;
  coverageNote: string;
}

interface CoverageMeterProps {
  coverage: CrawlCoverage;
  className?: string;
  compact?: boolean;
}

const confidenceMeta = {
  High: {
    label: "High Coverage",
    icon: CheckCircle2,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-500/20",
    barColor: "bg-emerald-500",
  },
  Medium: {
    label: "Medium Coverage",
    icon: Info,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-500/20",
    barColor: "bg-amber-500",
  },
  Low: {
    label: "Low Coverage",
    icon: AlertTriangle,
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-500/20",
    barColor: "bg-red-500",
  },
};

function CoverageBar({
  percent,
  barColor,
}: {
  percent: number;
  barColor: string;
}) {
  return (
    <div className="h-2 rounded-full bg-muted overflow-hidden">
      <div
        className={cn("h-full rounded-full transition-all duration-700", barColor)}
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}

export function CoverageMeter({ coverage, className, compact = false }: CoverageMeterProps) {
  const {
    pagesCrawled,
    pagesDiscovered,
    pagesBlocked,
    pagesSkipped,
    avgDepth,
    maxDepthReached,
    coverageConfidence,
    coveragePercent,
    coverageNote,
  } = coverage;

  const meta = confidenceMeta[coverageConfidence];
  const Icon = meta.icon;

  if (compact) {
    return (
      <div
        className={cn(
          "rounded-xl border px-3 py-2.5 flex items-center gap-3",
          meta.bg,
          meta.border,
          className,
        )}
      >
        <Icon className={cn("h-4 w-4 shrink-0", meta.color)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className={cn("text-xs font-semibold", meta.color)}>
              {meta.label}
            </p>
            <p className="text-xs text-muted-foreground tabular-nums">
              {pagesCrawled}/{pagesDiscovered} pages
            </p>
          </div>
          <CoverageBar percent={coveragePercent} barColor={meta.barColor} />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-2xl border border-border bg-card overflow-hidden", className)}>
      <div className="border-b border-border px-5 py-3.5 flex items-center gap-2">
        <Layers className="h-4 w-4 text-(--pf-accent)" />
        <p className="text-sm font-semibold text-foreground">Crawl Coverage</p>
        <span
          className={cn(
            "ml-auto inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
            meta.bg,
            meta.border,
            meta.color,
          )}
        >
          <Icon className="h-2.5 w-2.5" />
          {meta.label}
        </span>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Main progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">Pages analyzed</p>
            <p className="text-xs font-semibold text-foreground tabular-nums">
              {pagesCrawled}{" "}
              <span className="text-muted-foreground font-normal">
                of ~{pagesDiscovered} discovered
              </span>
            </p>
          </div>
          <CoverageBar percent={coveragePercent} barColor={meta.barColor} />
          <p className="text-[10px] text-muted-foreground mt-1 tabular-nums">
            {coveragePercent}% of discovered URLs analyzed
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Crawled", value: pagesCrawled, good: true },
            { label: "Skipped", value: pagesSkipped, good: false },
            { label: "Blocked", value: pagesBlocked, good: false },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-border bg-muted/30 p-2.5 text-center">
              <p
                className={cn(
                  "text-lg font-bold font-heading tabular-nums leading-none",
                  s.good ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {s.value}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Depth info */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>
            Avg depth:{" "}
            <span className="font-semibold text-foreground">{avgDepth.toFixed(1)}</span>
          </span>
          {maxDepthReached != null && (
            <span>
              Max depth reached:{" "}
              <span className="font-semibold text-foreground">{maxDepthReached}</span>
            </span>
          )}
        </div>

        {/* Coverage note */}
        <div
          className={cn(
            "rounded-lg border px-3 py-2 flex items-start gap-2",
            meta.bg,
            meta.border,
          )}
        >
          <Icon className={cn("h-3.5 w-3.5 shrink-0 mt-0.5", meta.color)} />
          <p className="text-xs text-muted-foreground leading-relaxed">{coverageNote}</p>
        </div>
      </div>
    </div>
  );
}
