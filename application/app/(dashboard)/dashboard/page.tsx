// app/(dashboard)/dashboard/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { AnalysisCard } from "@/components/dashboard/AnalysisCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { PlusCircle } from "lucide-react";

export default async function DashboardOverviewPage() {
	const user = await requireAuth();

	const [analysesRaw, personaCount] = await Promise.all([
		db.analysis.findMany({
			where: { userId: user.id },
			orderBy: { createdAt: "desc" },
			take: 5,
			include: {
				_count: { select: { pages: true, personas: true } },
				focusGroup: { select: { id: true } },
			},
		}),
		db.persona.count({ where: { ownerId: user.id, isPrebuilt: false } }),
	]);

	const completed = analysesRaw.filter((a) => a.status === "COMPLETED").length;
	const total = analysesRaw.length;

	return (
		<div className="space-y-8">
			<PageHeader
				title="Overview"
				description="Your PersonaForge workspace"
				actions={
					<Link
						href="/dashboard/new-analysis"
						className="flex items-center gap-2 rounded-xl bg-(--pf-accent) px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
					>
						<PlusCircle className="h-4 w-4" />
						New Analysis
					</Link>
				}
			/>

			{/* KPI stats */}
			<div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
				<StatCard
					title="Total Analyses"
					value={total}
					icon="FlaskConical"
					accent="default"
				/>
				<StatCard
					title="Completed"
					value={completed}
					icon="CheckCircle"
					accent="green"
				/>
				<StatCard
					title="Custom Personas"
					value={personaCount}
					icon="Users"
					accent="amber"
					className="col-span-2 sm:col-span-1"
				/>
			</div>

			{/* Recent analyses */}
			<div>
				<div className="mb-4 flex items-center justify-between">
					<h2 className="font-heading text-sm font-semibold text-foreground">
						Recent Analyses
					</h2>
					{total > 0 && (
						<Link
							href="/dashboard/analyses"
							className="text-xs text-(--pf-accent) hover:opacity-80 transition-opacity"
						>
							View all →
						</Link>
					)}
				</div>
				{analysesRaw.length === 0 ? (
					<EmptyState
						icon="FlaskConical"
						title="No analyses yet"
						description="Run your first AI-powered UX analysis to see results here."
						action={
							<Link
								href="/dashboard/new-analysis"
								className="inline-flex items-center gap-2 rounded-xl bg-(--pf-accent) px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
							>
								<PlusCircle className="h-4 w-4" />
								Start your first analysis
							</Link>
						}
					/>
				) : (
					<div className="grid gap-4 sm:grid-cols-2">
						{analysesRaw.map((a) => (
							<AnalysisCard
								key={a.id}
								analysis={{
									id: a.id,
									url: a.url,
									status: a.status,
									deviceType: a.deviceType,
									overallSentiment: a.overallSentiment,
									overallFrictionScore: a.overallFrictionScore,
									createdAt: a.createdAt.toISOString(),
									_count: a._count,
									error: a.error,
								}}
								href={`/dashboard/analyses/${a.id}`}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
