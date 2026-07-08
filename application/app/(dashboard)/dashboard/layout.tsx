import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { SidebarItem, SidebarSection } from "@/components/dashboard/SidebarItem";
import { type IconName } from "@/components/dashboard/Icon";

const navItems: { href: string; icon: IconName; label: string; exact?: boolean }[] = [
	{ href: "/dashboard", icon: "LayoutDashboard", label: "Overview", exact: true },
	{ href: "/dashboard/analyses", icon: "FlaskConical", label: "Analyses" },
	{ href: "/dashboard/personas", icon: "Users", label: "Personas" },
	{ href: "/dashboard/new-analysis", icon: "PlusCircle", label: "New Analysis" },
];

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const user = await requireAuth();

	// Admins should always land on /admin, not the user dashboard
	if (user.role === "ADMIN") redirect("/admin");

	return (
		<div className="min-h-screen bg-background">
			{/* Desktop sidebar */}
			<Sidebar className="hidden lg:flex">
				<SidebarSection label="Workspace" />
				{navItems.map((item) => (
					<SidebarItem
						key={item.href}
						href={item.href}
						icon={item.icon}
						label={item.label}
						exact={item.exact}
					/>
				))}
			</Sidebar>

			{/* Mobile nav */}
			<MobileNav items={navItems} />

			{/* Main content */}
			<main className="lg:pl-64">
				<div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
					{children}
				</div>
			</main>
		</div>
	);
}
