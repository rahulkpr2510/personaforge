// components/dashboard/StatCard.tsx
"use client";
import { useEffect, useRef, useState } from "react";
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

const accentStyles = {
	default: {
		icon: "text-[var(--pf-accent)] bg-[var(--pf-accent-soft)]",
		glow: "var(--pf-accent)",
		bar: "from-[var(--pf-accent)]/0 via-[var(--pf-accent)]/40 to-[var(--pf-accent)]/0",
	},
	green: {
		icon: "text-[var(--pf-green)] bg-[var(--pf-green-soft)]",
		glow: "var(--pf-green)",
		bar: "from-[var(--pf-green)]/0 via-[var(--pf-green)]/40 to-[var(--pf-green)]/0",
	},
	amber: {
		icon: "text-[var(--pf-amber)] bg-[var(--pf-amber-soft)]",
		glow: "var(--pf-amber)",
		bar: "from-[var(--pf-amber)]/0 via-[var(--pf-amber)]/40 to-[var(--pf-amber)]/0",
	},
	blue: {
		icon: "text-[var(--pf-accent)] bg-[var(--pf-accent-soft)]",
		glow: "var(--pf-accent)",
		bar: "from-[var(--pf-accent)]/0 via-[var(--pf-accent)]/40 to-[var(--pf-accent)]/0",
	},
};

/** Smoothly counts up from 0 → target over ~700ms */
function useCountUp(target: number | string) {
	const [display, setDisplay] = useState<number | string>(
		typeof target === "number" ? 0 : target,
	);
	const raf = useRef<number>(0);

	useEffect(() => {
		if (typeof target !== "number") {
			setDisplay(target);
			return;
		}
		let start: number | null = null;
		const dur = 700;
		const tick = (ts: number) => {
			if (!start) start = ts;
			const p = Math.min((ts - start) / dur, 1);
			const eased = 1 - (1 - p) ** 3;
			setDisplay(Math.round(eased * target));
			if (p < 1) raf.current = requestAnimationFrame(tick);
		};
		raf.current = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf.current);
	}, [target]);

	return display;
}

export function StatCard({
	title,
	value,
	icon,
	trend,
	accent = "default",
	className,
}: StatCardProps) {
	const [hovered, setHovered] = useState(false);
	const displayVal = useCountUp(value);
	const styles = accentStyles[accent];

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
			onHoverStart={() => setHovered(true)}
			onHoverEnd={() => setHovered(false)}
			className={cn(
				"group relative overflow-hidden rounded-xl border border-border bg-card p-5 cursor-default",
				className,
			)}
		>
			{/* Radial glow on hover */}
			<motion.div
				className="pointer-events-none absolute inset-0 rounded-xl"
				animate={
					hovered
						? {
								background: `radial-gradient(ellipse 80% 60% at 10% 0%, ${styles.glow}10, transparent 70%)`,
								opacity: 1,
							}
						: { opacity: 0 }
				}
				transition={{ duration: 0.35 }}
			/>

			<div className="relative flex items-start justify-between">
				<div>
					<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
						{title}
					</p>
					<motion.p
						key={String(displayVal)}
						className="mt-2 font-heading text-3xl font-bold tracking-tight text-foreground tabular-nums"
					>
						{displayVal}
					</motion.p>
					{trend && (
						<p className="mt-1.5 text-xs text-muted-foreground flex items-center gap-1">
							<span
								className={cn(
									"inline-flex items-center gap-0.5 font-medium",
									trend.value >= 0 ? "text-(--pf-green)" : "text-destructive",
								)}
							>
								{trend.value >= 0 ? "↑" : "↓"}
								{Math.abs(trend.value)}
							</span>
							{trend.label}
						</p>
					)}
				</div>

				<motion.div
					className={cn(
						"flex h-10 w-10 items-center justify-center rounded-xl shrink-0",
						styles.icon,
					)}
					whileHover={{ scale: 1.12, rotate: -6 }}
					transition={{ type: "spring", stiffness: 400, damping: 18 }}
				>
					<Icon name={icon} className="h-5 w-5" strokeWidth={1.7} />
				</motion.div>
			</div>

			{/* Bottom accent bar */}
			<div
				className={cn(
					"absolute inset-x-0 bottom-0 h-[2px] bg-linear-to-r opacity-0 transition-opacity duration-500 group-hover:opacity-100",
					styles.bar,
				)}
			/>
		</motion.div>
	);
}
