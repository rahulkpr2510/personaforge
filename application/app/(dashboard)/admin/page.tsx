import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { StatCard } from "@/components/dashboard/StatCard";
import Link from "next/link";
import {
	Users,
	FlaskConical,
	CheckCircle2,
	XCircle,
	Clock,
	Loader,
	ChevronRight,
	Activity,
	TrendingUp,
	AlertTriangle,
} from "lucide-react";

async function getAdminStats() {
	const [
		totalUsers,
		totalAnalyses,
		completedCount,
		failedCount,
		activeCount,
		statusGroups,
		recentErrors,
		recentAnalyses,
	] = await Promise.all([
		db.user.count(),
		db.analysis.count(),
		db.analysis.count({ where: { status: "COMPLETED" } }),
		db.analysis.count({ where: { status: "FAILED" } }),
		db.analysis.count({ where: { status: { in: ["CRAWLING", "ANALYZING"] } } }),
		db.analysis.groupBy({ by: ["status"], _count: { status: true } }),
		db.analysis.findMany({
			where: { status: "FAILED" },
			orderBy: { updatedAt: "desc" },
			take: 5,
			select: {
				id: true,
				url: true,
				error: true,
				updatedAt: true,
				user: { select: { email: true } },
			},
		}),
		db.analysis.findMany({
			orderBy: { createdAt: "desc" },
			take: 6,
			select: {
				id: true,
				url: true,
				status: true,
				createdAt: true,
				user: { select: { name: true, email: true } },
			},
		}),
	]);

	const statusBreakdown = Object.fromEntries(
		statusGroups.map((g) => [g.status, g._count.status]),
	);

	return {
		totalUsers,
		totalAnalyses,
		completedCount,
		failedCount,
		activeCount,
		statusBreakdown,
		recentErrors,
		recentAnalyses,
	};
}

const STATUS_META = {
	COMPLETED: {
		label: "Completed",
		icon: CheckCircle2,
		color: "text-[var(--pf-green)]",
		bg: "bg-[var(--pf-green-soft)]",
		border: "border-[var(--pf-green)]/20",
	},
	FAILED: {
		label: "Failed",
		icon: XCircle,
		color: "text-destructive",
		bg: "bg-destructive/6",
		border: "border-destructive/20",
	},
	PENDING: {
		label: "Pending",
		icon: Clock,
		color: "text-muted-foreground",
		bg: "bg-muted/60",
		border: "border-border",
	},
	CRAWLING: {
		label: "Crawling",
		icon: Activity,
		color: "text-[var(--pf-accent)]",
		bg: "bg-[var(--pf-accent-soft)]",
		border: "border-[var(--pf-accent)]/20",
	},
	ANALYZING: {
		label: "Analyzing",
		icon: Loader,
		color: "text-[var(--pf-amber)]",
		bg: "bg-[var(--pf-amber-soft)]",
		border: "border-[var(--pf-amber)]/20",
	},
} as const;

function formatDate(d: Date | string) {
	return new Date(d).toLocaleDateString("en-IN", {
		day: "numeric",
		month: "short",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export default async function AdminOverviewPage() {
	const user = await requireAuth();
	if (user.role !== "ADMIN") redirect("/dashboard");

	const {
		totalUsers,
		totalAnalyses,
		completedCount,
		failedCount,
		activeCount,
		statusBreakdown,
		recentErrors,
		recentAnalyses,
	} = await getAdminStats();

	const successRate =
		totalAnalyses > 0 ? Math.round((completedCount / totalAnalyses) * 100) : 0;

	return (
		<div className="space-y-8">
			{/* Header */}
			<div>
				<p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
					Admin Panel
				</p>
				<h1 className="mt-1 font-heading text-2xl font-bold text-foreground">
					Platform Overview
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Real-time health and usage across all PersonaForge accounts
				</p>
			</div>

			{/* KPI grid */}
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				<StatCard
					title="Total Users"
					value={totalUsers}
					icon="Users"
					accent="default"
				/>
				<StatCard
					title="Total Analyses"
					value={totalAnalyses}
					icon="FlaskConical"
					accent="blue"
				/>
				<StatCard
					title="Completed"
					value={completedCount}
					icon="CheckCircle"
					accent="green"
				/>
				<StatCard
					title="Failed"
					value={failedCount}
					icon="AlertTriangle"
					accent="amber"
				/>
			</div>

			{/* Second row: activity strip + quick links */}
			<div className="grid gap-4 lg:grid-cols-3">
				{/* Active right now */}
				<div className="rounded-2xl border border-(--pf-accent)/25 bg-(--pf-accent-soft) p-5">
					<div className="flex items-center gap-2 mb-3">
						<span className="relative flex h-2 w-2">
							<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-(--pf-accent) opacity-75" />
							<span className="relative inline-flex rounded-full h-2 w-2 bg-(--pf-accent)" />
						</span>
						<p className="text-xs font-semibold uppercase tracking-widest text-(--pf-accent)">
							Live
						</p>
					</div>
					<p className="font-heading text-4xl font-bold text-(--pf-accent)">
						{activeCount}
					</p>
					<p className="mt-1 text-sm text-(--pf-accent)/80">
						{activeCount === 1 ? "analysis" : "analyses"} running right now
					</p>
				</div>

				{/* Success rate */}
				<div className="rounded-2xl border border-border bg-card p-5">
					<div className="flex items-center gap-2 mb-3">
						<TrendingUp className="h-4 w-4 text-(--pf-green)" />
						<p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
							Success Rate
						</p>
					</div>
					<p className="font-heading text-4xl font-bold text-foreground">
						{successRate}%
					</p>
					<div className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden">
						<div
							className="h-full rounded-full bg-(--pf-green) transition-all duration-700"
							style={{ width: `${successRate}%` }}
						/>
					</div>
					<p className="mt-1.5 text-xs text-muted-foreground">
						{completedCount} of {totalAnalyses} completed successfully
					</p>
				</div>

				{/* Quick links */}
				<div className="rounded-2xl border border-border bg-card p-5 space-y-2">
					<p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
						Quick Access
					</p>
					{[
						{
							href: "/admin/users",
							icon: Users,
							label: "Manage Users",
							sub: `${totalUsers} total`,
						},
						{
							href: "/admin/analyses",
							icon: FlaskConical,
							label: "All Analyses",
							sub: `${totalAnalyses} total`,
						},
					].map((item) => (
						<Link
							key={item.href}
							href={item.href}
							className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-3 py-2.5 hover:bg-muted/50 hover:border-(--pf-accent)/30 transition-all group"
						>
							<div className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--pf-accent-soft)">
								<item.icon className="h-4 w-4 text-(--pf-accent)" />
							</div>
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium text-foreground">
									{item.label}
								</p>
								<p className="text-xs text-muted-foreground">{item.sub}</p>
							</div>
							<ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-(--pf-accent) transition-colors" />
						</Link>
					))}
				</div>
			</div>

			{/* Status breakdown visual bar */}
			<div className="rounded-2xl border border-border bg-card p-6">
				<h2 className="font-heading text-sm font-semibold mb-4 flex items-center gap-2">
					<Activity className="h-4 w-4 text-muted-foreground" />
					Analysis Status Breakdown
				</h2>
				{/* Proportional bar */}
				{totalAnalyses > 0 && (
					<div className="mb-5 flex h-3 w-full overflow-hidden rounded-full">
						{(
							[
								"COMPLETED",
								"CRAWLING",
								"ANALYZING",
								"PENDING",
								"FAILED",
							] as const
						).map((s) => {
							const count = statusBreakdown[s] ?? 0;
							const pct = (count / totalAnalyses) * 100;
							if (pct === 0) return null;
							const colors: Record<string, string> = {
								COMPLETED: "bg-[var(--pf-green)]",
								CRAWLING: "bg-[var(--pf-accent)]",
								ANALYZING: "bg-[var(--pf-amber)]",
								PENDING: "bg-muted-foreground/30",
								FAILED: "bg-destructive",
							};
							return (
								<div
									key={s}
									className={`h-full transition-all duration-700 ${colors[s]}`}
									style={{ width: `${pct}%` }}
									title={`${s}: ${count}`}
								/>
							);
						})}
					</div>
				)}
				{/* Legend */}
				<div className="flex flex-wrap gap-3">
					{(
						["COMPLETED", "CRAWLING", "ANALYZING", "PENDING", "FAILED"] as const
					).map((s) => {
						const meta = STATUS_META[s];
						const count = statusBreakdown[s] ?? 0;
						const Icon = meta.icon;
						return (
							<div
								key={s}
								className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 ${meta.bg} ${meta.border}`}
							>
								<Icon className={`h-3.5 w-3.5 ${meta.color}`} />
								<span className={`text-xs font-medium ${meta.color}`}>
									{meta.label}
								</span>
								<span
									className={`font-heading font-bold tabular-nums text-sm ${meta.color}`}
								>
									{count}
								</span>
							</div>
						);
					})}
				</div>
			</div>

			{/* Recent activity feed */}
			<div className="grid gap-4 lg:grid-cols-2">
				{/* Recent analyses */}
				<div className="rounded-2xl border border-border bg-card overflow-hidden">
					<div className="flex items-center justify-between border-b border-border px-5 py-4">
						<h2 className="font-heading text-sm font-semibold">
							Recent Analyses
						</h2>
						<Link
							href="/admin/analyses"
							className="text-xs text-(--pf-accent) hover:opacity-80 transition-opacity"
						>
							View all →
						</Link>
					</div>
					<div className="divide-y divide-border/60">
						{recentAnalyses.map((a) => {
							const hostname = (() => {
								try {
									return new URL(a.url).hostname;
								} catch {
									return a.url;
								}
							})();
							const meta = STATUS_META[a.status as keyof typeof STATUS_META];
							const Icon = meta?.icon ?? Clock;
							return (
								<Link
									key={a.id}
									href={`/admin/analyses/${a.id}`}
									className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors"
								>
									<div
										className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${meta?.bg ?? "bg-muted"} ${meta?.border ?? "border-border"}`}
									>
										<Icon
											className={`h-3.5 w-3.5 ${meta?.color ?? "text-muted-foreground"}`}
										/>
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium text-foreground truncate">
											{hostname}
										</p>
										<p className="text-xs text-muted-foreground truncate">
											{a.user?.name ?? a.user?.email ?? "Unknown user"} ·{" "}
											{formatDate(a.createdAt)}
										</p>
									</div>
									<ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
								</Link>
							);
						})}
					</div>
				</div>

				{/* Recent failures */}
				{recentErrors.length > 0 ? (
					<div className="rounded-2xl border border-destructive/20 bg-card overflow-hidden">
						<div className="flex items-center gap-2 border-b border-destructive/15 bg-destructive/4 px-5 py-4">
							<AlertTriangle className="h-4 w-4 text-destructive" />
							<h2 className="font-heading text-sm font-semibold text-destructive">
								Recent Failures
							</h2>
							<span className="ml-auto rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
								{recentErrors.length}
							</span>
						</div>
						<div className="divide-y divide-border/60">
							{recentErrors.map((err) => {
								const hostname = (() => {
									try {
										return new URL(err.url).hostname;
									} catch {
										return err.url;
									}
								})();
								return (
									<Link
										key={err.id}
										href={`/admin/analyses/${err.id}`}
										className="flex items-start gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors"
									>
										<XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
										<div className="flex-1 min-w-0">
											<p className="text-sm font-medium text-foreground truncate">
												{hostname}
											</p>
											<p className="text-xs text-destructive/80 line-clamp-1 mt-0.5">
												{err.error}
											</p>
											<p className="text-xs text-muted-foreground mt-0.5">
												{err.user?.email} · {formatDate(err.updatedAt)}
											</p>
										</div>
										<ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
									</Link>
								);
							})}
						</div>
					</div>
				) : (
					<div className="rounded-2xl border border-(--pf-green)/20 bg-(--pf-green-soft) p-6 flex flex-col items-center justify-center text-center gap-2">
						<CheckCircle2 className="h-10 w-10 text-(--pf-green)" />
						<p className="font-heading text-sm font-semibold text-(--pf-green)">
							All Clear
						</p>
						<p className="text-xs text-(--pf-green)/70">
							No recent analysis failures
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
