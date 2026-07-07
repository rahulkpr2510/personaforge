"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Activity,
  FileText,
  MousePointerClick,
  Eye,
  Link2,
  Type,
  Zap,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Image,
  AlignLeft,
} from "lucide-react";

interface CrawlerStats {
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
  largestPageUrl?: string | null;
  largestPageWords?: number;
  fastestPageUrl?: string | null;
  fastestPageMs?: number | null;
  slowestPageUrl?: string | null;
  slowestPageMs?: number | null;
  skippedUrls?: string[];
  blockedUrls?: string[];
  redirectCount?: number;
  brokenLinkCount?: number;
  avgTtfbMs?: number | null;
  avgLoadMs?: number | null;
}

interface CrawlerStatsPanelProps {
  stats: CrawlerStats;
}

function Stat({
  label,
  value,
  icon: Icon,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="h-3.5 w-3.5 text-(--pf-accent)" />
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
      </div>
      <p className="text-lg font-bold font-heading text-foreground tabular-nums leading-none">
        {value}
      </p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function PerfBadge({
  label,
  ms,
  url,
  type,
}: {
  label: string;
  ms: number | null | undefined;
  url: string | null | undefined;
  type: "fast" | "slow";
}) {
  if (ms == null) return null;
  const isGood = type === "fast";
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2",
        isGood
          ? "border-emerald-500/20 bg-emerald-50 dark:bg-emerald-950/30"
          : "border-red-500/20 bg-red-50 dark:bg-red-950/30",
      )}
    >
      <p
        className={cn(
          "text-[10px] font-semibold uppercase tracking-wide",
          isGood ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400",
        )}
      >
        {label}
      </p>
      <p className="text-sm font-bold text-foreground tabular-nums mt-0.5">
        {Math.round(ms)}ms
      </p>
      {url && (
        <p className="text-[10px] text-muted-foreground truncate max-w-[200px] mt-0.5">
          {url}
        </p>
      )}
    </div>
  );
}

export function CrawlerStatsPanel({ stats }: CrawlerStatsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const statGroups = [
    {
      label: "Content",
      stats: [
        { label: "Pages", value: stats.totalPages, icon: FileText },
        { label: "Words", value: stats.totalWords.toLocaleString(), icon: AlignLeft, sub: `~${stats.avgWordCount} avg/page` },
        { label: "Headings", value: stats.totalHeadings, icon: Type },
        { label: "Images", value: stats.totalImages, icon: Image },
      ],
    },
    {
      label: "Interactions",
      stats: [
        { label: "Buttons", value: stats.totalButtons, icon: MousePointerClick },
        { label: "Forms", value: stats.totalForms, icon: FileText },
        { label: "Inputs", value: stats.totalInputs, icon: AlignLeft },
        { label: "Links", value: stats.totalLinks, icon: Link2 },
      ],
    },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header — toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-5 py-3.5 border-b border-border hover:bg-muted/20 transition-colors text-left"
      >
        <Activity className="h-4 w-4 text-(--pf-accent)" />
        <p className="text-sm font-semibold text-foreground flex-1">
          Raw Crawler Statistics
        </p>
        <span className="text-xs text-muted-foreground">
          {stats.totalPages} pages · {stats.totalButtons} buttons · {stats.totalWords.toLocaleString()} words
        </span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground ml-1" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground ml-1" />
        )}
      </button>

      {isOpen && (
        <div className="px-5 py-4 space-y-5">
          {/* Stat groups */}
          {statGroups.map((group) => (
            <div key={group.label}>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                {group.label}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {group.stats.map((s) => (
                  <Stat key={s.label} {...s} />
                ))}
              </div>
            </div>
          ))}

          {/* Performance */}
          {(stats.avgTtfbMs != null || stats.avgLoadMs != null || stats.fastestPageMs != null || stats.slowestPageMs != null) && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Zap className="h-3.5 w-3.5 text-(--pf-accent)" />
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Performance
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {stats.avgTtfbMs != null && (
                  <Stat label="Avg TTFB" value={`${stats.avgTtfbMs}ms`} icon={Clock} sub="time to first byte" />
                )}
                {stats.avgLoadMs != null && (
                  <Stat label="Avg Load" value={`${stats.avgLoadMs}ms`} icon={Clock} sub="full page load" />
                )}
                {stats.fastestPageMs != null && (
                  <PerfBadge
                    label="Fastest page"
                    ms={stats.fastestPageMs}
                    url={stats.fastestPageUrl}
                    type="fast"
                  />
                )}
                {stats.slowestPageMs != null && (
                  <PerfBadge
                    label="Slowest page"
                    ms={stats.slowestPageMs}
                    url={stats.slowestPageUrl}
                    type="slow"
                  />
                )}
              </div>
            </div>
          )}

          {/* Issues */}
          {((stats.skippedUrls?.length ?? 0) > 0 ||
            (stats.blockedUrls?.length ?? 0) > 0 ||
            (stats.brokenLinkCount ?? 0) > 0) && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Skipped / Blocked
                </p>
              </div>
              <div className="rounded-lg border border-amber-500/20 bg-amber-50 dark:bg-amber-950/20 px-3 py-2.5 space-y-1">
                {(stats.skippedUrls?.length ?? 0) > 0 && (
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    <span className="font-semibold">{stats.skippedUrls!.length}</span> URL(s) skipped (depth/page limit)
                  </p>
                )}
                {(stats.blockedUrls?.length ?? 0) > 0 && (
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    <span className="font-semibold">{stats.blockedUrls!.length}</span> URL(s) blocked
                  </p>
                )}
                {(stats.brokenLinkCount ?? 0) > 0 && (
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    <span className="font-semibold">{stats.brokenLinkCount}</span> broken link(s) detected
                  </p>
                )}
                {stats.skippedUrls && stats.skippedUrls.length > 0 && (
                  <details className="mt-1">
                    <summary className="text-[10px] text-muted-foreground cursor-pointer hover:text-foreground">
                      View skipped URLs ({stats.skippedUrls.length})
                    </summary>
                    <ul className="mt-1 space-y-0.5">
                      {stats.skippedUrls.slice(0, 10).map((url, i) => (
                        <li key={i} className="text-[10px] text-muted-foreground truncate">
                          {url}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            </div>
          )}

          {/* Data footnote */}
          <p className="text-[10px] text-muted-foreground border-t border-border pt-3">
            All metrics are extracted directly from the browser DOM during crawling. No sampling or estimation.
          </p>
        </div>
      )}
    </div>
  );
}
