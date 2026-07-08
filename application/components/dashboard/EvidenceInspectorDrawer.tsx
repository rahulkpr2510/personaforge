"use client";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
	X,
	Eye,
	BarChart3,
	AlertTriangle,
	Lightbulb,
	TrendingUp,
	ChevronRight,
	Shield,
	Code2,
	ExternalLink,
} from "lucide-react";
import { LEVEL_META, type EvidenceLevel } from "./AnalysisReliabilityCard";

interface FindingDetail {
	type: "pain-point" | "positive" | "recommendation";
	issue?: string;
	finding?: string;
	improvement?: string;
	evidence: string;
	reasoning?: string;
	severity?: "Low" | "Medium" | "High" | "Critical";
	confidence?: number;
	confidenceReason?: string;
	evidenceLevel?: EvidenceLevel;
	affectedPages?: string[];
	expectedImpact?: string;
	businessImpact?: string;
	recommendation?: string;
	personaLabel: string;
	personaName: string;
	screenshotUrl?: string;
}

interface EvidenceInspectorDrawerProps {
	finding: FindingDetail | null;
	onClose: () => void;
}

const SEVERITY_META: Record<
	string,
	{ color: string; bg: string; border: string }
> = {
	Critical: {
		color: "text-red-700 dark:text-red-400",
		bg: "bg-red-50 dark:bg-red-950/30",
		border: "border-red-500/30",
	},
	High: {
		color: "text-orange-700 dark:text-orange-400",
		bg: "bg-orange-50 dark:bg-orange-950/30",
		border: "border-orange-500/30",
	},
	Medium: {
		color: "text-amber-700 dark:text-amber-400",
		bg: "bg-amber-50 dark:bg-amber-950/30",
		border: "border-amber-500/20",
	},
	Low: {
		color: "text-blue-700 dark:text-blue-400",
		bg: "bg-blue-50 dark:bg-blue-950/30",
		border: "border-blue-500/20",
	},
};

function ConfidenceRing({ confidence }: { confidence: number }) {
	const size = 56;
	const stroke = 4;
	const r = (size - stroke) / 2;
	const circ = 2 * Math.PI * r;
	const color =
		confidence >= 80
			? "#059669"
			: confidence >= 60
				? "#2563eb"
				: confidence >= 40
					? "#d97706"
					: "#9ca3af";

	return (
		<div className="relative shrink-0" style={{ width: size, height: size }}>
			<svg width={size} height={size} className="-rotate-90">
				<circle
					cx={size / 2}
					cy={size / 2}
					r={r}
					fill="none"
					stroke="currentColor"
					strokeWidth={stroke}
					className="text-muted/30"
				/>
				<circle
					cx={size / 2}
					cy={size / 2}
					r={r}
					fill="none"
					stroke={color}
					strokeWidth={stroke}
					strokeDasharray={circ}
					strokeDashoffset={circ * (1 - confidence / 100)}
					strokeLinecap="round"
					className="transition-all duration-700"
				/>
			</svg>
			<div className="absolute inset-0 flex flex-col items-center justify-center">
				<p className="text-xs font-bold leading-none" style={{ color }}>
					{confidence}%
				</p>
				<p className="text-[8px] text-muted-foreground leading-none mt-0.5">
					conf.
				</p>
			</div>
		</div>
	);
}

function Section({
	icon: Icon,
	label,
	children,
	accent = false,
}: {
	icon: React.ElementType;
	label: string;
	children: React.ReactNode;
	accent?: boolean;
}) {
	return (
		<div
			className={cn(
				"space-y-1.5",
				accent && "rounded-lg border border-border bg-muted/20 p-3",
			)}
		>
			<div className="flex items-center gap-1.5">
				<Icon className="h-3.5 w-3.5 text-(--pf-accent)" />
				<p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
					{label}
				</p>
			</div>
			<div className="text-sm text-foreground leading-relaxed">{children}</div>
		</div>
	);
}

export function EvidenceInspectorDrawer({
	finding,
	onClose,
}: EvidenceInspectorDrawerProps) {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		if (finding) {
			setIsVisible(true);
			document.body.style.overflow = "hidden";
		} else {
			setIsVisible(false);
			document.body.style.overflow = "";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [finding]);

	const handleClose = useCallback(() => {
		setIsVisible(false);
		setTimeout(onClose, 200);
	}, [onClose]);

	// Keyboard close
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") handleClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [handleClose]);

	if (!finding && !isVisible) return null;

	const f = finding;
	const title = f?.issue ?? f?.finding ?? f?.improvement ?? "Finding";
	const levelMeta = f?.evidenceLevel
		? LEVEL_META[f.evidenceLevel]
		: LEVEL_META["INFERRED"];
	const severityMeta = f?.severity ? SEVERITY_META[f.severity] : null;

	return (
		<>
			{/* Overlay */}
			<div
				className={cn(
					"fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-200",
					isVisible ? "opacity-100" : "opacity-0",
				)}
				onClick={handleClose}
				aria-hidden="true"
			/>

			{/* Drawer */}
			<div
				className={cn(
					"fixed right-0 top-0 bottom-0 z-50 w-full max-w-[480px] bg-background border-l border-border shadow-2xl flex flex-col transition-transform duration-200 ease-out",
					isVisible ? "translate-x-0" : "translate-x-full",
				)}
				role="dialog"
				aria-label="Evidence Inspector"
				aria-modal="true"
			>
				{/* Header */}
				<div className="flex items-start gap-3 px-5 py-4 border-b border-border bg-card">
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2 mb-1.5">
							<span
								className={cn(
									"text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
									f?.type === "pain-point"
										? "text-red-600 bg-red-50 border-red-500/20 dark:text-red-400 dark:bg-red-950/30"
										: f?.type === "positive"
											? "text-emerald-600 bg-emerald-50 border-emerald-500/20 dark:text-emerald-400 dark:bg-emerald-950/30"
											: "text-blue-600 bg-blue-50 border-blue-500/20 dark:text-blue-400 dark:bg-blue-950/30",
								)}
							>
								{f?.type === "pain-point"
									? "Pain Point"
									: f?.type === "positive"
										? "Strength"
										: "Recommendation"}
							</span>
							{f?.evidenceLevel && (
								<span
									className={cn(
										"inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
										levelMeta.bg,
										levelMeta.border,
										levelMeta.color,
									)}
								>
									<span
										className={cn("h-1.5 w-1.5 rounded-full", levelMeta.dot)}
									/>
									{levelMeta.label}
								</span>
							)}
						</div>
						<h2 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
							{title}
						</h2>
						{f?.personaLabel && (
							<p className="text-xs text-muted-foreground mt-1">
								{f.personaLabel} · {f.personaName}
							</p>
						)}
					</div>

					{f?.confidence != null && (
						<ConfidenceRing confidence={f.confidence} />
					)}

					<button
						onClick={handleClose}
						className="shrink-0 rounded-lg p-1.5 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
						aria-label="Close inspector"
					>
						<X className="h-4 w-4" />
					</button>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
					{/* Screenshot thumbnail */}
					{f?.screenshotUrl && (
						<div className="rounded-lg overflow-hidden border border-border">
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={f.screenshotUrl}
								alt="Page screenshot"
								className="w-full object-cover max-h-48"
							/>
						</div>
					)}

					{/* Severity badge */}
					{severityMeta && f?.severity && (
						<div
							className={cn(
								"rounded-lg border px-3 py-2",
								severityMeta.bg,
								severityMeta.border,
							)}
						>
							<p className={cn("text-xs font-semibold", severityMeta.color)}>
								Severity: {f.severity}
							</p>
						</div>
					)}

					{/* Evidence chain */}
					<Section icon={Eye} label="What was observed">
						{f?.evidence ?? "Evidence not recorded for this finding."}
					</Section>

					{f?.reasoning && (
						<Section icon={Code2} label="Why it matters">
							{f.reasoning}
						</Section>
					)}

					{(f?.improvement ?? f?.recommendation) && (
						<Section icon={Lightbulb} label="Recommended improvement" accent>
							{f?.improvement ?? f?.recommendation ?? ""}
						</Section>
					)}

					{f?.expectedImpact && (
						<Section icon={TrendingUp} label="Expected impact">
							{f.expectedImpact}
						</Section>
					)}

					{f?.businessImpact && (
						<Section icon={BarChart3} label="Business impact">
							{f.businessImpact}
						</Section>
					)}

					{/* Confidence explanation */}
					{f?.confidenceReason && (
						<Section icon={Shield} label="Confidence basis">
							{f.confidenceReason}
							{f.evidenceLevel && (
								<p className="mt-1 text-xs text-muted-foreground">
									Evidence level:{" "}
									<span className={cn("font-semibold", levelMeta.color)}>
										{levelMeta.label}
									</span>{" "}
									— {levelMeta.desc}
								</p>
							)}
						</Section>
					)}
				</div>

				{/* Footer */}
				<div className="border-t border-border px-5 py-3 bg-muted/20">
					<p className="text-[10px] text-muted-foreground text-center">
						Evidence Inspector · PersonaForge AI Research Platform
					</p>
				</div>
			</div>
		</>
	);
}

export type { FindingDetail };
