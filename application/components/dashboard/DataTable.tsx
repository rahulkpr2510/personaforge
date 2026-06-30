// components/dashboard/DataTable.tsx
"use client";
import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Column<T> {
	key: keyof T | string;
	header: string;
	render?: (row: T) => React.ReactNode;
	sortable?: boolean;
	className?: string;
}

interface DataTableProps<T> {
	columns: Column<T>[];
	data: T[];
	keyExtractor: (row: T) => string;
	className?: string;
	emptyMessage?: string;
}

export function DataTable<T>({
	columns,
	data,
	keyExtractor,
	className,
	emptyMessage,
}: DataTableProps<T>) {
	const [sortKey, setSortKey] = useState<string | null>(null);
	const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

	const handleSort = (key: string) => {
		if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
		else {
			setSortKey(key);
			setSortDir("asc");
		}
	};

	const sorted = sortKey
		? [...data].sort((a, b) => {
				const av = (a as Record<string, unknown>)[sortKey] ?? "";
				const bv = (b as Record<string, unknown>)[sortKey] ?? "";
				const cmp = String(av).localeCompare(String(bv));
				return sortDir === "asc" ? cmp : -cmp;
			})
		: data;

	return (
		<div
			className={cn(
				"overflow-x-auto rounded-xl border border-border bg-card",
				className,
			)}
		>
			<table className="w-full text-sm">
				<thead>
					<tr className="border-b border-border">
						{columns.map((col) => (
							<th
								key={String(col.key)}
								onClick={() => col.sortable && handleSort(String(col.key))}
								className={cn(
									"px-4 py-3 text-left text-xs font-medium text-muted-foreground",
									col.sortable &&
										"cursor-pointer select-none hover:text-foreground transition-colors",
									col.className,
								)}
							>
								<span className="flex items-center gap-1">
									{col.header}
									{col.sortable &&
										sortKey === String(col.key) &&
										(sortDir === "asc" ? (
											<ChevronUp className="h-3 w-3" />
										) : (
											<ChevronDown className="h-3 w-3" />
										))}
								</span>
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{sorted.length === 0 ? (
						<tr>
							<td
								colSpan={columns.length}
								className="py-12 text-center text-sm text-muted-foreground"
							>
								{emptyMessage ?? "No data found."}
							</td>
						</tr>
					) : (
						sorted.map((row, i) => (
							<tr
								key={keyExtractor(row)}
								className={cn(
									"border-b border-border/50 last:border-0 transition-colors hover:bg-muted/40",
									i % 2 === 0 ? "bg-card" : "bg-muted/20",
								)}
							>
								{columns.map((col) => (
									<td
										key={String(col.key)}
										className={cn("px-4 py-3 text-foreground", col.className)}
									>
										{col.render
											? col.render(row)
											: String(
													(row as Record<string, unknown>)[String(col.key)] ??
														"—",
												)}
									</td>
								))}
							</tr>
						))
					)}
				</tbody>
			</table>
		</div>
	);
}
