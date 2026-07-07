// components/dashboard/AnalysisLiveView.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type {
	AnalysisPersona,
	FocusGroupInsight,
	AnalysisStatus,
} from "@prisma/client";
import { AnalysisPipeline } from "./AnalysisPipeline";
import { PersonaDiscussion } from "./PersonaDiscussion";
import type { CrawlEvent } from "@/lib/crawl-log-messages";
import { FileText, Users } from "lucide-react";

interface Props {
	analysisId: string;
	initialStatus?: AnalysisStatus;
	initialPageCount?: number;
	initialPersonaCount?: number;
}

interface StatusResponse {
	status: AnalysisStatus;
	personas?: AnalysisPersona[];
	focusGroup?: FocusGroupInsight | null;
	crawlerEvents?: CrawlEvent[];
	crawlMeta?: { partial?: boolean; partialReason?: string | null } | null;
	_count?: { pages: number; personas: number };
}

export function AnalysisLiveView({
	analysisId,
	initialStatus = "PENDING",
	initialPageCount = 0,
	initialPersonaCount = 0,
}: Props) {
	const router = useRouter();
	const [status, setStatus] = useState<AnalysisStatus>(initialStatus);
	const [showDiscussion, setShowDiscussion] = useState(false);
	const [personas, setPersonas] = useState<AnalysisPersona[]>([]);
	const [focusGroup, setFocusGroup] = useState<FocusGroupInsight | null>(null);
	const [crawlerEvents, setCrawlerEvents] = useState<CrawlEvent[]>([]);
	const [crawlMeta, setCrawlMeta] = useState<StatusResponse["crawlMeta"]>(null);
	const [pollingActive, setPollingActive] = useState(true);
	const [pageCount, setPageCount] = useState(initialPageCount);
	const [personaCount, setPersonaCount] = useState(initialPersonaCount);

	const handleDiscussionComplete = useCallback(() => {
		router.push(`/dashboard/analyses/${analysisId}`);
	}, [router, analysisId]);

	useEffect(() => {
		if (!pollingActive) return;

		const poll = async () => {
			try {
				const res = await fetch(`/api/analyses/${analysisId}/status`, {
					cache: "no-store",
				});
				if (!res.ok) return;
				const data: StatusResponse = await res.json();

				setStatus(data.status);
				setCrawlerEvents(data.crawlerEvents ?? []);
				setCrawlMeta(data.crawlMeta ?? null);

				// Update real-time counts
				if (data._count) {
					setPageCount(data._count.pages);
					setPersonaCount(data._count.personas);
				}

				if (data.status === "COMPLETED") {
					setPollingActive(false);
					setPersonas(data.personas ?? []);
					setFocusGroup(data.focusGroup ?? null);
					setTimeout(() => setShowDiscussion(true), 800);
				}

				if (data.status === "FAILED") {
					setPollingActive(false);
					setTimeout(() => window.location.reload(), 500);
				}
			} catch {
				// ignore transient network errors
			}
		};

		poll();
		const interval = setInterval(poll, 2500);
		return () => clearInterval(interval);
	}, [analysisId, pollingActive]);

	if (showDiscussion) {
		return (
			<div style={{ animation: "fadeIn 0.5s ease forwards" }}>
				<PersonaDiscussion
					personas={personas}
					focusGroup={focusGroup}
					onComplete={handleDiscussionComplete}
				/>
			</div>
		);
	}

	return (
		<div className="transition-opacity duration-500 space-y-4">
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
		</div>
	);
}
