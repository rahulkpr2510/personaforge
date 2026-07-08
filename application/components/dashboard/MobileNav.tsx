"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Icon, type IconName } from "@/components/dashboard/Icon";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

interface NavItem {
	href: string;
	icon: IconName;
	label: string;
	exact?: boolean;
}

interface MobileNavProps {
	items: NavItem[];
	title?: string;
}

export function MobileNav({ items, title = "PersonaForge" }: MobileNavProps) {
	const [open, setOpen] = useState(false);
	const pathname = usePathname();

	useEffect(() => {
		setOpen(false);
	}, [pathname]);

	return (
		<>
			{/* Top bar (mobile only) */}
			<header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-sidebar/90 backdrop-blur-md px-4 lg:hidden">
				<div className="flex items-center gap-2">
					<svg width="24" height="24" viewBox="0 0 32 32" fill="none">
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
					<span className="font-heading text-sm font-semibold">{title}</span>
				</div>
				<div className="flex items-center gap-2">
					<ThemeToggle />
					<button
						onClick={() => setOpen(!open)}
						aria-label="Toggle navigation"
						className="flex h-8 w-8 items-center justify-center rounded-md text-foreground/70 hover:bg-accent hover:text-foreground transition-colors"
					>
						{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
					</button>
				</div>
			</header>

			{/* Overlay */}
			<AnimatePresence>
				{open && (
					<>
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
							onClick={() => setOpen(false)}
						/>
						<motion.div
							initial={{ x: "-100%" }}
							animate={{ x: 0 }}
							exit={{ x: "-100%" }}
							transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
							className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-sidebar lg:hidden"
						>
							<div className="flex h-14 items-center justify-between border-b border-border px-4">
								<span className="font-heading text-sm font-semibold">
									{title}
								</span>
								<button
									onClick={() => setOpen(false)}
									className="rounded-md p-1 text-muted-foreground hover:text-foreground"
								>
									<X className="h-5 w-5" />
								</button>
							</div>
							<nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
								{items.map((item) => {
									const isActive = item.exact
										? pathname === item.href
										: pathname.startsWith(item.href);
									return (
										<Link
											key={item.href}
											href={item.href}
											className={cn(
												"flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
												isActive
													? "bg-(--pf-accent-soft) text-(--pf-accent)"
													: "text-muted-foreground hover:bg-accent hover:text-foreground",
											)}
										>
											<Icon
												name={item.icon}
												className="h-4 w-4 shrink-0"
												strokeWidth={isActive ? 2 : 1.8}
											/>
											{item.label}
										</Link>
									);
								})}
							</nav>
							<div className="border-t border-border p-4 flex items-center gap-3">
								<UserButton />
								<span className="flex-1 text-xs text-muted-foreground">
									Account
								</span>
								<ThemeToggle />
							</div>
						</motion.div>
					</>
				)}
			</AnimatePresence>
		</>
	);
}
