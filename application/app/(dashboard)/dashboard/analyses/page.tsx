// app/(dashboard)/dashboard/analyses/page.tsx
"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { AnalysisCard } from "@/components/dashboard/AnalysisCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { SkeletonCard } from "@/components/dashboard/SkeletonCard";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnalysisApi } from "@/lib/api/analyses";

interface Analysis {
	id: string;
	url: string;
	status: "PENDING" | "CRAWLING" | "ANALYZING" | "COMPLETED" | "FAILED";
	deviceType: "DESKTOP" | "MOBILE";
	overallSentiment?: "POSITIVE" | "NEUTRAL" | "NEGATIVE" | null;
	overallFrictionScore?: number | null;
	createdAt: string;
	error?: string | null;
	_count: { pages: number; personas: number };
}

const STATUS_FILTERS = [
	"ALL",
	"PENDING",
	"CRAWLING",
	"ANALYZING",
	"COMPLETED",
	"FAILED",
] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const statusLabels: Record<StatusFilter, string> = {
	ALL: "All",
	PENDING: "Queued",
	CRAWLING: "Crawling",
	ANALYZING: "Analyzing",
	COMPLETED: "Completed",
	FAILED: "Failed",
};

const statusDotColors: Partial<Record<StatusFilter, string>> = {
	CRAWLING: "bg-[var(--pf-accent)] animate-pulse",
	ANALYZING: "bg-[var(--pf-amber)] animate-pulse",
	COMPLETED: "bg-[var(--pf-green)]",
	FAILED: "bg-destructive",
};

export default function AnalysesPage() {
	const [all, setAll] = useState<Analysis[]>([]);
	const [loading, setLoading] = useState(true);
	const [filter, setFilter] = useState<StatusFilter>("ALL");

	useEffect(() => {
		(async () => {
			setLoading(true);
			try {
				const data = await AnalysisApi.list();
				setAll(data.analyses ?? []);
			} catch (err) {
				console.error("Failed to load analyses:", err);
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	const filtered =
		filter === "ALL" ? all : all.filter((a) => a.status === filter);

	const counts = STATUS_FILTERS.reduce(
		(acc, s) => {
			acc[s] =
				s === "ALL" ? all.length : all.filter((a) => a.status === s).length;
			return acc;
		},
		{} as Record<StatusFilter, number>,
	);

	return (
		<div className="space-y-6">
			<PageHeader
				title="Analyses"
				description={`${all.length} total`}
				actions={
					<Link
						href="/dashboard/new-analysis"
						className="flex items-center gap-2 rounded-xl bg-(--pf-accent) px-4 py-2.5 text-sm font-semibold text-white shadow-[0_2px_12px_var(--pf-accent,#6366f1)30] hover:opacity-90 hover:-translate-y-0.5 transition-all"
					>
						<PlusCircle className="h-4 w-4" />
						New Analysis
					</Link>
				}
			/>

			{/* Status filter pills */}
			{!loading && all.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{STATUS_FILTERS.map((s) => {
						const count = counts[s];
						if (s !== "ALL" && count === 0) return null;
						return (
							<button
								key={s}
								onClick={() => setFilter(s)}
								className={cn(
									"flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all",
									filter === s
										? "border-(--pf-accent) bg-(--pf-accent-soft) text-(--pf-accent)"
										: "border-border text-muted-foreground hover:border-(--pf-accent)/50 hover:text-foreground",
								)}
							>
								{statusDotColors[s] && (
									<span
										className={cn(
											"h-1.5 w-1.5 rounded-full",
											statusDotColors[s],
										)}
									/>
								)}
								{statusLabels[s]}
								<span
									className={cn(
										"rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
										filter === s
											? "bg-(--pf-accent)/15 text-(--pf-accent)"
											: "bg-muted text-muted-foreground",
									)}
								>
									{count}
								</span>
							</button>
						);
					})}
				</div>
			)}

			<AnimatePresence mode="wait" initial={false}>
				{loading ? (
					<motion.div
						key="skeleton"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
					>
						{[...Array(6)].map((_, i) => (
							<SkeletonCard key={i} />
						))}
					</motion.div>
				) : filtered.length === 0 && all.length === 0 ? (
					<motion.div
						key="empty-all"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.2 }}
					>
						<EmptyState
							icon="FlaskConical"
							title="No analyses yet"
							description="Start by analysing a product or landing page with your chosen personas. You'll get detailed friction scores, sentiment analysis, and recommendations."
							action={
								<Link
									href="/dashboard/new-analysis"
									className="inline-flex items-center gap-2 rounded-xl bg-(--pf-accent) px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
								>
									<PlusCircle className="h-4 w-4" /> New Analysis
								</Link>
							}
						/>
					</motion.div>
				) : filtered.length === 0 ? (
					<motion.div
						key="empty-filter"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.2 }}
						className="py-14 text-center"
					>
						<p className="text-sm text-muted-foreground">
							No {statusLabels[filter].toLowerCase()} analyses.
						</p>
						<button
							onClick={() => setFilter("ALL")}
							className="mt-2 text-xs text-(--pf-accent) hover:opacity-80 transition-opacity"
						>
							Clear filter
						</button>
					</motion.div>
				) : (
					<motion.div
						key="cards"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pb-3"
					>
						{filtered.map((a) => (
							<AnalysisCard
								key={a.id}
								analysis={a}
								href={`/dashboard/analyses/${a.id}`}
							/>
						))}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
