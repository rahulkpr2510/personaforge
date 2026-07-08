"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AnalysisCard } from "./AnalysisCard";

interface Analysis {
	id: string;
	url: string;
	status: "PENDING" | "CRAWLING" | "ANALYZING" | "COMPLETED" | "FAILED";
	deviceType: "DESKTOP" | "MOBILE";
	overallSentiment?: "POSITIVE" | "NEUTRAL" | "NEGATIVE" | null;
	overallFrictionScore?: number | null;
	createdAt: string;
	_count?: { pages: number; personas: number };
	error?: string | null;
}

type Range = "7" | "14" | "all";

interface Props {
	analyses: Analysis[];
	allCount: number;
}

export function RecentAnalysesSection({ analyses, allCount }: Props) {
	const [range, setRange] = useState<Range>("7");

	const filtered = useMemo(() => {
		if (range === "all") return analyses;
		const days = parseInt(range, 10);
		const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
		return analyses.filter((a) => new Date(a.createdAt).getTime() >= cutoff);
	}, [analyses, range]);

	const TABS: { value: Range; label: string }[] = [
		{ value: "7", label: "Last 7 days" },
		{ value: "14", label: "Last 14 days" },
		{ value: "all", label: "All" },
	];

	return (
		<div>
			<div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
				<div>
					<h2 className="font-heading text-base font-semibold text-foreground">
						Recent Analyses
					</h2>
					<p className="text-xs text-muted-foreground mt-0.5">
						{filtered.length} {filtered.length === 1 ? "analysis" : "analyses"} in selected period
					</p>
				</div>

				<div className="flex items-center gap-1">
					{/* Tab switcher — styled like admin users section */}
					<div className="flex items-center gap-0.5 rounded-lg border border-border bg-muted/40 p-0.5">
						{TABS.map((tab) => (
							<button
								key={tab.value}
								onClick={() => setRange(tab.value)}
								className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
									range === tab.value
										? "bg-card text-foreground shadow-sm border border-border"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								{tab.label}
							</button>
						))}
					</div>

					{allCount > 6 && (
						<Link
							href="/dashboard/analyses"
							className="ml-2 flex items-center gap-1 text-xs font-medium text-(--pf-accent) hover:opacity-80 transition-opacity"
						>
							View all <ArrowRight className="h-3 w-3" />
						</Link>
					)}
				</div>
			</div>

			{filtered.length === 0 ? (
				<div className="rounded-xl border border-border bg-muted/20 p-8 text-center">
					<p className="text-sm text-muted-foreground">
						No analyses in the last {range === "all" ? "" : `${range} `}days
					</p>
				</div>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{filtered.map((a) => (
						<AnalysisCard
							key={a.id}
							analysis={a}
							href={`/dashboard/analyses/${a.id}`}
						/>
					))}
				</div>
			)}
		</div>
	);
}
