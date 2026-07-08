"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { AnalysisStatus } from "@prisma/client";
import { AnalysisPipeline } from "./AnalysisPipeline";
import { PersonaDiscussion } from "./PersonaDiscussion";
import { DevDebugPanel } from "./DevDebugPanel";
import { useAnalysisStatus } from "@/hooks/useAnalysisStatus";
import { AnalysisApi } from "@/lib/api/analyses";
import { AppError } from "@/lib/api/types";
import type { AnalysisPersona, FocusGroupInsight } from "@prisma/client";
import {
	FileText,
	Users,
	WifiOff,
	XCircle,
	Clock,
	AlertTriangle,
	RefreshCw,
	X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
	analysisId: string;
	initialStatus?: AnalysisStatus;
	initialPageCount?: number;
	initialPersonaCount?: number;
}

const STATUS_META: Record<
	string,
	{ label: string; description: string; color: string }
> = {
	PENDING: {
		label: "Queued",
		description: "Your analysis is queued and will start shortly.",
		color: "text-amber-500",
	},
	CRAWLING: {
		label: "Crawling",
		description:
			"Exploring your product — visiting pages and capturing screenshots.",
		color: "text-blue-500",
	},
	ANALYZING: {
		label: "Analyzing",
		description: "AI personas are independently evaluating your product's UX.",
		color: "text-[var(--pf-accent)]",
	},
	COMPLETED: {
		label: "Completed",
		description: "Analysis complete. Loading your report…",
		color: "text-emerald-500",
	},
	FAILED: {
		label: "Failed",
		description: "The analysis could not be completed.",
		color: "text-destructive",
	},
};

function useElapsedSeconds(active: boolean) {
	const [start] = useState(() => Date.now());
	const [, setTick] = useState(0);

	if (typeof window !== "undefined" && active) {
		setTimeout(() => setTick((t) => t + 1), 1000);
	}
	return active ? Math.floor((Date.now() - start) / 1000) : 0;
}

function formatElapsed(seconds: number): string {
	if (seconds < 60) return `${seconds}s`;
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function AnalysisLiveView({
	analysisId,
	initialStatus = "PENDING",
	initialPageCount = 0,
	initialPersonaCount = 0,
}: Props) {
	const router = useRouter();
	const [showDiscussion, setShowDiscussion] = useState(false);
	const [completedPersonas, setCompletedPersonas] = useState<AnalysisPersona[]>(
		[],
	);
	const [completedFocusGroup, setCompletedFocusGroup] =
		useState<FocusGroupInsight | null>(null);
	const [cancelling, setCancelling] = useState(false);
	const [cancelError, setCancelError] = useState<string | null>(null);
	const [failureReason, setFailureReason] = useState<string | null>(null);

	const handleCompleted = useCallback(
		({
			personas,
			focusGroup,
		}: {
			personas: AnalysisPersona[];
			focusGroup: FocusGroupInsight | null;
		}) => {
			setCompletedPersonas(personas);
			setCompletedFocusGroup(focusGroup);
			setTimeout(() => setShowDiscussion(true), 800);
		},
		[],
	);

	const handleFailed = useCallback((reason: string | null) => {
		setFailureReason(reason);
		setTimeout(() => window.location.reload(), 3000);
	}, []);

	const pollingState = useAnalysisStatus({
		analysisId,
		initialStatus,
		initialPageCount,
		initialPersonaCount,
		onCompleted: handleCompleted,
		onFailed: handleFailed,
	});

	const handleCancel = async () => {
		setCancelling(true);
		setCancelError(null);
		try {
			await AnalysisApi.cancel(analysisId);
			router.push("/dashboard/analyses");
		} catch (err) {
			const msg =
				err instanceof AppError
					? err.userMessage
					: err instanceof Error
						? err.message
						: "Failed to cancel";
			setCancelError(msg);
			setCancelling(false);
		}
	};

	const handleDiscussionComplete = useCallback(() => {
		router.push(`/dashboard/analyses/${analysisId}`);
	}, [router, analysisId]);

	const isActive = typeof window !== "undefined";
	const elapsed = useElapsedSeconds(
		isActive && !["COMPLETED", "FAILED"].includes(pollingState.status),
	);

	if (showDiscussion) {
		return (
			<div style={{ animation: "fadeIn 0.5s ease forwards" }}>
				<PersonaDiscussion
					personas={completedPersonas}
					focusGroup={completedFocusGroup}
					onComplete={handleDiscussionComplete}
				/>
			</div>
		);
	}

	const {
		status,
		crawlerEvents,
		crawlMeta,
		pageCount,
		personaCount,
		isOffline,
		lastError,
	} = pollingState;

	const meta = STATUS_META[status] ?? STATUS_META.PENDING;
	const isFailed = status === "FAILED";
	const isRunning = ["PENDING", "CRAWLING", "ANALYZING"].includes(status);

	return (
		<div className="space-y-4">
			{isOffline && (
				<div className="flex items-center gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/8 px-4 py-3">
					<WifiOff className="h-4 w-4 text-amber-500 shrink-0" />
					<p className="text-sm text-amber-600 dark:text-amber-400">
						No internet connection — polling paused. Will resume automatically
						on reconnect.
					</p>
				</div>
			)}

			{isFailed && (
				<div className="rounded-2xl border border-destructive/25 bg-destructive/5 p-5 space-y-3">
					<div className="flex items-start gap-3">
						<div className="mt-0.5 h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
							<XCircle className="h-4 w-4 text-destructive" />
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-sm font-semibold text-foreground">
								Analysis Failed
							</p>
							<p className="mt-1 text-sm text-muted-foreground leading-relaxed">
								{failureReason
									? failureReason
									: "The crawl could not be completed. The website may be blocking automated access, or an unexpected error occurred."}
							</p>
						</div>
					</div>
					<div className="ml-11 rounded-lg bg-muted/50 border border-border px-3 py-2">
						<p className="text-xs text-muted-foreground">
							<span className="font-medium text-foreground">What to try: </span>
							Check that the URL is publicly accessible and doesn't require a
							login, then create a new analysis.
						</p>
					</div>
					<div className="ml-11 flex gap-2">
						<button
							onClick={() => router.push("/dashboard/new-analysis")}
							className="inline-flex items-center gap-1.5 rounded-lg bg-(--pf-accent) px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
						>
							<RefreshCw className="h-3 w-3" />
							New Analysis
						</button>
						<button
							onClick={() => router.push("/dashboard/analyses")}
							className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
						>
							← All Analyses
						</button>
					</div>
				</div>
			)}

			{!isFailed && (
				<div className="flex items-start justify-between gap-4">
					<div className="flex items-center gap-3">
						<div
							className={cn(
								"h-2.5 w-2.5 rounded-full shrink-0 mt-0.5",
								isRunning ? "animate-pulse" : "",
								status === "PENDING" && "bg-amber-500",
								status === "CRAWLING" && "bg-blue-500",
								status === "ANALYZING" && "bg-(--pf-accent)",
								status === "COMPLETED" && "bg-emerald-500",
							)}
						/>
						<div>
							<p className={cn("text-sm font-semibold", meta.color)}>
								{meta.label}
							</p>
							<p className="text-xs text-muted-foreground mt-0.5">
								{meta.description}
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2 shrink-0">
						{isRunning && elapsed > 0 && (
							<div className="flex items-center gap-1 text-xs text-muted-foreground">
								<Clock className="h-3 w-3" />
								{formatElapsed(elapsed)}
							</div>
						)}
						{isRunning && (
							<button
								onClick={handleCancel}
								disabled={cancelling}
								className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 bg-destructive/5 px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
							>
								<X className="h-3 w-3" />
								{cancelling ? "Cancelling…" : "Cancel"}
							</button>
						)}
					</div>
				</div>
			)}

			{cancelError && (
				<div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-2.5">
					<AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
					<p className="text-xs text-destructive">{cancelError}</p>
				</div>
			)}

			{lastError && !isOffline && (
				<div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-4 py-2">
					<XCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
					<p className="text-xs text-muted-foreground">
						Connection hiccup — retrying automatically…
					</p>
				</div>
			)}

			{!isFailed && (
				<div className="grid grid-cols-2 gap-3">
					<div className="rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-3">
						<div className="h-8 w-8 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
							<FileText className="h-4 w-4 text-muted-foreground" />
						</div>
						<div>
							<p className="text-xs text-muted-foreground">Pages crawled</p>
							<p className="text-lg font-bold text-foreground tabular-nums leading-none mt-0.5">
								{pageCount}
							</p>
						</div>
					</div>

					<div className="rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-3">
						<div className="h-8 w-8 rounded-lg bg-muted/60 flex items-center justify-center shrink-0">
							<Users className="h-4 w-4 text-muted-foreground" />
						</div>
						<div>
							<p className="text-xs text-muted-foreground">
								Personas evaluated
							</p>
							<p className="text-lg font-bold text-foreground tabular-nums leading-none mt-0.5">
								{personaCount}
							</p>
						</div>
					</div>
				</div>
			)}

			{!isFailed && (
				<AnalysisPipeline
					status={status}
					crawlerEvents={crawlerEvents}
					crawlMeta={crawlMeta}
				/>
			)}

			{status === "ANALYZING" && (
				<div className="rounded-xl border border-(--pf-accent)/15 bg-(--pf-accent)/5 px-4 py-3">
					<p className="text-xs text-muted-foreground leading-relaxed">
						<span className="font-semibold text-(--pf-accent)">
							What's happening:{" "}
						</span>
						Each persona is independently reviewing your pages, scoring UX
						friction, writing accessibility notes, and preparing their feedback.
						This typically takes 2–5 minutes.
					</p>
				</div>
			)}

			{status === "PENDING" && (
				<div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
					<p className="text-xs text-muted-foreground">
						<span className="font-medium text-foreground">Expected time: </span>
						Most analyses complete in 2–5 minutes. The crawler is starting up —
						you'll see live updates here once crawling begins.
					</p>
				</div>
			)}

			<DevDebugPanel pollingState={pollingState} analysisId={analysisId} />
		</div>
	);
}
