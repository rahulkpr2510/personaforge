// app/(dashboard)/dashboard/analyses/[id]/page.tsx
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { SentimentBadge } from "@/components/dashboard/SentimentBadge";
import { FrictionBar } from "@/components/dashboard/FrictionBar";
import { PdfPreviewModal } from "@/components/dashboard/PdfPreviewModal";
import { PersonaAccordion } from "@/components/dashboard/PersonaAccordion";
import {
	ArrowLeft,
	Globe,
	Monitor,
	Smartphone,
	FileText,
	Users,
	CalendarDays,
	CheckCircle2,
	XCircle,
	Sparkles,
} from "lucide-react";
import { AnalysisFavicon } from "@/components/dashboard/AnalysisFavicon";
import { cn } from "@/lib/utils";

type PageParams = { params: Promise<{ id: string }> };

function sentimentMeta(s: string | null) {
	if (s === "POSITIVE")
		return {
			label: "Positive",
			color: "text-[var(--pf-green)]",
			bg: "bg-[var(--pf-green-soft)]",
			border: "border-[var(--pf-green)]/20",
		};
	if (s === "NEGATIVE")
		return {
			label: "Negative",
			color: "text-destructive",
			bg: "bg-destructive/6",
			border: "border-destructive/20",
		};
	return {
		label: "Neutral",
		color: "text-muted-foreground",
		bg: "bg-muted/60",
		border: "border-border",
	};
}

export default async function AnalysisDetailPage({ params }: PageParams) {
	const { id } = await params;
	const user = await requireAuth();

	const analysis = await db.analysis.findFirst({
		where: { id, userId: user.id },
		include: {
			pages: {
				orderBy: { depth: "asc" },
				include: {
					screenshots: { select: { id: true, cdnUrl: true, type: true } },
				},
			},
			personas: { orderBy: { createdAt: "asc" } },
			focusGroup: true,
		},
	});

	if (!analysis) notFound();

	const hostname = (() => {
		try {
			return new URL(analysis.url).hostname;
		} catch {
			return analysis.url;
		}
	})();

	const sm = sentimentMeta(analysis.overallSentiment ?? null);
	const completedAt = analysis.completedAt
		? new Date(analysis.completedAt).toLocaleDateString("en-IN", {
				day: "numeric",
				month: "short",
				year: "numeric",
			})
		: null;

	return (
		<div className="space-y-8">
			{/* Back link */}
			<Link
				href="/dashboard/analyses"
				className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
			>
				<ArrowLeft className="h-4 w-4" /> All Analyses
			</Link>

			{/* ── Hero section ── */}
			<div className="rounded-2xl border border-border bg-card overflow-hidden">
				{/* Top colour stripe */}
				<div
					className={cn(
						"h-1.5 w-full",
						analysis.status === "COMPLETED"
							? analysis.overallSentiment === "POSITIVE"
								? "bg-(--pf-green)"
								: analysis.overallSentiment === "NEGATIVE"
									? "bg-destructive"
									: "bg-(--pf-accent)"
							: analysis.status === "FAILED"
								? "bg-destructive"
								: "bg-(--pf-accent)",
					)}
				/>
				<div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-start gap-4">
						{/* Favicon */}
						<AnalysisFavicon
							domain={hostname}
							className="h-14 w-14 rounded-2xl shrink-0"
							size={64}
						/>
						<div>
							<h1 className="font-heading text-xl font-bold text-foreground">
								{hostname}
							</h1>
							<a
								href={analysis.url}
								target="_blank"
								rel="noopener noreferrer"
								className="text-xs text-muted-foreground hover:text-(--pf-accent) transition-colors flex items-center gap-1 mt-0.5"
							>
								<Globe className="h-3 w-3" />
								{analysis.url}
							</a>
						</div>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<StatusBadge status={analysis.status} />
						{analysis.status === "COMPLETED" && (
							<PdfPreviewModal
								analysis={analysis}
								filename={`PersonaForge_Report_${hostname}`}
							/>
						)}
					</div>
				</div>
			</div>

			{/* ── Stats strip ── */}
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
				{[
					{
						icon: analysis.deviceType === "MOBILE" ? Smartphone : Monitor,
						label: "Device",
						value: analysis.deviceType === "MOBILE" ? "Mobile" : "Desktop",
					},
					{
						icon: FileText,
						label: "Pages crawled",
						value: analysis.pages.length,
					},
					{ icon: Users, label: "Personas", value: analysis.personas.length },
					{
						icon: CalendarDays,
						label: completedAt ? "Completed" : "Started",
						value:
							completedAt ??
							(analysis.startedAt
								? new Date(analysis.startedAt).toLocaleDateString("en-IN", {
										day: "numeric",
										month: "short",
									})
								: "—"),
					},
				].map((stat) => (
					<div
						key={stat.label}
						className="rounded-xl border border-border bg-card p-4"
					>
						<div className="flex items-center gap-2 mb-1.5">
							<stat.icon className="h-3.5 w-3.5 text-muted-foreground" />
							<p className="text-xs text-muted-foreground">{stat.label}</p>
						</div>
						<p className="text-sm font-semibold text-foreground">
							{String(stat.value)}
						</p>
					</div>
				))}
			</div>

			{/* ── Overall Results ── */}
			{analysis.status === "COMPLETED" && (
				<div className="rounded-2xl border border-border bg-card overflow-hidden">
					<div className="border-b border-border px-6 py-4">
						<h2 className="font-heading text-sm font-semibold flex items-center gap-2">
							<Sparkles className="h-4 w-4 text-(--pf-accent)" />
							Overall Results
						</h2>
					</div>
					<div className="grid gap-0 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
						{/* Sentiment */}
						<div className="p-6">
							<p className="text-xs text-muted-foreground mb-3">
								Aggregate sentiment — how all personas felt overall
							</p>
							<div
								className={cn(
									"inline-flex items-center gap-2 rounded-xl border px-4 py-2.5",
									sm.bg,
									sm.border,
								)}
							>
								{sm.label === "Positive" ? (
									<CheckCircle2 className={cn("h-4 w-4", sm.color)} />
								) : sm.label === "Negative" ? (
									<XCircle className={cn("h-4 w-4", sm.color)} />
								) : null}
								<span className={cn("text-sm font-semibold", sm.color)}>
									{sm.label} Overall
								</span>
							</div>
							{analysis.summary && (
								<p className="mt-4 text-sm text-muted-foreground leading-relaxed">
									{analysis.summary}
								</p>
							)}
						</div>
						{/* Friction */}
						<div className="p-6">
							<p className="text-xs text-muted-foreground mb-3">
								Friction score — measures how difficult the product is to use (0
								= frictionless, 100 = very frustrating)
							</p>
							{analysis.overallFrictionScore != null ? (
								<FrictionBar score={analysis.overallFrictionScore} showLabel />
							) : (
								<p className="text-sm text-muted-foreground">
									No friction data available
								</p>
							)}
						</div>
					</div>
				</div>
			)}

			{/* ── Error state ── */}
			{analysis.status === "FAILED" && analysis.error && (
				<div className="rounded-2xl border border-destructive/25 bg-destructive/5 p-6">
					<div className="flex items-center gap-2 mb-2">
						<XCircle className="h-5 w-5 text-destructive" />
						<h2 className="font-heading text-sm font-semibold text-destructive">
							Analysis Failed
						</h2>
					</div>
					<p className="text-sm text-destructive/80 leading-relaxed">
						{analysis.error}
					</p>
				</div>
			)}

			{/* ── Persona Evaluations accordion ── */}
			{analysis.personas.length > 0 && (
				<div>
					<div className="mb-4 flex items-center justify-between">
						<div>
							<h2 className="font-heading text-base font-semibold">
								Persona Evaluations
							</h2>
							<p className="text-xs text-muted-foreground mt-0.5">
								Each persona independently browsed and evaluated your product —
								expand for their full report
							</p>
						</div>
						<span className="text-xs text-muted-foreground shrink-0">
							{analysis.personas.length} report
							{analysis.personas.length > 1 ? "s" : ""}
						</span>
					</div>
					<PersonaAccordion personas={analysis.personas} />
				</div>
			)}

			{/* ── Focus Group ── */}
			{analysis.focusGroup && (
				<div className="rounded-2xl border border-(--pf-accent)/20 bg-(--pf-accent-soft) overflow-hidden">
					<div className="border-b border-(--pf-accent)/15 px-6 py-4">
						<h2 className="font-heading text-sm font-semibold text-(--pf-accent) flex items-center gap-2">
							<Users className="h-4 w-4" />
							Focus Group Discussion
						</h2>
						<p className="text-xs text-(--pf-accent)/70 mt-0.5">
							A synthesised debate between all personas — agreements,
							disagreements, and shared concerns
						</p>
					</div>
					<div className="p-6 space-y-4">
						<p className="text-sm text-foreground leading-relaxed">
							{analysis.focusGroup.summary}
						</p>
						{Array.isArray(
							(analysis.focusGroup.conflicts as { items?: unknown[] })?.items,
						) && (
							<div className="space-y-3">
								{(
									analysis.focusGroup.conflicts as {
										items: { topic?: string; reason?: string }[];
									}
								).items.map((c, i) => (
									<div
										key={i}
										className="rounded-xl border border-(--pf-accent)/15 bg-background/60 p-4"
									>
										<p className="text-sm font-semibold text-foreground mb-1">
											{c.topic}
										</p>
										<p className="text-sm text-muted-foreground">{c.reason}</p>
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			)}

			{/* ── Crawled Pages ── */}
			{analysis.pages.length > 0 && (
				<div>
					<div className="mb-4">
						<h2 className="font-heading text-base font-semibold">
							Crawled Pages
						</h2>
						<p className="text-xs text-muted-foreground mt-0.5">
							Every page visited during this analysis — friction scores show how
							difficult each page is to use
						</p>
					</div>
					<div className="rounded-2xl border border-border bg-card overflow-hidden">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-border bg-muted/30">
									<th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
										Page
									</th>
									<th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
										Depth
									</th>
									<th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">
										Forms
									</th>
									<th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
										Friction
									</th>
								</tr>
							</thead>
							<tbody>
								{analysis.pages.map((page) => (
									<tr
										key={page.id}
										className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
									>
										<td className="px-5 py-3.5 font-medium max-w-xs">
											<p className="truncate text-foreground">
												{page.title ?? page.url}
											</p>
											<p className="truncate text-xs text-muted-foreground">
												{page.url}
											</p>
										</td>
										<td className="px-5 py-3.5 text-muted-foreground">
											{page.depth}
										</td>
										<td className="px-5 py-3.5 text-muted-foreground hidden sm:table-cell">
											{page.formsCount}
										</td>
										<td className="px-5 py-3.5 w-44">
											<FrictionBar
												score={page.frictionScore ?? null}
												showLabel={false}
											/>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</div>
	);
}
