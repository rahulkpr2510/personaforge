// components/dashboard/AnalysisCard.tsx
"use client";
import Link from "next/link";
import { motion } from "motion/react";
import { Globe, FileText, Users, Calendar } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { SentimentBadge } from "./SentimentBadge";
import { FrictionBar } from "./FrictionBar";
import { cn } from "@/lib/utils";

interface AnalysisCardProps {
	analysis: {
		id: string;
		url: string;
		status: "PENDING" | "CRAWLING" | "ANALYZING" | "COMPLETED" | "FAILED";
		deviceType: "DESKTOP" | "MOBILE";
		overallSentiment?: "POSITIVE" | "NEUTRAL" | "NEGATIVE" | null;
		overallFrictionScore?: number | null;
		createdAt: string;
		_count?: { pages: number; personas: number };
		error?: string | null;
	};
	href: string;
	className?: string;
}

export function AnalysisCard({ analysis, href, className }: AnalysisCardProps) {
	const hostname = (() => {
		try {
			return new URL(analysis.url).hostname;
		} catch {
			return analysis.url;
		}
	})();
	const date = new Date(analysis.createdAt).toLocaleDateString("en-IN", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});

	return (
		<motion.div
			initial={{ opacity: 0, y: 6 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
		>
			<Link
				href={href}
				className={cn(
					"group block rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:border-(--pf-accent)/40 hover:shadow-md",
					className,
				)}
			>
				<div className="flex items-start justify-between gap-3">
					<div className="flex min-w-0 items-center gap-3">
						<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
							<Globe
								className="h-4 w-4 text-muted-foreground"
								strokeWidth={1.5}
							/>
						</div>
						<div className="min-w-0">
							<p className="truncate text-sm font-medium text-foreground group-hover:text-(--pf-accent) transition-colors">
								{hostname}
							</p>
							<p className="truncate text-xs text-muted-foreground mt-0.5">
								{analysis.url}
							</p>
						</div>
					</div>
					<StatusBadge status={analysis.status} />
				</div>

				{analysis.status === "COMPLETED" && (
					<div className="mt-4 space-y-2">
						{analysis.overallFrictionScore != null && (
							<div>
								<p className="mb-1 text-xs text-muted-foreground">
									Friction Score
								</p>
								<FrictionBar score={analysis.overallFrictionScore} />
							</div>
						)}
					</div>
				)}

				{analysis.status === "FAILED" && analysis.error && (
					<p className="mt-3 rounded-md bg-destructive/8 px-3 py-2 text-xs text-destructive line-clamp-2">
						{analysis.error}
					</p>
				)}

				<div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
					{analysis.overallSentiment && (
						<SentimentBadge sentiment={analysis.overallSentiment} />
					)}
					{analysis._count && (
						<>
							<span className="flex items-center gap-1">
								<FileText className="h-3 w-3" />
								{analysis._count.pages} pages
							</span>
							<span className="flex items-center gap-1">
								<Users className="h-3 w-3" />
								{analysis._count.personas} personas
							</span>
						</>
					)}
					<span className="flex items-center gap-1 ml-auto">
						<Calendar className="h-3 w-3" />
						{date}
					</span>
					<span
						className={cn(
							"rounded px-1.5 py-0.5 text-xs font-medium",
							analysis.deviceType === "MOBILE"
								? "bg-(--pf-amber-soft) text-(--pf-amber)"
								: "bg-muted text-muted-foreground",
						)}
					>
						{analysis.deviceType === "MOBILE" ? "📱 Mobile" : "🖥️ Desktop"}
					</span>
				</div>
			</Link>
		</motion.div>
	);
}
