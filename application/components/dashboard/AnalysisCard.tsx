// components/dashboard/AnalysisCard.tsx
"use client";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
	Globe,
	FileText,
	Users,
	Calendar,
	Monitor,
	Smartphone,
	ArrowRight,
} from "lucide-react";
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
	const [hovered, setHovered] = useState(false);

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

	const isMobile = analysis.deviceType === "MOBILE";

	return (
		<motion.div
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
			onHoverStart={() => setHovered(true)}
			onHoverEnd={() => setHovered(false)}
			className="h-full"
		>
			<Link
				href={href}
				className={cn(
					"group flex flex-col rounded-xl border border-border bg-card overflow-hidden transition-all duration-300 h-full",
					"hover:border-(--pf-accent)/40 hover:shadow-[0_4px_24px_-4px_var(--pf-accent,#6366f1)22]",
					className,
				)}
			>
				{/* Top accent line (slides in on hover) */}
				<motion.div
					className="shrink-0 h-[2px] bg-linear-to-r from-(--pf-accent)/0 via-(--pf-accent) to-(--pf-accent)/0"
					animate={{ scaleX: hovered ? 1 : 0, opacity: hovered ? 1 : 0 }}
					initial={{ scaleX: 0, opacity: 0 }}
					transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
				/>

				{/* Main card body — grows to fill */}
				<div className="flex-1 p-5">
					{/* Header */}
					<div className="flex items-start justify-between gap-3">
						<div className="flex min-w-0 items-center gap-3">
							{/* Favicon orb */}
							<div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted border border-border overflow-hidden">
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img
									src={`https://www.google.com/s2/favicons?domain=${hostname}&sz=32`}
									alt=""
									className="h-5 w-5 object-contain"
									onError={(e) => {
										(e.currentTarget as HTMLImageElement).style.display =
											"none";
									}}
								/>
								<Globe
									className="absolute h-4 w-4 text-muted-foreground"
									strokeWidth={1.5}
								/>
							</div>

							<div className="min-w-0">
								<p className="truncate text-sm font-semibold text-foreground group-hover:text-(--pf-accent) transition-colors duration-200">
									{hostname}
								</p>
								<p className="truncate text-xs text-muted-foreground mt-0.5">
									{analysis.url}
								</p>
							</div>
						</div>

						<div className="flex items-center gap-2 shrink-0">
							<StatusBadge status={analysis.status} />
						</div>
					</div>

					{/* Friction score */}
					{analysis.status === "COMPLETED" &&
						analysis.overallFrictionScore != null && (
							<div className="mt-4">
								<div className="flex items-center justify-between mb-1.5">
									<p className="text-xs font-medium text-muted-foreground">
										Friction Score
									</p>
									<span
										className={cn(
											"font-mono text-xs font-bold tabular-nums",
											analysis.overallFrictionScore <= 33
												? "text-(--pf-green)"
												: analysis.overallFrictionScore <= 66
													? "text-(--pf-amber)"
													: "text-destructive",
										)}
									>
										{analysis.overallFrictionScore.toFixed(0)}
										<span className="text-muted-foreground font-normal">
											/100
										</span>
									</span>
								</div>
								<FrictionBar
									score={analysis.overallFrictionScore}
									showLabel={false}
								/>
							</div>
						)}

					{/* Error */}
					{analysis.status === "FAILED" && analysis.error && (
						<p className="mt-3 rounded-lg bg-destructive/8 border border-destructive/15 px-3 py-2 text-xs text-destructive line-clamp-2">
							{analysis.error}
						</p>
					)}

					{/* Footer metadata */}
					<div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-border/60 pt-3">
						{analysis.overallSentiment && (
							<SentimentBadge sentiment={analysis.overallSentiment} />
						)}

						{analysis._count && (
							<>
								<span className="flex items-center gap-1 text-xs text-muted-foreground">
									<FileText className="h-3 w-3" />
									{analysis._count.pages} pages
								</span>
								<span className="flex items-center gap-1 text-xs text-muted-foreground">
									<Users className="h-3 w-3" />
									{analysis._count.personas} personas
								</span>
							</>
						)}

						<span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
							{isMobile ? (
								<Smartphone className="h-3 w-3" />
							) : (
								<Monitor className="h-3 w-3" />
							)}
							{isMobile ? "Mobile" : "Desktop"}
						</span>

						<span className="flex items-center gap-1 text-xs text-muted-foreground">
							<Calendar className="h-3 w-3" />
							{date}
						</span>
					</div>
				</div>

				{/* Slide-up CTA footer — appears on hover below the card body */}
				<AnimatePresence>
					{hovered && (
						<motion.div
							key="cta"
							initial={{ height: 0, opacity: 0 }}
							animate={{ height: 40, opacity: 1 }}
							exit={{ height: 0, opacity: 0 }}
							transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
							className="overflow-hidden shrink-0"
						>
							<div className="flex items-center justify-center gap-2 h-10 border-t border-(--pf-accent)/20 bg-(--pf-accent-soft) text-xs font-semibold text-(--pf-accent)">
								View full report <ArrowRight className="h-3.5 w-3.5" />
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</Link>
		</motion.div>
	);
}
