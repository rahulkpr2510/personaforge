"use client";
import Link from "next/link";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { cn } from "@/lib/utils";
import { UserButton, useUser } from "@clerk/nextjs";
import { motion } from "motion/react";

interface SidebarProps {
	logo?: React.ReactNode;
	children: React.ReactNode;
	bottomChildren?: React.ReactNode;
	className?: string;
}

export function Sidebar({
	logo,
	children,
	bottomChildren,
	className,
}: SidebarProps) {
	const { user, isLoaded } = useUser();
	const displayName =
		user?.fullName ||
		user?.firstName ||
		user?.emailAddresses[0]?.emailAddress ||
		"";
	const email = user?.emailAddresses[0]?.emailAddress || "";

	return (
		<aside
			className={cn(
				"fixed inset-y-0 left-0 z-40 flex w-64 flex-col",
				"border-r border-border/60",
				"bg-sidebar/95 backdrop-blur-xl",
				"transition-transform duration-300",
				className,
			)}
		>
			{/* Subtle gradient wash at top */}
			<div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-b from-(--pf-accent)/4 to-transparent" />

			{/* Logo / header area */}
			<div className="relative flex h-16 shrink-0 items-center gap-3 border-b border-border/50 px-4">
				{logo ?? (
					<Link href="/dashboard" className="flex items-center gap-2.5 group min-w-0">
						<motion.div
							whileHover={{ scale: 1.08 }}
							whileTap={{ scale: 0.95 }}
							transition={{ type: "spring", stiffness: 400, damping: 20 }}
							className="relative shrink-0"
						>
							<svg
								width="30"
								height="30"
								viewBox="0 0 32 32"
								fill="none"
								aria-label="PersonaForge logo"
							>
								<rect
									width="32"
									height="32"
									rx="8"
									fill="var(--pf-accent)"
									opacity="0.15"
								/>
								<path
									d="M8 10C8 8.895 8.895 8 10 8h5c3.314 0 6 2.686 6 6s-2.686 6-6 6H8V10z"
									fill="var(--pf-accent)"
									opacity="0.85"
								/>
								<circle cx="22" cy="22" r="4" fill="var(--pf-accent)" />
							</svg>
							{/* Breathing dot */}
							<span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-(--pf-accent) ring-2 ring-sidebar">
								<span className="absolute inset-0 rounded-full bg-(--pf-accent) animate-ping opacity-60" />
							</span>
						</motion.div>
						<div className="min-w-0">
							<p className="font-heading text-sm font-semibold tracking-tight text-foreground group-hover:text-(--pf-accent) transition-colors truncate">
								PersonaForge
							</p>
							<p className="text-[10px] text-muted-foreground leading-none mt-0.5">
								Synthetic UX Research
							</p>
						</div>
					</Link>
				)}
			</div>

			{/* Nav items */}
			<nav className="relative flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
				{children}
			</nav>

			{/* Bottom section */}
			<div className="relative shrink-0 border-t border-border/50 p-3 space-y-2">
				{bottomChildren}

				{/* User card */}
				<div className="flex items-center gap-3 rounded-xl px-2.5 py-2 bg-accent/30 hover:bg-accent/60 transition-colors duration-200 group cursor-default">
					<UserButton
						appearance={{
							elements: {
								avatarBox: "h-8 w-8",
							},
						}}
					/>
					<div className="min-w-0 flex-1">
						{isLoaded ? (
							<>
								<p className="truncate text-xs font-semibold text-foreground leading-tight">
									{displayName}
								</p>
								<p className="truncate text-[10px] text-muted-foreground leading-tight mt-0.5">
									{email}
								</p>
							</>
						) : (
							<div className="space-y-1.5">
								<div className="h-2.5 w-24 animate-pulse rounded-full bg-muted" />
								<div className="h-2 w-32 animate-pulse rounded-full bg-muted" />
							</div>
						)}
					</div>
					<ThemeToggle />
				</div>
			</div>
		</aside>
	);
}
