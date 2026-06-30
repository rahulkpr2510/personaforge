// app/(dashboard)/dashboard/analyses/[id]/page.tsx
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { SentimentBadge } from "@/components/dashboard/SentimentBadge";
import { FrictionBar } from "@/components/dashboard/FrictionBar";
import { ArrowLeft, Globe, FileText, Monitor, Smartphone } from "lucide-react";

type PageParams = { params: Promise<{ id: string }> };

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

	return (
		<div className="space-y-8">
			{/* Back + header */}
			<div>
				<Link
					href="/dashboard/analyses"
					className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
				>
					<ArrowLeft className="h-4 w-4" /> All Analyses
				</Link>
				<PageHeader
					title={(() => {
						try {
							return new URL(analysis.url).hostname;
						} catch {
							return analysis.url;
						}
					})()}
					description={analysis.url}
					actions={<StatusBadge status={analysis.status} />}
				/>
			</div>

			{/* Summary strip */}
			<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
				{[
					{
						label: "Device",
						value:
							analysis.deviceType === "MOBILE" ? "📱 Mobile" : "🖥️ Desktop",
					},
					{ label: "Pages", value: `${analysis.pages.length} crawled` },
					{ label: "Personas", value: `${analysis.personas.length} evaluated` },
					{
						label: "Started",
						value: analysis.startedAt
							? new Date(analysis.startedAt).toLocaleDateString("en-IN")
							: "—",
					},
				].map((item) => (
					<div
						key={item.label}
						className="rounded-xl border border-border bg-card p-4"
					>
						<p className="text-xs text-muted-foreground">{item.label}</p>
						<p className="mt-1 text-sm font-semibold text-foreground">
							{item.value}
						</p>
					</div>
				))}
			</div>

			{/* Overall sentiment + friction */}
			{analysis.status === "COMPLETED" && (
				<div className="rounded-xl border border-border bg-card p-6 space-y-4">
					<h2 className="font-heading text-base font-semibold">
						Overall Results
					</h2>
					<div className="flex flex-wrap gap-4 items-center">
						<div>
							<p className="text-xs text-muted-foreground mb-1.5">Sentiment</p>
							<SentimentBadge sentiment={analysis.overallSentiment} />
						</div>
						{analysis.overallFrictionScore != null && (
							<div className="flex-1 min-w-48">
								<p className="text-xs text-muted-foreground mb-1.5">
									Friction Score
								</p>
								<FrictionBar score={analysis.overallFrictionScore} />
							</div>
						)}
					</div>
					{analysis.summary && (
						<p className="text-sm text-muted-foreground leading-relaxed">
							{analysis.summary}
						</p>
					)}
				</div>
			)}

			{/* Error state */}
			{analysis.status === "FAILED" && analysis.error && (
				<div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5">
					<h2 className="font-heading text-base font-semibold text-destructive mb-2">
						Analysis Failed
					</h2>
					<p className="text-sm text-destructive/80">{analysis.error}</p>
				</div>
			)}

			{/* Persona evaluations */}
			{analysis.personas.length > 0 && (
				<div>
					<h2 className="font-heading text-base font-semibold mb-4">
						Persona Evaluations
					</h2>
					<div className="space-y-4">
						{analysis.personas.map((persona) => (
							<div
								key={persona.id}
								className="rounded-xl border border-border bg-card p-5 space-y-4"
							>
								<div className="flex flex-wrap items-center gap-3">
									<div className="flex h-9 w-9 items-center justify-center rounded-full bg-(--pf-accent-soft) text-(--pf-accent) font-heading font-bold text-sm">
										{persona.label.charAt(0)}
									</div>
									<div>
										<p className="font-semibold text-foreground text-sm">
											{persona.label}
										</p>
										<p className="text-xs text-muted-foreground">
											{persona.name} · {persona.age}y · {persona.occupation}
										</p>
									</div>
									<div className="ml-auto flex items-center gap-2">
										<SentimentBadge sentiment={persona.sentiment} />
										{persona.adoptionLikelihood != null && (
											<span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
												{persona.adoptionLikelihood}% adoption
											</span>
										)}
									</div>
								</div>

								{persona.frictionScore != null && (
									<div>
										<p className="text-xs text-muted-foreground mb-1">
											Friction
										</p>
										<FrictionBar score={persona.frictionScore} />
									</div>
								)}

								{persona.firstImpressions && (
									<div>
										<p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">
											First Impression
										</p>
										<p className="text-sm text-foreground leading-relaxed">
											{persona.firstImpressions}
										</p>
									</div>
								)}

								<div className="grid gap-4 sm:grid-cols-2">
									{persona.positives && (
										<div>
											<p className="text-xs font-semibold uppercase tracking-widest text-(--pf-green) mb-1.5">
												Positives
											</p>
											<div className="rounded-lg bg-(--pf-green-soft) p-3 text-sm text-foreground leading-relaxed whitespace-pre-line">
												{persona.positives}
											</div>
										</div>
									)}
									{persona.painPoints && (
										<div>
											<p className="text-xs font-semibold uppercase tracking-widest text-destructive mb-1.5">
												Pain Points
											</p>
											<div className="rounded-lg bg-destructive/8 p-3 text-sm text-foreground leading-relaxed whitespace-pre-line">
												{persona.painPoints}
											</div>
										</div>
									)}
								</div>

								{persona.recommendations && (
									<div>
										<p className="text-xs font-semibold uppercase tracking-widest text-(--pf-accent) mb-1.5">
											Recommendations
										</p>
										<div className="rounded-lg bg-(--pf-accent-soft) p-3 text-sm text-foreground leading-relaxed whitespace-pre-line">
											{persona.recommendations}
										</div>
									</div>
								)}
							</div>
						))}
					</div>
				</div>
			)}

			{/* Focus group */}
			{analysis.focusGroup && (
				<div className="rounded-xl border border-(--pf-accent)/20 bg-(--pf-accent-soft) p-6 space-y-4">
					<h2 className="font-heading text-base font-semibold text-(--pf-accent)">
						Focus Group Insight
					</h2>
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
								<div key={i} className="rounded-lg bg-card/60 p-4 text-sm">
									<p className="font-semibold text-foreground mb-1">
										{c.topic}
									</p>
									<p className="text-muted-foreground">{c.reason}</p>
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{/* Crawled pages */}
			{analysis.pages.length > 0 && (
				<div>
					<h2 className="font-heading text-base font-semibold mb-4">
						Crawled Pages
					</h2>
					<div className="overflow-x-auto rounded-xl border border-border bg-card">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-border">
									<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
										URL
									</th>
									<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
										Depth
									</th>
									<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
										Forms
									</th>
									<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
										Friction
									</th>
								</tr>
							</thead>
							<tbody>
								{analysis.pages.map((page, i) => (
									<tr
										key={page.id}
										className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
									>
										<td className="px-4 py-3 font-medium max-w-xs truncate">
											{page.title ?? page.url}
										</td>
										<td className="px-4 py-3 text-muted-foreground">
											{page.depth}
										</td>
										<td className="px-4 py-3 text-muted-foreground">
											{page.formsCount}
										</td>
										<td className="px-4 py-3 w-36">
											<FrictionBar
												score={page.frictionScore ?? null}
												showLabel
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
