// components/dashboard/Sidebar.tsx
"use client";
import Link from "next/link";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { cn } from "@/lib/utils";
import { UserButton, useUser } from "@clerk/nextjs";

interface SidebarProps {
	logo?: React.ReactNode;
	children: React.ReactNode; // SidebarItems
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

	return (
		<aside
			className={cn(
				"fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-border bg-sidebar",
				"transition-transform duration-300",
				className,
			)}
		>
			{/* Logo area */}
			<div className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
				{logo ?? (
					<Link href="/" className="flex items-center gap-2.5 group">
						<svg
							width="28"
							height="28"
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
								opacity="0.8"
							/>
							<circle cx="22" cy="22" r="4" fill="var(--pf-accent)" />
						</svg>
						<span className="font-heading text-sm font-semibold tracking-tight text-foreground group-hover:text-(--pf-accent) transition-colors">
							PersonaForge
						</span>
					</Link>
				)}
			</div>

			{/* Nav items */}
			<nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
				{children}
			</nav>

			{/* Bottom section */}
			<div className="shrink-0 border-t border-border p-3 space-y-1">
				{bottomChildren}
				<div className="flex items-center justify-between px-1 pt-2">
					<div className="flex min-w-0 flex-1 items-center gap-2.5">
						<UserButton />
						<div className="min-w-0 flex-1">
							{isLoaded ? (
								<p className="truncate text-xs font-medium text-foreground leading-tight">
									{displayName}
								</p>
							) : (
								<div className="h-3 w-24 animate-pulse rounded bg-muted" />
							)}
						</div>
					</div>
					<ThemeToggle />
				</div>
			</div>
		</aside>
	);
}
