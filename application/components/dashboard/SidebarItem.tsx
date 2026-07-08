"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/dashboard/Icon";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

interface SidebarItemProps {
	href: string;
	icon: IconName;
	label: string;
	badge?: number;
	exact?: boolean;
	description?: string;
}

export function SidebarItem({
	href,
	icon,
	label,
	badge,
	exact,
	description,
}: SidebarItemProps) {
	const pathname = usePathname();
	const isActive = exact ? pathname === href : pathname.startsWith(href);

	return (
		<Link href={href} className="relative block group focus:outline-none">
			<motion.div
				whileHover={{ x: isActive ? 0 : 2 }}
				whileTap={{ scale: 0.98 }}
				transition={{ type: "spring", stiffness: 400, damping: 28 }}
				className={cn(
					"relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150",
					isActive
						? "bg-(--pf-accent-soft) text-(--pf-accent)"
						: "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
				)}
			>
				{/* Active pill indicator */}
				<AnimatePresence>
					{isActive && (
						<motion.span
							initial={{ opacity: 0, scaleY: 0.4 }}
							animate={{ opacity: 1, scaleY: 1 }}
							exit={{ opacity: 0, scaleY: 0.4 }}
							transition={{ type: "spring", stiffness: 400, damping: 28 }}
							className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-(--pf-accent)"
						/>
					)}
				</AnimatePresence>

				{/* Icon */}
				<motion.div
					animate={isActive ? { scale: 1.1 } : { scale: 1 }}
					transition={{ type: "spring", stiffness: 400, damping: 22 }}
					className={cn(
						"relative shrink-0 h-8 w-8 flex items-center justify-center rounded-lg transition-colors duration-150",
						isActive
							? "bg-(--pf-accent)/15 text-(--pf-accent)"
							: "text-muted-foreground group-hover:text-foreground group-hover:bg-accent",
					)}
				>
					<Icon
						name={icon}
						className="h-4 w-4"
						strokeWidth={isActive ? 2.2 : 1.8}
					/>
					{/* Glow on active */}
					{isActive && (
						<motion.div
							className="absolute inset-0 rounded-lg bg-(--pf-accent)/20 blur-md"
							animate={{ opacity: [0.5, 1, 0.5] }}
							transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
						/>
					)}
				</motion.div>

				{/* Label + optional description */}
				<div className="min-w-0 flex-1">
					<span className="block truncate leading-tight">{label}</span>
					{description && (
						<span className="block truncate text-[10px] font-normal text-muted-foreground/70 leading-tight mt-0.5">
							{description}
						</span>
					)}
				</div>

				{/* Badge */}
				{badge != null && badge > 0 && (
					<motion.span
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						transition={{ type: "spring", stiffness: 500, damping: 20 }}
						className="flex h-5 min-w-5 items-center justify-center rounded-full bg-(--pf-accent) px-1.5 text-[10px] font-semibold text-white tabular-nums"
					>
						{badge > 99 ? "99+" : badge}
					</motion.span>
				)}

				{/* Hover arrow */}
				{!isActive && (
					<svg
						className="h-3 w-3 text-muted-foreground/40 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all duration-150 shrink-0"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M9 18l6-6-6-6" />
					</svg>
				)}
			</motion.div>
		</Link>
	);
}

/* ─── Section header divider ─── */
export function SidebarSection({ label }: { label: string }) {
	return (
		<div className="flex items-center gap-2 px-3 pt-5 pb-1.5">
			<span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60">
				{label}
			</span>
			<div className="flex-1 h-px bg-border/50" />
		</div>
	);
}
