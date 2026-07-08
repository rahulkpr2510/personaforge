// components/dashboard/DevDebugPanel.tsx
// Visible ONLY in development mode.
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { AnalysisStatusState } from "@/hooks/useAnalysisStatus";
import { ChevronDown, ChevronUp, Bug } from "lucide-react";

interface DevDebugPanelProps {
  pollingState: AnalysisStatusState;
  analysisId: string;
}

export function DevDebugPanel({ pollingState, analysisId }: DevDebugPanelProps) {
  const [open, setOpen] = useState(false);

  // Only render in development
  if (process.env.NODE_ENV !== "development") return null;

  const {
    status,
    currentInterval,
    pollCount,
    consecutiveFailures,
    isOffline,
    lastError,
    crawlerEvents,
    pageCount,
    personaCount,
  } = pollingState;

  const rows: Array<{ label: string; value: string | number | boolean; highlight?: boolean }> = [
    { label: "Analysis ID", value: analysisId },
    { label: "Status", value: status, highlight: status === "FAILED" },
    { label: "Poll Interval", value: `${currentInterval}ms` },
    { label: "Total Polls", value: pollCount },
    { label: "Consecutive Failures", value: consecutiveFailures, highlight: consecutiveFailures > 0 },
    { label: "Offline", value: isOffline, highlight: isOffline },
    { label: "Crawler Events", value: crawlerEvents.length },
    { label: "Pages", value: pageCount },
    { label: "Personas", value: personaCount },
    ...(lastError
      ? [
          { label: "Last Error Code", value: lastError.code, highlight: true },
          { label: "Last Error Category", value: lastError.category, highlight: true },
          { label: "Last Request ID", value: lastError.requestId.slice(0, 8) + "..." },
        ]
      : []),
  ];

  return (
    <div className="fixed bottom-4 right-4 z-50 w-72 rounded-xl border border-amber-500/40 bg-zinc-950/95 backdrop-blur shadow-2xl text-xs font-mono">
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2 text-amber-400 hover:text-amber-300 transition-colors"
      >
        <span className="flex items-center gap-1.5 font-semibold">
          <Bug className="h-3.5 w-3.5" />
          Dev Debug Panel
        </span>
        {open ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronUp className="h-3.5 w-3.5" />
        )}
      </button>

      {/* Content */}
      {open && (
        <div className="border-t border-zinc-800 px-3 py-2 space-y-1">
          {rows.map((row) => (
            <div key={row.label} className="flex items-start justify-between gap-2">
              <span className="text-zinc-500 shrink-0">{row.label}</span>
              <span
                className={cn(
                  "text-right break-all",
                  row.highlight ? "text-amber-400" : "text-zinc-300",
                )}
              >
                {String(row.value)}
              </span>
            </div>
          ))}

          {/* Polling speed indicator */}
          <div className="pt-1 border-t border-zinc-800 flex items-center gap-2">
            <span className="text-zinc-500">Speed</span>
            <div className="flex gap-1">
              {[2500, 5000, 10000].map((interval) => (
                <div
                  key={interval}
                  className={cn(
                    "h-1.5 w-6 rounded-full transition-all",
                    currentInterval === interval
                      ? "bg-amber-400"
                      : "bg-zinc-700",
                  )}
                />
              ))}
            </div>
            <span className="text-zinc-500 ml-auto">
              {currentInterval === 2500
                ? "Fast"
                : currentInterval === 5000
                  ? "Medium"
                  : "Slow"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
