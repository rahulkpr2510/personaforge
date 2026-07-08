import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { StatCard } from "@/components/dashboard/StatCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { DashboardGreeting } from "@/components/dashboard/DashboardGreeting";
import { RecentAnalysesSection } from "@/components/dashboard/RecentAnalysesSection";
import {
	PlusCircle,
	ArrowRight,
	Clock,
	Users,
	Sparkles,
	ChevronRight,
	FlaskConical,
	Globe,
} from "lucide-react";

export default async function DashboardOverviewPage() {
	const [user, clerkUser] = await Promise.all([requireAuth(), currentUser()]);

	const firstName = clerkUser?.firstName ?? "there";

	const [analysesRaw, personaCount, allCount, completedTotal] =
		await Promise.all([
			db.analysis.findMany({
				where: { userId: user.id },
				orderBy: { createdAt: "desc" },
				include: {
					_count: { select: { pages: true, personas: true } },
					focusGroup: { select: { id: true } },
				},
			}),
			db.persona.count({ where: { ownerId: user.id, isPrebuilt: false } }),
			db.analysis.count({ where: { userId: user.id } }),
			db.analysis.count({ where: { userId: user.id, status: "COMPLETED" } }),
		]);

	const running = analysesRaw.filter(
		(a) => a.status === "CRAWLING" || a.status === "ANALYZING",
	).length;

	const successRate =
		allCount > 0 ? Math.round((completedTotal / allCount) * 100) : null;

	const isFirstTime = allCount === 0;

	// Pass all analyses to client component which handles date filtering
	const analyses = analysesRaw.map((a) => ({
		id: a.id,
		url: a.url,
		status: a.status,
		deviceType: a.deviceType,
		overallSentiment: a.overallSentiment,
		overallFrictionScore: a.overallFrictionScore,
		createdAt: a.createdAt.toISOString(),
		_count: a._count,
		error: a.error,
	}));

	return (
		<div className="space-y-6">
			{/* Greeting banner */}
			<DashboardGreeting
				firstName={firstName}
				running={running}
				href="/dashboard/new-analysis"
			/>

			{/* KPI stats */}
			<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
				<StatCard
					title="Total Analyses"
					value={allCount}
					icon="FlaskConical"
					accent="default"
				/>
				<StatCard
					title="Completed"
					value={completedTotal}
					icon="CheckCircle"
					accent="green"
				/>
				<StatCard
					title="Custom Personas"
					value={personaCount}
					icon="Users"
					accent="amber"
				/>
				<StatCard
					title="Running Now"
					value={running}
					icon="Zap"
					accent="blue"
				/>
			</div>

			{/* First-time onboarding or Quick Actions */}
			{isFirstTime ? (
				/* Getting started — shown only when zero analyses */
				<div className="rounded-2xl border border-(--pf-accent)/20 bg-(--pf-accent-soft) p-6">
					<div className="flex items-center gap-2 mb-4">
						<Sparkles className="h-5 w-5 text-(--pf-accent)" />
						<h2 className="font-heading text-base font-semibold text-(--pf-accent)">
							Get started with PersonaForge
						</h2>
					</div>
					<div className="grid gap-3 sm:grid-cols-3">
						{[
							{
								step: "1",
								icon: Globe,
								title: "Enter a URL",
								desc: "Any live product, landing page, or web app",
							},
							{
								step: "2",
								icon: Users,
								title: "Choose personas",
								desc: "Pick from our library or create custom user types",
							},
							{
								step: "3",
								icon: FlaskConical,
								title: "Get insights",
								desc: "AI simulates each persona and generates a UX report",
							},
						].map((s) => (
							<div
								key={s.step}
								className="flex items-start gap-3 rounded-xl border border-(--pf-accent)/20 bg-background/60 p-4"
							>
								<div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-(--pf-accent) text-white font-heading font-bold text-xs">
									{s.step}
								</div>
								<div>
									<p className="text-sm font-semibold text-foreground">
										{s.title}
									</p>
									<p className="text-xs text-muted-foreground mt-0.5">
										{s.desc}
									</p>
								</div>
							</div>
						))}
					</div>
					<Link
						href="/dashboard/new-analysis"
						className="mt-5 inline-flex items-center gap-2 rounded-xl bg-(--pf-accent) px-5 py-2.5 text-sm font-semibold text-white shadow-[0_2px_16px_var(--pf-accent,#6366f1)30] hover:opacity-90 hover:-translate-y-0.5 transition-all"
					>
						<PlusCircle className="h-4 w-4" /> Start your first analysis
					</Link>
				</div>
			) : (
				/* Quick actions — shown after first analysis */
				<div className="grid gap-3 sm:grid-cols-3">
					{[
						{
							href: "/dashboard/new-analysis",
							icon: PlusCircle,
							label: "New Analysis",
							sub: "Analyse any URL with AI personas",
							primary: true,
						},
						{
							href: "/dashboard/analyses",
							icon: Clock,
							label: "All Analyses",
							sub: `${allCount} total · ${successRate !== null ? `${successRate}% success` : ""}`,
							primary: false,
						},
						{
							href: "/dashboard/personas",
							icon: Users,
							label: "Personas",
							sub: `${personaCount} custom · library available`,
							primary: false,
						},
					].map((action) => (
						<Link
							key={action.href}
							href={action.href}
							className={`group flex items-center gap-3 rounded-xl border p-4 transition-all hover:-translate-y-0.5 ${
								action.primary
									? "border-(--pf-accent)/30 bg-(--pf-accent-soft) hover:shadow-[0_4px_16px_var(--pf-accent,#6366f1)20]"
									: "border-border bg-card hover:border-(--pf-accent)/30 hover:shadow-sm"
							}`}
						>
							<div
								className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
									action.primary
										? "bg-(--pf-accent) text-white"
										: "bg-muted text-muted-foreground"
								}`}
							>
								<action.icon className="h-5 w-5" />
							</div>
							<div className="flex-1 min-w-0">
								<p
									className={`text-sm font-semibold ${action.primary ? "text-(--pf-accent)" : "text-foreground"}`}
								>
									{action.label}
								</p>
								<p className="text-xs text-muted-foreground truncate">
									{action.sub}
								</p>
							</div>
							<ChevronRight
								className={`h-4 w-4 shrink-0 transition-colors group-hover:text-(--pf-accent) ${action.primary ? "text-(--pf-accent)" : "text-muted-foreground"}`}
							/>
						</Link>
					))}
				</div>
			)}

			{/* Recent analyses — client component with date tabs */}
			{analyses.length > 0 && (
				<RecentAnalysesSection
					analyses={analyses}
					allCount={allCount}
				/>
			)}

			{analyses.length === 0 && !isFirstTime && (
				<EmptyState
					icon="FlaskConical"
					title="No analyses yet"
					description="Run your first AI-powered UX analysis to see results here."
					action={
						<Link
							href="/dashboard/new-analysis"
							className="inline-flex items-center gap-2 rounded-xl bg-(--pf-accent) px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
						>
							<PlusCircle className="h-4 w-4" /> Start your first analysis
						</Link>
					}
				/>
			)}
		</div>
	);
}
