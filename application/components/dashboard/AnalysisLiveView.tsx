// components/dashboard/AnalysisLiveView.tsx
"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import type { AnalysisStatus } from "@prisma/client";
import { AnalysisPipeline } from "./AnalysisPipeline";
import { PersonaDiscussion } from "./PersonaDiscussion";
import { DevDebugPanel } from "./DevDebugPanel";
import { ErrorCard } from "./ErrorCard";
import { useAnalysisStatus } from "@/hooks/useAnalysisStatus";
import { AnalysisApi } from "@/lib/api/analyses";
import { AppError } from "@/lib/api/types";
import { FileText, Users, WifiOff, XCircle } from "lucide-react";
import type { AnalysisPersona, FocusGroupInsight } from "@prisma/client";

interface Props {
	analysisId: string;
	initialStatus?: AnalysisStatus;
	initialPageCount?: number;
	initialPersonaCount?: number;
}

export function AnalysisLiveView({
	analysisId,
	initialStatus = "PENDING",
	initialPageCount = 0,
	initialPersonaCount = 0,
}: Props) {
	const router = useRouter();
	const [showDiscussion, setShowDiscussion] = useState(false);
	const [completedPersonas, setCompletedPersonas] = useState<AnalysisPersona[]>([]);
	const [completedFocusGroup, setCompletedFocusGroup] = useState<FocusGroupInsight | null>(null);
	const [cancelling, setCancelling] = useState(false);
	const [cancelError, setCancelError] = useState<AppError | Error | null>(null);

	const handleCompleted = useCallback(
		({ personas, focusGroup }: { personas: AnalysisPersona[]; focusGroup: FocusGroupInsight | null }) => {
			setCompletedPersonas(personas);
			setCompletedFocusGroup(focusGroup);
			setTimeout(() => setShowDiscussion(true), 800);
		},
		[],
	);

	const handleFailed = useCallback(() => {
		// Reload to show the failed state from server
		setTimeout(() => window.location.reload(), 500);
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
			setCancelError(err instanceof Error ? err : new Error("Failed to cancel"));
			setCancelling(false);
		}
	};

	const handleDiscussionComplete = useCallback(() => {
		router.push(`/dashboard/analyses/${analysisId}`);
	}, [router, analysisId]);

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

	const { status, crawlerEvents, crawlMeta, pageCount, personaCount, isOffline, lastError } =
		pollingState;

	return (
		<div className="transition-opacity duration-500 space-y-4">
			{/* Offline banner */}
			{isOffline && (
				<div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
					<WifiOff className="h-4 w-4 text-amber-500 shrink-0" />
					<p className="text-sm text-amber-700 dark:text-amber-400">
						No internet connection. Polling paused — will resume automatically when you reconnect.
					</p>
				</div>
			)}

			{/* Cancel error */}
			{cancelError && (
				<ErrorCard
					error={cancelError}
					onRetry={handleCancel}
					title="Could not cancel analysis"
				/>
			)}

			{/* Last poll error (transient) */}
			{lastError && !isOffline && (
				<div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-4 py-2.5">
					<XCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
					<p className="text-xs text-muted-foreground">
						Polling encountered an issue — retrying automatically.
					</p>
				</div>
			)}

			{/* Real-time stats */}
			<div className="grid grid-cols-2 gap-3">
				<div className="rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-3">
					<FileText className="h-4 w-4 text-muted-foreground shrink-0" />
					<div>
						<p className="text-xs text-muted-foreground">Pages crawled</p>
						<p className="text-sm font-semibold text-foreground tabular-nums">{pageCount}</p>
					</div>
				</div>
				<div className="rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-3">
					<Users className="h-4 w-4 text-muted-foreground shrink-0" />
					<div>
						<p className="text-xs text-muted-foreground">Personas evaluated</p>
						<p className="text-sm font-semibold text-foreground tabular-nums">{personaCount}</p>
					</div>
				</div>
			</div>

			<AnalysisPipeline
				status={status}
				crawlerEvents={crawlerEvents}
				crawlMeta={crawlMeta}
			/>

			{/* Cancel button */}
			{["PENDING", "CRAWLING", "ANALYZING"].includes(status) && (
				<div className="flex justify-end">
					<button
						onClick={handleCancel}
						disabled={cancelling}
						className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
					>
						{cancelling ? "Cancelling…" : "Cancel Analysis"}
					</button>
				</div>
			)}

			{/* Dev Debug Panel — development only */}
			<DevDebugPanel pollingState={pollingState} analysisId={analysisId} />
		</div>
	);
}
