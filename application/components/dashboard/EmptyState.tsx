// components/dashboard/EmptyState.tsx
"use client";
import { motion } from "motion/react";
import { Icon, type IconName } from "@/components/dashboard/Icon";

interface EmptyStateProps {
	icon: IconName;
	title: string;
	description: string;
	action?: React.ReactNode;
}

export function EmptyState({
	icon,
	title,
	description,
	action,
}: EmptyStateProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
			className="flex flex-col items-center justify-center gap-4 py-20 text-center"
		>
			<div className="relative">
				<div className="absolute inset-0 scale-150 rounded-full bg-(--pf-accent-soft) blur-xl opacity-60" />
				<div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
					<Icon name={icon} className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
				</div>
			</div>
			<div className="space-y-1">
				<h3 className="font-heading text-base font-semibold text-foreground">
					{title}
				</h3>
				<p className="max-w-xs text-sm text-muted-foreground">{description}</p>
			</div>
			{action && <div className="mt-2">{action}</div>}
		</motion.div>
	);
}
