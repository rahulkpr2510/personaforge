import { cn } from "@/lib/utils";

type Status = "PENDING" | "CRAWLING" | "ANALYZING" | "COMPLETED" | "FAILED";

const config: Record<Status, { label: string; class: string }> = {
	PENDING: {
		label: "Pending",
		class:
			"bg-[var(--pf-amber-soft)] text-[var(--pf-amber)] border-[var(--pf-amber)]/20",
	},
	CRAWLING: {
		label: "Crawling",
		class:
			"bg-[var(--pf-accent-soft)] text-[var(--pf-accent)] border-[var(--pf-accent)]/20",
	},
	ANALYZING: {
		label: "Analyzing",
		class:
			"bg-[var(--pf-accent-soft)] text-[var(--pf-accent)] border-[var(--pf-accent)]/20",
	},
	COMPLETED: {
		label: "Completed",
		class:
			"bg-[var(--pf-green-soft)] text-[var(--pf-green)] border-[var(--pf-green)]/20",
	},
	FAILED: {
		label: "Failed",
		class: "bg-destructive/10 text-destructive border-destructive/20",
	},
};

export function StatusBadge({ status }: { status: Status }) {
	const { label, class: cls } = config[status];
	const isPulse = status === "CRAWLING" || status === "ANALYZING";
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
				cls,
			)}
		>
			{isPulse && (
				<span className="relative flex h-1.5 w-1.5">
					<span
						className={cn(
							"absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
							cls.includes("accent") ? "bg-(--pf-accent)" : "bg-current",
						)}
					/>
					<span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
				</span>
			)}
			{label}
		</span>
	);
}
