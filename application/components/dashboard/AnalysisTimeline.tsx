"use client";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, Loader2, Globe, Camera, Users, MessageSquare, BarChart3, Zap } from "lucide-react";

type PhaseStatus = "completed" | "active" | "pending" | "failed";

interface TimelinePhase {
  key: string;
  label: string;
  description: string;
  icon: React.ElementType;
}

const PHASES: TimelinePhase[] = [
  {
    key: "crawl",
    label: "Crawl",
    description: "Pages discovered and content extracted",
    icon: Globe,
  },
  {
    key: "vision",
    label: "Vision",
    description: "Screenshots captured and AI-analyzed",
    icon: Camera,
  },
  {
    key: "persona",
    label: "Personas",
    description: "Each persona assessed site against their goals",
    icon: Users,
  },
  {
    key: "focusGroup",
    label: "Focus Group",
    description: "Moderated debate — personas cross-reference findings",
    icon: MessageSquare,
  },
  {
    key: "aggregation",
    label: "Aggregation",
    description: "Business intelligence built",
    icon: BarChart3,
  },
  {
    key: "complete",
    label: "Complete",
    description: "Report generated and quality gate passed",
    icon: Zap,
  },
];

function derivePhaseStatus(
  analysisStatus: string,
  phaseKey: string,
  phaseIndex: number,
): PhaseStatus {
  if (analysisStatus === "FAILED") return phaseIndex === 0 ? "failed" : "pending";
  if (analysisStatus === "PENDING") return "pending";
  if (analysisStatus === "COMPLETED") return "completed";

  const activePhaseMap: Record<string, number> = {
    CRAWLING: 0,
    ANALYZING: 2,
    GENERATING: 3,
  };
  const activeIdx = activePhaseMap[analysisStatus] ?? 2;
  if (phaseIndex < activeIdx) return "completed";
  if (phaseIndex === activeIdx) return "active";
  return "pending";
}

interface AnalysisTimelineProps {
  status: string;
  createdAt?: Date | string;
  completedAt?: Date | string | null;
  pageCount?: number;
  personaCount?: number;
}

function formatTime(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(from: Date | string, to: Date | string): string {
  const ms = new Date(to).getTime() - new Date(from).getTime();
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export function AnalysisTimeline({
  status,
  createdAt,
  completedAt,
  pageCount,
  personaCount,
}: AnalysisTimelineProps) {
  const isCompleted = status === "COMPLETED";

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="border-b border-border px-5 py-3.5 flex items-center gap-2">
        <Clock className="h-4 w-4 text-(--pf-accent)" />
        <p className="text-sm font-semibold text-foreground">Analysis Pipeline</p>
        {createdAt && completedAt && isCompleted && (
          <span className="ml-auto text-xs text-muted-foreground">
            Total: {formatDuration(createdAt, completedAt)}
          </span>
        )}
        {createdAt && !isCompleted && (
          <span className="ml-auto text-xs text-muted-foreground">
            Started {formatTime(createdAt)}
          </span>
        )}
      </div>

      {/* Horizontal timeline */}
      <div className="px-5 py-5">
        <div className="relative">
          {/* Horizontal connector track */}
          <div className="absolute top-3.5 left-0 right-0 h-px bg-border" aria-hidden />

          <div className="relative flex items-start justify-between gap-2">
            {PHASES.map((phase, idx) => {
              const phaseStatus = derivePhaseStatus(status, phase.key, idx);
              const Icon = phase.icon;

              return (
                <div key={phase.key} className="flex flex-col items-center gap-2 flex-1 min-w-0">
                  {/* Node */}
                  <div
                    className={cn(
                      "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 bg-background transition-all duration-500",
                      phaseStatus === "completed" && "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30",
                      phaseStatus === "active" && "border-(--pf-accent) bg-(--pf-accent-soft) shadow-[0_0_0_4px_var(--pf-accent,#6366f1)15]",
                      phaseStatus === "pending" && "border-border bg-background",
                      phaseStatus === "failed" && "border-red-500 bg-red-50 dark:bg-red-950/30",
                    )}
                  >
                    {phaseStatus === "completed" && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    )}
                    {phaseStatus === "active" && (
                      <Loader2 className="h-3.5 w-3.5 text-(--pf-accent) animate-spin" />
                    )}
                    {phaseStatus === "pending" && (
                      <Icon className="h-3 w-3 text-muted-foreground/40" />
                    )}
                    {phaseStatus === "failed" && (
                      <Icon className="h-3 w-3 text-red-500" />
                    )}
                  </div>

                  {/* Label + stats */}
                  <div className="text-center min-w-0 w-full">
                    <p className={cn(
                      "text-[10px] font-semibold leading-tight truncate",
                      phaseStatus === "completed" && "text-foreground",
                      phaseStatus === "active" && "text-(--pf-accent)",
                      phaseStatus === "pending" && "text-muted-foreground/40",
                      phaseStatus === "failed" && "text-red-600 dark:text-red-400",
                    )}>
                      {phase.label}
                    </p>

                    {/* Phase-specific stats */}
                    {phase.key === "crawl" && pageCount != null && phaseStatus === "completed" && (
                      <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 rounded px-1 py-0.5 font-semibold">
                        {pageCount}p
                      </span>
                    )}
                    {phase.key === "persona" && personaCount != null && phaseStatus === "completed" && (
                      <span className="text-[9px] bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-500/20 rounded px-1 py-0.5 font-semibold">
                        {personaCount}
                      </span>
                    )}
                    {phaseStatus === "active" && (
                      <span className="text-[9px] text-(--pf-accent) font-semibold animate-pulse">
                        …
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer note */}
        {isCompleted && (
          <div className="mt-4 pt-3 border-t border-border/50">
            <p className="text-[10px] text-muted-foreground">
              All findings are traceable to crawler evidence from the pages listed below.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
