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

const FAST_INTERVAL = 2_500;
const MEDIUM_INTERVAL = 5_000;
const SLOW_INTERVAL = 10_000;

const FAST_THRESHOLD = 60_000;
const SLOW_THRESHOLD = 300_000;

function getInterval(elapsedMs: number): number {
  if (elapsedMs < FAST_THRESHOLD) return FAST_INTERVAL;
  if (elapsedMs < SLOW_THRESHOLD) return MEDIUM_INTERVAL;
  return SLOW_INTERVAL;
}

export interface AnalysisStatusState {
  status: AnalysisStatus;
  crawlerEvents: CrawlerEvent[];
  crawlMeta: CrawlMeta | null;
  personas: AnalysisPersona[];
  focusGroup: FocusGroupInsight | null;
  pageCount: number;
  personaCount: number;
  isOffline: boolean;
  lastError: AppError | null;
  currentInterval: number;
  pollCount: number;
  consecutiveFailures: number;
}

export interface UseAnalysisStatusOptions {
  analysisId: string;
  initialStatus?: AnalysisStatus;
  initialPageCount?: number;
  initialPersonaCount?: number;
  onCompleted?: (data: {
    personas: AnalysisPersona[];
    focusGroup: FocusGroupInsight | null;
  }) => void;
  onFailed?: (error: string | null) => void;
}

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

    if (polling.active) {
      const elapsed = Date.now() - polling.startTime;
      const interval = getInterval(elapsed);
      setState((prev) => ({ ...prev, currentInterval: interval }));
      polling.timeoutId = setTimeout(poll, interval);
    }
  }, [analysisId, onCompleted, onFailed]);

  useEffect(() => {
    if (initialStatus === "COMPLETED" || initialStatus === "FAILED") return;

    const polling = pollingRef.current;
    polling.active = true;
    polling.startTime = Date.now();

    poll();

    return () => {
      polling.active = false;
      clearTimeout(polling.timeoutId);
      abortControllerRef.current?.abort();
    };
  }, [analysisId, initialStatus, poll]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const polling = pollingRef.current;
      if (!polling.active) return;

      if (document.visibilityState === "visible") {
        clearTimeout(polling.timeoutId);
        poll();
      } else {
        abortControllerRef.current?.abort();
        clearTimeout(polling.timeoutId);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [poll]);

  useEffect(() => {
    const handleOffline = () => {
      setState((prev) => ({ ...prev, isOffline: true }));
      abortControllerRef.current?.abort();
    };

    const handleOnline = () => {
      setState((prev) => ({ ...prev, isOffline: false }));
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
