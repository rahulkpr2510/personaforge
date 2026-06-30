// app/(dashboard)/admin/analyses/page.tsx
"use client";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { SkeletonRow } from "@/components/dashboard/SkeletonCard";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface AdminAnalysis {
	id: string;
	url: string;
	status: "PENDING" | "CRAWLING" | "ANALYZING" | "COMPLETED" | "FAILED";
	deviceType: "DESKTOP" | "MOBILE";
	createdAt: string;
	user: { email: string; name: string | null };
	_count: { pages: number; personas: number };
}

const STATUS_FILTERS = [
	"",
	"PENDING",
	"CRAWLING",
	"ANALYZING",
	"COMPLETED",
	"FAILED",
] as const;

export default function AdminAnalysesPage() {
	const [analyses, setAnalyses] = useState<AdminAnalysis[]>([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [pages, setPages] = useState(1);
	const [status, setStatus] = useState<string>("");
	const [loading, setLoading] = useState(true);

	const fetchData = async () => {
		setLoading(true);
		const params = new URLSearchParams({ page: String(page) });
		if (status) params.set("status", status);
		const res = await fetch(`/api/admin/analyses?${params}`);
		const data = await res.json();
		setAnalyses(data.analyses ?? []);
		setTotal(data.total ?? 0);
		setPages(data.pages ?? 1);
		setLoading(false);
	};

	useEffect(() => {
		fetchData();
	}, [page, status]);

	return (
		<div className="space-y-6">
			<PageHeader
				title="All Analyses"
				description={`${total} total across all users`}
			/>

			{/* Status filter pills */}
			<div className="flex flex-wrap gap-2">
				{STATUS_FILTERS.map((s) => (
					<button
						key={s || "all"}
						onClick={() => {
							setStatus(s);
							setPage(1);
						}}
						className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
							status === s
								? "border-(--pf-accent) bg-(--pf-accent-soft) text-(--pf-accent)"
								: "border-border text-muted-foreground hover:border-(--pf-accent)/50"
						}`}
					>
						{s || "All"}
					</button>
				))}
			</div>

			{/* Table */}
			{loading ? (
				<div className="rounded-xl border border-border bg-card overflow-hidden">
					{[...Array(8)].map((_, i) => (
						<SkeletonRow key={i} />
					))}
				</div>
			) : (
				<div className="rounded-xl border border-border bg-card overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-border">
								<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
									URL / User
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
									Status
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
									Pages
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
									Personas
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
									Device
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
									Date
								</th>
								<th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground"></th>
							</tr>
						</thead>
						<tbody>
							{analyses.length === 0 ? (
								<tr>
									<td
										colSpan={7}
										className="py-14 text-center text-sm text-muted-foreground"
									>
										No analyses match the current filter.
									</td>
								</tr>
							) : (
								analyses.map((a, i) => {
									const hostname = (() => {
										try {
											return new URL(a.url).hostname;
										} catch {
											return a.url;
										}
									})();
									return (
										<tr
											key={a.id}
											className={`border-b border-border/50 last:border-0 transition-colors hover:bg-muted/30 ${
												i % 2 !== 0 ? "bg-muted/10" : ""
											}`}
										>
											<td className="px-4 py-3 max-w-[220px]">
												<p className="truncate font-medium text-foreground text-sm">
													{hostname}
												</p>
												<p className="truncate text-xs text-muted-foreground mt-0.5">
													{a.user.name ?? a.user.email}
												</p>
											</td>
											<td className="px-4 py-3">
												<StatusBadge status={a.status} />
											</td>
											<td className="px-4 py-3 text-muted-foreground tabular-nums">
												{a._count.pages}
											</td>
											<td className="px-4 py-3 text-muted-foreground tabular-nums">
												{a._count.personas}
											</td>
											<td className="px-4 py-3">
												<span
													className={`rounded-md px-2 py-0.5 text-xs font-medium ${
														a.deviceType === "MOBILE"
															? "bg-(--pf-amber-soft) text-(--pf-amber)"
															: "bg-muted text-muted-foreground"
													}`}
												>
													{a.deviceType === "MOBILE"
														? "📱 Mobile"
														: "🖥️ Desktop"}
												</span>
											</td>
											<td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
												{new Date(a.createdAt).toLocaleDateString("en-IN", {
													day: "numeric",
													month: "short",
													year: "numeric",
												})}
											</td>
											<td className="px-4 py-3">
												<a
													href={`/dashboard/analyses/${a.id}`}
													className="text-xs text-(--pf-accent) hover:opacity-70 transition-opacity whitespace-nowrap"
												>
													View →
												</a>
											</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>
			)}

			{/* Pagination */}
			{pages > 1 && (
				<div className="flex items-center justify-between">
					<p className="text-xs text-muted-foreground">
						Page <span className="font-medium text-foreground">{page}</span> of{" "}
						<span className="font-medium text-foreground">{pages}</span>
					</p>
					<div className="flex gap-2">
						<button
							onClick={() => setPage((p) => Math.max(1, p - 1))}
							disabled={page === 1}
							className="flex items-center gap-1 rounded-lg border border-input px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40 transition-colors"
						>
							<ChevronLeft className="h-3.5 w-3.5" /> Prev
						</button>
						{/* Page number pills */}
						<div className="hidden sm:flex gap-1">
							{Array.from({ length: Math.min(pages, 5) }, (_, i) => {
								const p = page <= 3 ? i + 1 : page - 2 + i;
								if (p < 1 || p > pages) return null;
								return (
									<button
										key={p}
										onClick={() => setPage(p)}
										className={`h-7 w-7 rounded-lg text-xs font-medium transition-colors ${
											page === p
												? "bg-(--pf-accent) text-white"
												: "border border-input text-muted-foreground hover:bg-accent"
										}`}
									>
										{p}
									</button>
								);
							})}
						</div>
						<button
							onClick={() => setPage((p) => Math.min(pages, p + 1))}
							disabled={page === pages}
							className="flex items-center gap-1 rounded-lg border border-input px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40 transition-colors"
						>
							Next <ChevronRight className="h-3.5 w-3.5" />
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
