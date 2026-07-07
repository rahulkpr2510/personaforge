"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { pdf } from "@react-pdf/renderer";
import {
	Download,
	FileText,
	X,
	Loader2,
	CheckCircle2,
	BookOpen,
	Users,
	BarChart3,
	Globe,
	MessageSquare,
	Activity,
	AlertTriangle,
} from "lucide-react";
import AnalysisPdfReport from "./AnalysisPdfReport";

const PDFDownloadLink = dynamic(
	() => import("@react-pdf/renderer").then((m) => m.PDFDownloadLink),
	{ ssr: false, loading: () => null },
);

interface Props {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	analysis: any;
	filename: string;
}

interface Section {
	icon: React.ElementType;
	label: string;
	description: string;
	isSub?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildSections(analysis: any): Section[] {
	const personaCount = (analysis.personas ?? []).length;
	const pageCount = (analysis.pages ?? []).length;
	const hasCoverage = !!(
		analysis.crawlCoverage ||
		analysis.analysisReliability ||
		analysis.meta?.crawlCoverage ||
		analysis.meta?.analysisReliability
	);
	const hasFocusGroup = !!analysis.focusGroup;
	const hasCrawlerStats = !!(
		analysis.crawlerStats || analysis.meta?.crawlerStats
	);
	const hasPages = pageCount > 0;

	const sections: Section[] = [];

	sections.push({
		icon: FileText,
		label: "Cover Page",
		description: "Site overview & analysis summary",
	});

	sections.push({
		icon: BarChart3,
		label: "Executive Scorecard",
		description: "Strengths, risks & adoption comparison",
	});

	if (hasCoverage) {
		sections.push({
			icon: Activity,
			label: "Coverage & Reliability",
			description: "Evidence confidence & crawl scope",
		});
	}

	if (personaCount > 0) {
		sections.push({
			icon: Users,
			label: "Personas",
			description: `${personaCount} synthetic user evaluation${personaCount !== 1 ? "s" : ""}`,
		});
		for (let i = 0; i < personaCount; i++) {
			const name =
				analysis.personas[i]?.label ??
				analysis.personas[i]?.name ??
				`Persona ${i + 1}`;
			sections.push({
				icon: Users,
				label: name,
				description: analysis.personas[i]?.occupation ?? "Persona profile",
				isSub: true,
			});
		}
	}

	if (hasFocusGroup) {
		sections.push({
			icon: MessageSquare,
			label: "Focus Group",
			description: "Cross-persona moderated debate",
		});
	}

	if (hasCrawlerStats) {
		sections.push({
			icon: Activity,
			label: "Crawler Statistics",
			description: "Performance & crawl metrics",
		});
	}

	if (hasPages) {
		sections.push({
			icon: Globe,
			label: "Crawled Pages",
			description: `${pageCount} page${pageCount !== 1 ? "s" : ""} analyzed`,
		});
	}

	sections.push({
		icon: AlertTriangle,
		label: "Appendix",
		description: "Research gaps & caveats",
	});

	return sections;
}

export function PdfPreviewModal({ analysis, filename }: Props) {
	const [open, setOpen] = useState(false);
	const [isClient, setIsClient] = useState(false);
	const [blobUrl, setBlobUrl] = useState<string | null>(null);
	const [generating, setGenerating] = useState(false);

	const blobUrlRef = useRef<string | null>(null);

	useEffect(() => {
		setIsClient(true);
	}, []);

	useEffect(() => {
		return () => {
			if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
		};
	}, []);

	useEffect(() => {
		if (!open) return;
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape") setOpen(false);
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [open]);

	const generatePdf = useCallback(async () => {
		if (blobUrlRef.current) return;
		setGenerating(true);
		try {
			const instance = pdf(<AnalysisPdfReport analysis={analysis} />);
			const blob = await instance.toBlob();
			const url = URL.createObjectURL(blob);
			blobUrlRef.current = url;
			setBlobUrl(url);
		} catch (err) {
			console.error("[PersonaForge] PDF generation failed:", err);
		} finally {
			setGenerating(false);
		}
	}, [analysis]);

	useEffect(() => {
		if (open) generatePdf();
	}, [open, generatePdf]);

	if (!isClient) return null;

	const hostname = (() => {
		try {
			return new URL(analysis.url).hostname;
		} catch {
			return analysis.url ?? "";
		}
	})();

	const personaCount = analysis.personas?.length ?? 0;
	const pageCount = analysis.pages?.length ?? 0;
	const uxScore = analysis.overallUxScore as number | null | undefined;
	const sections = buildSections(analysis);
	const topLevelCount = sections.filter((s) => !s.isSub).length;

	return (
		<>
			{/* Trigger */}
			<button
				onClick={() => setOpen(true)}
				className="no-print inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:opacity-90 hover:shadow-lg active:scale-95"
			>
				<FileText className="h-4 w-4" />
				Export PDF Report
			</button>

			{/* Modal */}
			{open && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-3 sm:p-5"
					onClick={(e) => {
						if (e.target === e.currentTarget) setOpen(false);
					}}
				>
					<div
						className="relative flex w-full max-w-6xl h-[93vh] rounded-2xl bg-background shadow-2xl overflow-hidden ring-1 ring-border"
						onClick={(e) => e.stopPropagation()}
					>
						{/* ── LEFT SIDEBAR (info only) ── */}
						<aside className="hidden lg:flex w-[260px] xl:w-[280px] shrink-0 flex-col border-r border-border bg-muted/20">

							{/* Brand */}
							<div className="px-5 py-4 border-b border-border">
								<div className="flex items-center gap-2.5 mb-1">
									<div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
										<FileText className="h-3.5 w-3.5 text-primary" />
									</div>
									<span className="text-sm font-bold text-foreground">PersonaForge</span>
								</div>
								<p className="text-[11px] text-muted-foreground truncate">{hostname}</p>
							</div>

							{/* Stats */}
							<div className="px-4 py-3 border-b border-border space-y-2">
								{[
									{ label: "Personas", value: String(personaCount) },
									{ label: "Pages crawled", value: String(pageCount) },
									...(uxScore != null
										? [
												{
													label: "UX Score",
													value: `${uxScore}/100`,
													color:
														uxScore >= 75
															? "#059669"
															: uxScore >= 55
																? "#D97706"
																: "#DC2626",
												},
											]
										: []),
									{ label: "Sections", value: String(topLevelCount) },
								].map((stat) => (
									<div key={stat.label} className="flex items-center justify-between">
										<span className="text-[11px] text-muted-foreground">{stat.label}</span>
										<span
											className="text-[11px] font-semibold tabular-nums"
											style={{ color: (stat as { color?: string }).color }}
										>
											{stat.value}
										</span>
									</div>
								))}
							</div>

							{/* Section list — purely informational */}
							<div className="flex-1 overflow-y-auto py-3 px-3">
								<p className="px-1 mb-3 text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">
									Contents
								</p>
								<div className="space-y-0.5">
									{sections.map((section, i) => {
										const Icon = section.icon;
										return (
											<div
												key={i}
												className={[
													"flex items-start gap-2.5 rounded-lg px-2.5 py-2",
													section.isSub ? "ml-5 border-l border-border/40 rounded-l-none pl-3" : "",
												]
													.filter(Boolean)
													.join(" ")}
											>
												{!section.isSub ? (
													<div className="h-6 w-6 rounded-md bg-primary/8 flex items-center justify-center shrink-0 mt-0.5">
														<Icon className="h-3 w-3 text-primary/70" />
													</div>
												) : (
													<div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30 shrink-0 mt-1.5" />
												)}
												<div className="min-w-0 flex-1">
													<p
														className={[
															"font-medium leading-tight truncate",
															section.isSub
																? "text-[11px] text-muted-foreground"
																: "text-[12px] text-foreground",
														].join(" ")}
													>
														{section.label}
													</p>
													{!section.isSub && (
														<p className="text-[10px] text-muted-foreground/70 mt-0.5 leading-snug">
															{section.description}
														</p>
													)}
												</div>
											</div>
										);
									})}
								</div>
							</div>

							{/* Download */}
							<div className="p-4 border-t border-border space-y-2">
								<PDFDownloadLink
									document={<AnalysisPdfReport analysis={analysis} />}
									fileName={`${filename}.pdf`}
								>
									{/* @ts-ignore */}
									{({ loading, error }) =>
										loading ? (
											<button
												disabled
												className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary/50 px-4 py-2.5 text-sm font-semibold text-primary-foreground cursor-not-allowed"
											>
												<Loader2 className="h-4 w-4 animate-spin" />
												Preparing…
											</button>
										) : error ? (
											<button
												disabled
												className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-destructive/20 px-4 py-2.5 text-sm font-semibold text-destructive cursor-not-allowed"
											>
												Error — retry
											</button>
										) : (
											<button className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-95">
												<Download className="h-4 w-4" />
												Download PDF
											</button>
										)
									}
								</PDFDownloadLink>
								<p className="text-center text-[10px] text-muted-foreground">
									A4 · {topLevelCount} sections · {personaCount} persona
									{personaCount !== 1 ? "s" : ""}
								</p>
							</div>
						</aside>

						{/* ── RIGHT: PDF VIEWER ── */}
						<div className="flex flex-1 flex-col min-w-0">
							{/* Top bar */}
							<div className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0 bg-background/80 backdrop-blur-sm">
								<div className="flex items-center gap-3">
									<BookOpen className="h-4 w-4 text-muted-foreground" />
									<span className="text-sm font-semibold text-foreground">Report Preview</span>
									{generating ? (
										<span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
											<Loader2 className="h-3 w-3 animate-spin" />
											Rendering…
										</span>
									) : blobUrl ? (
										<span className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-[11px] font-medium text-green-600">
											<CheckCircle2 className="h-3 w-3" />
											Ready
										</span>
									) : null}
								</div>

								<div className="flex items-center gap-2">
									{/* Mobile download */}
									<div className="lg:hidden">
										<PDFDownloadLink
											document={<AnalysisPdfReport analysis={analysis} />}
											fileName={`${filename}.pdf`}
										>
											{/* @ts-ignore */}
											{({ loading }) =>
												loading ? (
													<button
														disabled
														className="inline-flex items-center gap-1.5 rounded-lg bg-primary/60 px-3 py-2 text-sm font-semibold text-primary-foreground cursor-not-allowed"
													>
														<Loader2 className="h-3.5 w-3.5 animate-spin" />
													</button>
												) : (
													<button className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-all">
														<Download className="h-3.5 w-3.5" />
														Download
													</button>
												)
											}
										</PDFDownloadLink>
									</div>
									<button
										onClick={() => setOpen(false)}
										className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
										aria-label="Close"
									>
										<X className="h-4 w-4" />
									</button>
								</div>
							</div>

							{/* PDF area */}
							<div className="flex-1 overflow-hidden bg-zinc-100 dark:bg-zinc-900 relative">
								{(generating || !blobUrl) && (
									<div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 bg-zinc-100 dark:bg-zinc-900">
										<div className="relative">
											<div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
												<FileText className="h-9 w-9 text-primary" />
											</div>
											<div className="absolute -bottom-1.5 -right-1.5 h-7 w-7 rounded-full bg-background border-2 border-border flex items-center justify-center shadow">
												<Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
											</div>
										</div>
										<div className="text-center">
											<p className="text-base font-semibold text-foreground">Rendering your report</p>
											<p className="text-sm text-muted-foreground mt-1">
												Building {personaCount} persona profile
												{personaCount !== 1 ? "s" : ""} &amp; all chapters…
											</p>
										</div>
										<div className="w-56 space-y-2 opacity-40">
											{[75, 85, 65, 80].map((w, i) => (
												<div
													key={i}
													className="h-2 rounded-full bg-muted animate-pulse"
													style={{ width: `${w}%` }}
												/>
											))}
										</div>
									</div>
								)}

								{blobUrl && (
									<iframe
										src={blobUrl}
										className="w-full h-full border-0"
										title={`PersonaForge PDF — ${hostname}`}
									/>
								)}
							</div>

							{/* Bottom bar */}
							<div className="flex items-center justify-between px-5 py-2 border-t border-border bg-muted/10 shrink-0">
								<p className="text-[11px] text-muted-foreground">
									<span className="font-semibold text-foreground">{topLevelCount} sections</span>
									{" · "}
									{personaCount} persona{personaCount !== 1 ? "s" : ""}
									{" · "}
									{pageCount} crawled page{pageCount !== 1 ? "s" : ""}
								</p>
								<p className="text-[11px] text-muted-foreground">PersonaForge AI · Confidential</p>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
