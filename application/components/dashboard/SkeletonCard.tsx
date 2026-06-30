// components/dashboard/SkeletonCard.tsx
import { cn } from "@/lib/utils";

export function SkeletonCard({ className }: { className?: string }) {
	return (
		<div
			className={cn(
				"rounded-xl border border-border bg-card p-5 space-y-3",
				className,
			)}
		>
			<div className="skeleton h-4 w-2/5 rounded" />
			<div className="skeleton h-3 w-full rounded" />
			<div className="skeleton h-3 w-3/4 rounded" />
			<div className="flex gap-2 pt-1">
				<div className="skeleton h-5 w-16 rounded-full" />
				<div className="skeleton h-5 w-20 rounded-full" />
			</div>
		</div>
	);
}

export function SkeletonRow() {
	return (
		<div className="flex items-center gap-4 border-b border-border px-4 py-3">
			<div className="skeleton h-3 w-1/4 rounded" />
			<div className="skeleton h-3 w-1/3 rounded" />
			<div className="skeleton h-5 w-16 rounded-full ml-auto" />
		</div>
	);
}
