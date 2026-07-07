// components/dashboard/AnalysisPipeline.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalysisStatus } from "@prisma/client";
import {
	toFriendlyLogMessage,
	FALLBACK_LOG_MESSAGES,
	type CrawlEvent,
} from "@/lib/crawl-log-messages";

const STAGES = [
	"Initializing",
	"Preparing",
	"Crawling",
	"User Flows",
	"Analyzing",
	"Accessibility",
	"Insights",
	"Comparing",
	"Discussion",
];

const STATUS_STAGE: Record<AnalysisStatus, number> = {
	PENDING: 0,
	CRAWLING: 2,
	ANALYZING: 6,
	COMPLETED: 9,
	FAILED: -1,
};

const PHASE_TRANSITION_LABELS: Partial<Record<AnalysisStatus, string>> = {
	CRAWLING: "— crawling your product —",
	ANALYZING: "— analyzing your product —",
	COMPLETED: "— analysis complete —",
};

interface Props {
	status: AnalysisStatus;
	crawlerEvents?: CrawlEvent[];
	crawlMeta?: { partial?: boolean; partialReason?: string | null } | null;
}

export function AnalysisPipeline({
	status,
	crawlerEvents = [],
	crawlMeta,
}: Props) {
	const activeStage = STATUS_STAGE[status] ?? 0;
	const [displayedLogs, setDisplayedLogs] = useState<string[]>([]);
	const logEndRef = useRef<HTMLDivElement>(null);

	const prevStatusRef = useRef<AnalysisStatus | null>(null);
	const lastRealEventCount = useRef(0);
	const fallbackIdxRef = useRef(0);

	useEffect(() => {
		const prevStatus = prevStatusRef.current;
		const statusChanged = prevStatus !== status;

		if (statusChanged && prevStatus !== null) {
			const divider = PHASE_TRANSITION_LABELS[status];
			setDisplayedLogs(divider ? [divider] : []);
			lastRealEventCount.current = 0;
			fallbackIdxRef.current = 0;
		}
		prevStatusRef.current = status;

		if (status === "CRAWLING") {
			if (crawlerEvents.length > lastRealEventCount.current) {
				const newEvents = crawlerEvents.slice(lastRealEventCount.current);
				const newMessages = newEvents.map(toFriendlyLogMessage);
				setDisplayedLogs((prev) => [...prev, ...newMessages].slice(-8));
				lastRealEventCount.current = crawlerEvents.length;
			}
			return;
		}

		const pool = FALLBACK_LOG_MESSAGES[status] ?? FALLBACK_LOG_MESSAGES.PENDING;

		if (statusChanged || (prevStatus === null && displayedLogs.length === 0)) {
			setDisplayedLogs((prev) => {
				const seed = pool[0];
				const last = prev[prev.length - 1];
				if (last === seed) return prev;
				return [...prev, seed].slice(-8);
			});
			fallbackIdxRef.current = 1;
		}

		const interval = setInterval(() => {
			setDisplayedLogs((prev) =>
				[...prev, pool[fallbackIdxRef.current % pool.length]].slice(-8),
			);
			fallbackIdxRef.current += 1;
		}, 3000);

		return () => clearInterval(interval);
	}, [status, crawlerEvents]); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		if (status !== "CRAWLING") return;
		if (crawlerEvents.length <= lastRealEventCount.current) return;
		const newEvents = crawlerEvents.slice(lastRealEventCount.current);
		const newMessages = newEvents.map(toFriendlyLogMessage);
		setDisplayedLogs((prev) => [...prev, ...newMessages].slice(-8));
		lastRealEventCount.current = crawlerEvents.length;
	}, [crawlerEvents, status]);

	useEffect(() => {
		if (status !== "CRAWLING") return;
		const timer = setTimeout(() => {
			if (crawlerEvents.length === 0) {
				setDisplayedLogs(["🌐 Connecting to your product..."]);
			}
		}, 4000);
		return () => clearTimeout(timer);
	}, [status]); // eslint-disable-line react-hooks/exhaustive-deps

	// Auto-scroll terminal to bottom
	useEffect(() => {
		logEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [displayedLogs]);

	const partialNotice =
		status === "CRAWLING" || status === "ANALYZING" || status === "COMPLETED"
			? crawlMeta?.partial
				? "Some parts of the product required sign-in or were harder to reach."
				: null
			: null;

	const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

	return (
		<div className="rounded-2xl border border-border bg-card p-5 space-y-4">
			<div>
				<h2 className="font-heading text-base font-semibold text-foreground">
					Analysis in Progress
				</h2>
				<p className="text-xs text-muted-foreground mt-0.5">
					A team of AI personas is evaluating your product
				</p>
			</div>

			{/* ── Horizontal stage timeline ── */}
			<div className="relative">
				{/* Connector track */}
				<div className="absolute top-3.5 left-0 right-0 h-px bg-border" />

				<div className="relative flex items-start justify-between gap-1 overflow-x-auto pb-1">
					{STAGES.map((stage, i) => {
						const isCompleted = i < activeStage;
						const isActive = i === activeStage;
						const isPending = i > activeStage;

						return (
							<div key={stage} className="flex flex-col items-center gap-1.5 min-w-0 flex-1">
								{/* Node */}
								<div
									className={cn(
										"relative z-10 h-7 w-7 rounded-full border-2 flex items-center justify-center bg-background transition-all duration-500",
										isCompleted && "border-emerald-500 bg-emerald-500",
										isActive && "border-(--pf-accent) bg-(--pf-accent) shadow-[0_0_0_4px_var(--pf-accent,#6366f1)20] animate-pulse",
										isPending && "border-border",
									)}
								>
									{isCompleted && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
									{isActive && <Circle className="h-2 w-2 text-white fill-white" />}
									{isPending && <span className="h-1.5 w-1.5 rounded-full bg-border" />}
								</div>

								{/* Label */}
								<p
									className={cn(
										"text-[9px] font-medium text-center leading-tight px-0.5",
										isCompleted && "text-emerald-600 dark:text-emerald-400",
										isActive && "text-(--pf-accent) font-semibold",
										isPending && "text-muted-foreground/50",
									)}
								>
									{stage}
								</p>
							</div>
						);
					})}
				</div>
			</div>

			{/* ── Terminal ── */}
			<div className="rounded-xl overflow-hidden border border-zinc-800">
				{/* Terminal header */}
				<div className="flex items-center gap-2 bg-zinc-900 px-3 py-2 border-b border-zinc-800">
					<div className="flex gap-1.5">
						<span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
						<span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
						<span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
					</div>
					<p className="text-[10px] text-zinc-500 font-mono flex-1 text-center">
						personaforge — analysis pipeline
					</p>
					<span className="text-[10px] font-mono text-zinc-600">{now}</span>
				</div>

				{/* Terminal body */}
				<div className="bg-zinc-950 px-4 py-3 space-y-1 min-h-[120px] max-h-[200px] overflow-y-auto font-mono text-xs">
					{displayedLogs.length === 0 && (
						<p className="text-zinc-600">
							<span className="text-emerald-500">$</span> Initializing pipeline...
						</p>
					)}
					{displayedLogs.map((msg, i) => {
						const isDivider = msg.startsWith("—") && msg.endsWith("—");
						const isLatest = i === displayedLogs.length - 1;
						return (
							<p
								key={`${i}-${msg.slice(0, 20)}`}
								className={cn(
									"transition-all duration-300",
									isDivider
										? "text-zinc-600 text-center py-0.5 border-y border-zinc-800 my-1"
										: isLatest
											? "text-emerald-400"
											: "text-zinc-500",
								)}
								style={{
									animation: isLatest ? "slideUp 0.3s ease forwards" : undefined,
								}}
							>
								{!isDivider && (
									<span className={isLatest ? "text-emerald-600" : "text-zinc-700"}>
										$ {" "}
									</span>
								)}
								{msg}
							</p>
						);
					})}
					<div ref={logEndRef} />
				</div>
			</div>

			{partialNotice && (
				<div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
					<p className="text-xs text-amber-600 dark:text-amber-400">
						{partialNotice}
					</p>
				</div>
			)}
		</div>
	);
}
