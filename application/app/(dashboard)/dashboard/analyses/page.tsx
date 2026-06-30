// app/(dashboard)/dashboard/analyses/page.tsx
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { AnalysisCard } from "@/components/dashboard/AnalysisCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { PlusCircle } from "lucide-react";

export default async function AnalysesPage() {
	const user = await requireAuth();

	const analyses = await db.analysis.findMany({
		where: { userId: user.id },
		orderBy: { createdAt: "desc" },
		include: { _count: { select: { pages: true, personas: true } } },
	});

	return (
		<div className="space-y-6">
			<PageHeader
				title="Analyses"
				description={`${analyses.length} total`}
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

			{analyses.length === 0 ? (
				<EmptyState
					icon="FlaskConical"
					title="No analyses yet"
					description="Start by analysing a product or landing page with your chosen personas."
					action={
						<Link
							href="/dashboard/new-analysis"
							className="inline-flex items-center gap-2 rounded-xl bg-(--pf-accent) px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
						>
							<PlusCircle className="h-4 w-4" /> New Analysis
						</Link>
					}
				/>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{analyses.map((a) => (
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
	);
}
