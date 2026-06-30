// components/dashboard/SidebarItem.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/dashboard/Icon";
import { cn } from "@/lib/utils";

interface SidebarItemProps {
	href: string;
	icon: IconName;
	label: string;
	badge?: number;
	exact?: boolean;
}

export function SidebarItem({
	href,
	icon,
	label,
	badge,
	exact,
}: SidebarItemProps) {
	const pathname = usePathname();
	const isActive = exact ? pathname === href : pathname.startsWith(href);

	return (
		<Link
			href={href}
			className={cn(
				"group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
				isActive
					? "bg-(--pf-accent-soft) text-(--pf-accent)"
					: "text-muted-foreground hover:bg-accent hover:text-foreground",
			)}
		>
			{/* Active indicator bar */}
			{isActive && (
				<span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-(--pf-accent)" />
			)}
			<Icon
				name={icon}
				className={cn(
					"h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110",
					isActive
						? "text-(--pf-accent)"
						: "text-muted-foreground group-hover:text-foreground",
				)}
				strokeWidth={isActive ? 2 : 1.8}
			/>
			<span className="flex-1 truncate">{label}</span>
			{badge != null && badge > 0 && (
				<span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-(--pf-accent) px-1.5 text-xs font-medium text-white tabular-nums">
					{badge > 99 ? "99+" : badge}
				</span>
			)}
		</Link>
	);
}
