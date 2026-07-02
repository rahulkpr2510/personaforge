// app/(dashboard)/admin/layout.tsx
import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { SidebarItem, SidebarSection } from "@/components/dashboard/SidebarItem";

import { type IconName } from "@/components/dashboard/Icon";
import Link from "next/link";

const adminNavItems: { href: string; icon: IconName; label: string; exact?: boolean }[] = [
	{ href: "/admin", icon: "LayoutDashboard", label: "Overview", exact: true },
	{ href: "/admin/users", icon: "Users", label: "Users" },
	{ href: "/admin/analyses", icon: "FlaskConical", label: "Analyses" },
	{ href: "/admin/personas", icon: "UserCog", label: "Personas" },
];

export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const user = await requireAuth();
	if (user.role !== "ADMIN") redirect("/dashboard");

	return (
		<div className="min-h-screen bg-background">
			<Sidebar
				className="hidden lg:flex"
				logo={
					<div className="flex items-center gap-2.5">
						<svg width="28" height="28" viewBox="0 0 32 32" fill="none">
							<rect
								width="32"
								height="32"
								rx="8"
								fill="var(--pf-amber)"
								opacity="0.15"
							/>
							<path
								d="M8 10C8 8.895 8.895 8 10 8h5c3.314 0 6 2.686 6 6s-2.686 6-6 6H8V10z"
								fill="var(--pf-amber)"
								opacity="0.8"
							/>
							<circle cx="22" cy="22" r="4" fill="var(--pf-amber)" />
						</svg>
						<div>
							<p className="font-heading text-xs font-semibold tracking-tight text-foreground">
								PersonaForge
							</p>
							<p className="text-xs text-muted-foreground leading-none">
								Admin
							</p>
						</div>
					</div>
				}

			>
				<SidebarSection label="Admin Panel" />
				{adminNavItems.map((item) => (
					<SidebarItem
						key={item.href}
						href={item.href}
						icon={item.icon}
						label={item.label}
						exact={item.exact}
					/>
				))}
			</Sidebar>

			<MobileNav items={adminNavItems} title="Admin Panel" />

			<main className="lg:pl-64">
				<div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
					{children}
				</div>
			</main>
		</div>
	);
}
