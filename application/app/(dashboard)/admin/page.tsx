// app/(dashboard)/admin/page.tsx
import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";


async function getAdminStats() {
	const res = await fetch(
		`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/stats`,
		{ cache: "no-store" },
	);
	if (!res.ok) return null;
	return res.json();
}

export default async function AdminOverviewPage() {
	const user = await requireAuth();
	if (user.role !== "ADMIN") redirect("/dashboard");

	const stats = await getAdminStats();

	const breakdown: Record<string, number> = stats?.statusBreakdown ?? {};
	const recentErrors: {
		id: string;
		url: string;
		error: string;
		updatedAt: string;
	}[] = stats?.recentErrors ?? [];

	return (
		<div className="space-y-8">
			<PageHeader
				title="Admin Overview"
				description="Platform-wide statistics and health"
			/>

			<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
				<StatCard
					title="Total Users"
					value={stats?.totalUsers ?? "—"}
					icon="Users"
					accent="default"
				/>
				<StatCard
					title="Total Analyses"
					value={stats?.totalAnalyses ?? "—"}
					icon="FlaskConical"
					accent="blue"
				/>
				<StatCard
					title="Completed"
					value={breakdown.COMPLETED ?? 0}
					icon="CheckCircle"
					accent="green"
				/>
				<StatCard
					title="Failed"
					value={breakdown.FAILED ?? 0}
					icon="AlertTriangle"
					accent="amber"
				/>
			</div>

			{/* Status breakdown */}
			<div className="rounded-xl border border-border bg-card p-6">
				<h2 className="font-heading text-sm font-semibold mb-4">
					Analysis Status Breakdown
				</h2>
				<div className="flex flex-wrap gap-3">
					{(
						["PENDING", "CRAWLING", "ANALYZING", "COMPLETED", "FAILED"] as const
					).map((s) => (
						<div
							key={s}
							className="flex items-center gap-2 rounded-xl bg-muted/50 px-4 py-3"
						>
							<StatusBadge status={s} />
							<span className="font-heading font-bold text-foreground tabular-nums">
								{breakdown[s] ?? 0}
							</span>
						</div>
					))}
				</div>
			</div>

			{/* Recent errors */}
			{recentErrors.length > 0 && (
				<div>
					<h2 className="font-heading text-sm font-semibold mb-4">
						Recent Failures
					</h2>
					<div className="rounded-xl border border-border bg-card overflow-hidden">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-border">
									<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
										URL
									</th>
									<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
										Error
									</th>
									<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
										When
									</th>
								</tr>
							</thead>
							<tbody>
								{recentErrors.map((err) => (
									<tr
										key={err.id}
										className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
									>
										<td className="px-4 py-3 font-medium max-w-xs truncate text-foreground">
											{err.url}
										</td>
										<td className="px-4 py-3 text-destructive text-xs max-w-sm truncate">
											{err.error}
										</td>
										<td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
											{new Date(err.updatedAt).toLocaleDateString("en-IN")}
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
