import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { SentimentBadge } from "@/components/dashboard/SentimentBadge";
import { FrictionBar } from "@/components/dashboard/FrictionBar";
import { PdfPreviewModal } from "@/components/dashboard/PdfPreviewModal";
import { PersonaAccordion } from "@/components/dashboard/PersonaAccordion";
import type { StructuredPositive, StructuredPainPoint, StructuredRecommendation } from "@/components/dashboard/PersonaAccordion";
import { AnalysisLiveView } from "@/components/dashboard/AnalysisLiveView";
import { ExecutiveScorecard } from "@/components/dashboard/ExecutiveScorecard";
import { FocusGroupDiscussion } from "@/components/dashboard/FocusGroupDiscussion";
import { AnalysisReliabilityCard } from "@/components/dashboard/AnalysisReliabilityCard";
import { CoverageMeter } from "@/components/dashboard/CoverageMeter";
import { CrawlerStatsPanel } from "@/components/dashboard/CrawlerStatsPanel";
import { AnalysisTimeline } from "@/components/dashboard/AnalysisTimeline";
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
	BarChart3,
	AlertCircle,
	Search,
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

	// Parse executive scorecard from meta
	const executiveScorecard = analysis.executiveScorecard as {
		topStrengths?: Array<{
			title: string;
			evidence: string;
			supportedByPersonas: string[];
		}>;
		topRisks?: Array<{
			title: string;
			evidence: string;
			severity: "Low" | "Medium" | "High" | "Critical";
			businessImpact: string;
		}>;
		businessRisk?: string;
		adoptionComparison?: Array<{
			label: string;
			name: string;
			score: number;
			reasoning?: string;
		}>;
		confidenceDistribution?: { high: number; medium: number; low: number };
		opportunityMatrix?: Array<{
			title: string;
			effort: "Low" | "Medium" | "High";
			impact: "Low" | "Medium" | "High";
			category: "Quick Win" | "Strategic" | "Fill-in" | "Avoid";
		}>;
		mostImpactfulRecommendation?: string;
		mostAffectedPersona?: { label: string; name: string; frictionScore: number; adoptionLikelihood: number };
		technicalDebtIndicator?: "Low" | "Medium" | "High";
		conversionRisk?: number;
		accessibilityRisk?: "Low" | "Medium" | "High";
	} | null;

	// Crawl coverage + reliability + stats — read from DB columns (migration applied)
	// Falls back to meta blob for older analysis records created before migration
	const metaBlob = (analysis.meta ?? {}) as Record<string, unknown>;

	const crawlCoverage = (analysis.crawlCoverage ?? metaBlob.crawlCoverage) as {
		pagesCrawled: number;
		pagesDiscovered: number;
		pagesBlocked: number;
		pagesSkipped: number;
		avgDepth: number;
		coverageConfidence: "Low" | "Medium" | "High";
		coveragePercent: number;
		coverageNote: string;
	} | null;

	const analysisReliability = (analysis.analysisReliability ?? metaBlob.analysisReliability) as {
		score: number;
		evidenceBacked: number;
		measured: number;
		inferred: number;
		speculative: number;
		totalFindings: number;
		reliabilityNote?: string;
	} | null;

	const crawlerStats = (analysis.crawlerStats ?? metaBlob.crawlerStats) as {
		totalPages: number;
		totalForms: number;
		totalButtons: number;
		totalImages: number;
		totalLinks: number;
		totalInputs: number;
		totalHeadings: number;
		totalWords: number;
		avgWordCount: number;
		avgDomDepth: number;
		largestPageUrl?: string | null;
		largestPageWords?: number;
		fastestPageUrl?: string | null;
		fastestPageMs?: number | null;
		slowestPageUrl?: string | null;
		slowestPageMs?: number | null;
		skippedUrls?: string[];
		blockedUrls?: string[];
		redirectCount?: number;
		brokenLinkCount?: number;
		avgTtfbMs?: number | null;
		avgLoadMs?: number | null;
	} | null;

	const researchGaps = (analysis.researchGaps ?? metaBlob.researchGaps) as string[] | null;

	// Focus group discussion fields
	const focusGroup = analysis.focusGroup;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const focusGroupExt = focusGroup as typeof focusGroup & Record<string, any>;
	const fgDiscussion = focusGroupExt?.discussion as
		| Array<{ speaker: string; statement: string; referencesPersona: string | null; turnType?: "opening" | "challenge" | "agreement" | "partial_agreement" | "moderator" | "conclusion" }>
		| undefined;
	const fgConsensus = focusGroupExt?.consensus as string[] | undefined;
	const fgOpenQuestions = focusGroupExt?.openQuestions as string[] | undefined;
	const fgResearchGaps = (focusGroupExt?.researchGaps as string[] | undefined) ?? (researchGaps ?? undefined);
	const fgConflicts = focusGroupExt?.conflicts as {
		items: Array<{
			topic?: string;
			reason?: string;
			personasAgree?: string[];
			personasDisagree?: string[];
		}>
	} | undefined;

	// ── Live analysis view for in-progress statuses ─────────────────────────
	if (
		analysis.status === "PENDING" ||
		analysis.status === "CRAWLING" ||
		analysis.status === "ANALYZING"
	) {
		return (
			<div className="space-y-6">
				<Link
					href="/dashboard/analyses"
					className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
				>
					<ArrowLeft className="h-4 w-4" /> All Analyses
				</Link>

				<div className="rounded-2xl border border-border bg-card overflow-hidden">
					<div className="h-1.5 w-full bg-(--pf-accent)" />
					<div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex items-start gap-4">
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
						</div>
					</div>
				</div>

				<AnalysisLiveView
					analysisId={id}
					initialStatus={analysis.status}
					initialPageCount={analysis.pages.length}
					initialPersonaCount={analysis.personas.length}
				/>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			{/* Back link */}
			<Link
				href="/dashboard/analyses"
				className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
			>
				<ArrowLeft className="h-4 w-4" /> All Analyses
			</Link>

			{/* ── Hero ── */}
			<div className="rounded-2xl border border-border bg-card overflow-hidden">
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
					{ icon: FileText, label: "Pages crawled", value: analysis.pages.length },
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
						<div className="p-6">
							<p className="text-xs text-muted-foreground mb-3">
								Friction score — 0 = frictionless, 100 = very frustrating
							</p>
							{analysis.overallFrictionScore != null ? (
								<FrictionBar score={analysis.overallFrictionScore} showLabel />
							) : (
								<p className="text-sm text-muted-foreground">
									No friction data available
								</p>
							)}
							{analysis.overallUxScore != null && (
								<div className="mt-4 flex items-center gap-2">
									<BarChart3 className="h-4 w-4 text-(--pf-accent)" />
									<p className="text-sm text-muted-foreground">
										UX Score:{" "}
										<span className="font-bold text-foreground">
											{analysis.overallUxScore}/100
										</span>
										{analysis.uxMaturityLevel && (
											<span className="ml-2 text-xs text-muted-foreground">
												· {analysis.uxMaturityLevel}
											</span>
										)}
									</p>
								</div>
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

			{/* ── Analysis Timeline ── */}
			<AnalysisTimeline
				status={analysis.status}
				createdAt={analysis.createdAt}
				completedAt={(analysis as typeof analysis & { completedAt?: Date | null }).completedAt}
				pageCount={analysis.pages.length}
				personaCount={analysis.personas.length}
			/>

			{/* ── Executive Scorecard ── */}
			{analysis.status === "COMPLETED" && executiveScorecard && (
				<div>
					<div className="mb-4">
						<h2 className="font-heading text-base font-semibold">
							Executive Scorecard
						</h2>
						<p className="text-xs text-muted-foreground mt-0.5">
							Evidence-grounded strengths, risks, and adoption comparison across
							all personas
						</p>
					</div>
					<ExecutiveScorecard
						overallUxScore={analysis.overallUxScore}
						topStrengths={executiveScorecard.topStrengths}
						topRisks={executiveScorecard.topRisks}
						adoptionComparison={executiveScorecard.adoptionComparison}
						confidenceDistribution={executiveScorecard.confidenceDistribution}
						mostImpactfulRecommendation={executiveScorecard.mostImpactfulRecommendation}
						mostAffectedPersona={executiveScorecard.mostAffectedPersona}
						conversionRisk={executiveScorecard.conversionRisk}
						accessibilityRisk={executiveScorecard.accessibilityRisk}
					/>
				</div>
			)}

			{/* ── Analysis Reliability + Coverage ── */}
			{analysis.status === "COMPLETED" && (analysisReliability || crawlCoverage) && (
				<div>
					<div className="mb-4">
						<h2 className="font-heading text-base font-semibold">Analysis Reliability</h2>
						<p className="text-xs text-muted-foreground mt-0.5">
							Evidence coverage, crawl scope, and confidence levels across all findings
						</p>
					</div>
					<div className="grid gap-4 lg:grid-cols-2">
						{analysisReliability && (
							<AnalysisReliabilityCard reliability={analysisReliability} />
						)}
						{crawlCoverage && (
							<CoverageMeter coverage={crawlCoverage} />
						)}
					</div>
				</div>
			)}

			{/* ── Persona Evaluations ── */}
			{analysis.personas.length > 0 && (
				<div>
					<div className="mb-4 flex items-center justify-between">
						<div>
							<h2 className="font-heading text-base font-semibold">
								Persona Evaluations
							</h2>
							<p className="text-xs text-muted-foreground mt-0.5">
								Each persona independently browsed and evaluated your product —
								expand for their evidence-grounded report
							</p>
						</div>
						<span className="text-xs text-muted-foreground shrink-0">
							{analysis.personas.length} report
							{analysis.personas.length > 1 ? "s" : ""}
						</span>
					</div>
					<PersonaAccordion
					personas={analysis.personas.map((p) => ({
						id: p.id,
						label: p.label,
						name: p.name,
						age: p.age,
						occupation: p.occupation,
						sentiment: p.sentiment as "POSITIVE" | "NEUTRAL" | "NEGATIVE" | null,
						frictionScore: p.frictionScore,
						adoptionLikelihood: p.adoptionLikelihood,
						adoptionReasoning: p.adoptionReasoning,
						overallUxScore: p.overallUxScore,
						uxCategoryScores: p.uxCategoryScores as Record<string, { score: number; reason: string }> | null,
						firstImpressions: p.firstImpressions,
						personaVoice: p.personaVoice,
						positives: p.positives,
						painPoints: p.painPoints,
						recommendations: p.recommendations,
						structuredPositives: p.structuredPositives as StructuredPositive[] | null,
						structuredPainPoints: p.structuredPainPoints as StructuredPainPoint[] | null,
						structuredRecommendations: p.structuredRecommendations as StructuredRecommendation[] | null,
						accessibilityNotes: p.accessibilityNotes,
						accessibilityFindings: p.accessibilityFindings as Array<{ finding: string; evidence: string; severity: string }> | null,
					}))}
				/>
				</div>
			)}

			{/* ── Focus Group Discussion ── */}
			{focusGroup && (
				<div>
					<div className="mb-4">
						<h2 className="font-heading text-base font-semibold">
							Focus Group Discussion
						</h2>
						<p className="text-xs text-muted-foreground mt-0.5">
							Moderated debate — personas reference each other&apos;s
							observations, surface disagreements, and reach consensus
						</p>
					</div>
					<FocusGroupDiscussion
						summary={focusGroup.summary}
						moderatorSummary={focusGroup.moderatorSummary}
						discussion={fgDiscussion}
						consensus={fgConsensus}
						openQuestions={fgOpenQuestions}
						researchGaps={fgResearchGaps}
						conflicts={fgConflicts}
					/>
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
							Every page visited during this analysis — all scores are based on
							directly observed data from these pages
						</p>
					</div>
					{/* Crawler Stats Panel */}
					{crawlerStats && (
						<div className="mb-4">
							<CrawlerStatsPanel stats={crawlerStats} />
						</div>
					)}
					<div className="rounded-2xl border border-border bg-card overflow-hidden">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-border bg-muted/30">
									<th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
										Page
									</th>
									<th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">
										Type
									</th>
									<th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">
										Buttons
									</th>
									<th className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">
										Words
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
										<td className="px-5 py-3.5 text-muted-foreground hidden lg:table-cell">
											<span className="text-xs rounded-full bg-muted/60 border border-border px-2 py-0.5 font-mono">
												{page.pageType ?? "UNKNOWN"}
											</span>
										</td>
										<td className="px-5 py-3.5 text-muted-foreground hidden sm:table-cell tabular-nums">
											{page.buttonsCount}
										</td>
										<td className="px-5 py-3.5 text-muted-foreground hidden sm:table-cell tabular-nums">
											{page.wordCount ?? page.textLength}
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
