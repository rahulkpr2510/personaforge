// hooks/useAnalysisStatus.ts
// ─────────────────────────────────────────────────────────────────────────────
// Adaptive polling hook for analysis live-view.
// Replaces the hardcoded 2.5s setInterval in AnalysisLiveView.tsx.
//
// Polling strategy:
//   0–60s    → 2.5s interval  (fast, active phase)
//   60–300s  → 5s interval    (medium, still watching)
//   300s+    → 10s interval   (slow, background monitoring)
//
// Extras:
//   - Pauses when tab is hidden, resumes on focus
//   - Detects offline/online state
//   - Cancels in-flight request on unmount (no orphan requests)
//   - Stops automatically on COMPLETED or FAILED
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  AnalysisPersona,
  FocusGroupInsight,
  AnalysisStatus,
} from "@prisma/client";
import { AnalysisApi } from "@/lib/api/analyses";
import type { CrawlerEvent, CrawlMeta } from "@/lib/api/types";
import { AppError } from "@/lib/api/types";

// ── Adaptive polling intervals (ms) ────────────────────────────────────────

const FAST_INTERVAL = 2_500;
const MEDIUM_INTERVAL = 5_000;
const SLOW_INTERVAL = 10_000;

const FAST_THRESHOLD = 60_000;   // Switch to medium after 60s
const SLOW_THRESHOLD = 300_000;  // Switch to slow after 5 minutes

function getInterval(elapsedMs: number): number {
  if (elapsedMs < FAST_THRESHOLD) return FAST_INTERVAL;
  if (elapsedMs < SLOW_THRESHOLD) return MEDIUM_INTERVAL;
  return SLOW_INTERVAL;
}

// ── Hook return type ────────────────────────────────────────────────────────

export interface AnalysisStatusState {
  status: AnalysisStatus;
  crawlerEvents: CrawlerEvent[];
  crawlMeta: CrawlMeta | null;
  personas: AnalysisPersona[];
  focusGroup: FocusGroupInsight | null;
  pageCount: number;
  personaCount: number;
  /** True when the browser has no network connection */
  isOffline: boolean;
  /** Last AppError from a failed poll (cleared on next successful poll) */
  lastError: AppError | null;
  /** Current polling interval in ms (useful for DevDebugPanel) */
  currentInterval: number;
  /** Total number of polls performed */
  pollCount: number;
  /** Number of failed polls in a row */
  consecutiveFailures: number;
}

export interface UseAnalysisStatusOptions {
  analysisId: string;
  initialStatus?: AnalysisStatus;
  initialPageCount?: number;
  initialPersonaCount?: number;
  /** Called when status transitions to COMPLETED */
  onCompleted?: (data: {
    personas: AnalysisPersona[];
    focusGroup: FocusGroupInsight | null;
  }) => void;
  /** Called when status transitions to FAILED */
  onFailed?: (error: string | null) => void;
}

// ── Hook ────────────────────────────────────────────────────────────────────

export function useAnalysisStatus({
  analysisId,
  initialStatus = "PENDING",
  initialPageCount = 0,
  initialPersonaCount = 0,
  onCompleted,
  onFailed,
}: UseAnalysisStatusOptions): AnalysisStatusState {
  const [state, setState] = useState<AnalysisStatusState>({
    status: initialStatus,
    crawlerEvents: [],
    crawlMeta: null,
    personas: [],
    focusGroup: null,
    pageCount: initialPageCount,
    personaCount: initialPersonaCount,
    isOffline: typeof navigator !== "undefined" ? !navigator.onLine : false,
    lastError: null,
    currentInterval: FAST_INTERVAL,
    pollCount: 0,
    consecutiveFailures: 0,
  });

  const pollingRef = useRef({
    active: true,
    startTime: Date.now(),
    timeoutId: undefined as ReturnType<typeof setTimeout> | undefined,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const poll = useCallback(async () => {
    const polling = pollingRef.current;
    if (!polling.active) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      // Skip poll while offline — reschedule
      const elapsed = Date.now() - polling.startTime;
      const interval = getInterval(elapsed);
      polling.timeoutId = setTimeout(poll, interval);
      return;
    }

    // Cancel any previous in-flight request
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const data = await AnalysisApi.getStatus(analysisId, controller.signal);

      setState((prev) => {
        const newPersonas = (data.personas ?? []) as unknown as AnalysisPersona[];
        const newFocusGroup = (data.focusGroup ?? null) as FocusGroupInsight | null;
        const count = (data._count as { pages: number; personas: number } | undefined);

        return {
          ...prev,
          status: data.status as AnalysisStatus,
          crawlerEvents: (data.crawlerEvents ?? []) as CrawlerEvent[],
          crawlMeta: (data.crawlMeta ?? null) as CrawlMeta | null,
          personas: newPersonas,
          focusGroup: newFocusGroup,
          pageCount: count?.pages ?? prev.pageCount,
          personaCount: count?.personas ?? prev.personaCount,
          lastError: null,
          pollCount: prev.pollCount + 1,
          consecutiveFailures: 0,
          currentInterval: getInterval(Date.now() - polling.startTime),
        };
      });

      // Terminal states — stop polling
      if (data.status === "COMPLETED") {
        polling.active = false;
        onCompleted?.({
          personas: (data.personas ?? []) as unknown as AnalysisPersona[],
          focusGroup: (data.focusGroup ?? null) as FocusGroupInsight | null,
        });
        return;
      }

      if (data.status === "FAILED") {
        polling.active = false;
        onFailed?.((data.error as string | null) ?? null);
        return;
      }
    } catch (err) {
      // Ignore cancellations (expected on unmount / rapid re-renders)
      if (err instanceof AppError && err.code === "REQUEST_CANCELLED") return;

      setState((prev) => ({
        ...prev,
        lastError: err instanceof AppError ? err : null,
        consecutiveFailures: prev.consecutiveFailures + 1,
        pollCount: prev.pollCount + 1,
      }));

      if (process.env.NODE_ENV === "development") {
        console.warn("[useAnalysisStatus] Poll failed:", err);
      }
    }

    // Schedule next poll
    if (polling.active) {
      const elapsed = Date.now() - polling.startTime;
      const interval = getInterval(elapsed);
      setState((prev) => ({ ...prev, currentInterval: interval }));
      polling.timeoutId = setTimeout(poll, interval);
    }
  }, [analysisId, onCompleted, onFailed]);

  // ── Start / stop polling ────────────────────────────────────────────────

  useEffect(() => {
    // Don't poll for terminal statuses
    if (initialStatus === "COMPLETED" || initialStatus === "FAILED") return;

    const polling = pollingRef.current;
    polling.active = true;
    polling.startTime = Date.now();

    // Start immediately
    poll();

    return () => {
      polling.active = false;
      clearTimeout(polling.timeoutId);
      abortControllerRef.current?.abort();
    };
  }, [analysisId, initialStatus, poll]);

  // ── Visibility change — pause / resume ─────────────────────────────────

  useEffect(() => {
    const handleVisibilityChange = () => {
      const polling = pollingRef.current;
      if (!polling.active) return;

      if (document.visibilityState === "visible") {
        // Resume — poll immediately then continue
        clearTimeout(polling.timeoutId);
        poll();
      } else {
        // Pause — cancel in-flight request
        abortControllerRef.current?.abort();
        clearTimeout(polling.timeoutId);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [poll]);

  // ── Offline / online detection ─────────────────────────────────────────

  useEffect(() => {
    const handleOffline = () => {
      setState((prev) => ({ ...prev, isOffline: true }));
      abortControllerRef.current?.abort();
    };

    const handleOnline = () => {
      setState((prev) => ({ ...prev, isOffline: false }));
      // Resume polling immediately on reconnect
      if (pollingRef.current.active) {
        clearTimeout(pollingRef.current.timeoutId);
        poll();
      }
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [poll]);

  return state;
}
