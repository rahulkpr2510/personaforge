// app/(dashboard)/dashboard/layout.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { SidebarItem } from "@/components/dashboard/SidebarItem";
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
	const { userId } = await auth();
	if (!userId) redirect("/sign-in");

	return (
		<div className="min-h-screen bg-background">
			{/* Desktop sidebar */}
			<Sidebar className="hidden lg:flex">
				<div className="mb-2 px-3">
					<p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
						Menu
					</p>
				</div>
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
			<main className="lg:pl-60">
				<div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
					{children}
				</div>
			</main>
		</div>
	);
}
