// components/dashboard/StatCard.tsx
"use client";
import { motion } from "motion/react";
import { Icon, type IconName } from "@/components/dashboard/Icon";
import { cn } from "@/lib/utils";

interface StatCardProps {
	title: string;
	value: number | string;
	icon: IconName;
	trend?: { value: number; label: string };
	accent?: "default" | "green" | "amber" | "blue";
	className?: string;
}

const accentMap = {
	default: "text-[var(--pf-accent)] bg-[var(--pf-accent-soft)]",
	green: "text-[var(--pf-green)] bg-[var(--pf-green-soft)]",
	amber: "text-[var(--pf-amber)] bg-[var(--pf-amber-soft)]",
	blue: "text-[var(--pf-accent)] bg-[var(--pf-accent-soft)]",
};

export function StatCard({
	title,
	value,
	icon,
	trend,
	accent = "default",
	className,
}: StatCardProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
			className={cn(
				"group relative overflow-hidden rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md",
				className,
			)}
		>
			<div className="flex items-start justify-between">
				<div>
					<p className="text-xs font-medium text-muted-foreground">{title}</p>
					<p className="mt-1.5 font-heading text-2xl font-bold tracking-tight text-foreground tabular-nums">
						{value}
					</p>
					{trend && (
						<p className="mt-1 text-xs text-muted-foreground">
							<span
								className={
									trend.value >= 0 ? "text-(--pf-green)" : "text-destructive"
								}
							>
								{trend.value >= 0 ? "+" : ""}
								{trend.value}
							</span>{" "}
							{trend.label}
						</p>
					)}
				</div>
				<div
					className={cn(
						"flex h-9 w-9 items-center justify-center rounded-lg",
						accentMap[accent],
					)}
				>
					<Icon name={icon} className="h-4 w-4" strokeWidth={1.8} />
				</div>
			</div>
			{/* Subtle hover glow */}
			<div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-(--pf-accent)/30 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
		</motion.div>
	);
}
