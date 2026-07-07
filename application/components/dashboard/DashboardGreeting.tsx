"use client";
import { motion } from "motion/react";
import Link from "next/link";
import { Zap, PlusCircle } from "lucide-react";

interface Props {
	firstName: string;
	running: number;
	href: string;
}

function getGreeting() {
	const h = new Date().getHours();
	if (h < 12) return "Good morning";
	if (h < 17) return "Good afternoon";
	return "Good evening";
}

export function DashboardGreeting({ firstName, running, href }: Props) {
	const greeting = getGreeting();

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
			className="relative overflow-hidden rounded-xl border border-border bg-card p-5"
		>
			{/* Subtle gradient background */}
			<div
				className="pointer-events-none absolute inset-0 rounded-xl opacity-40"
				style={{
					background:
						"radial-gradient(ellipse 80% 120% at 90% 50%, var(--pf-accent, #6366f1)08, transparent 70%)",
				}}
			/>

			<div className="relative flex flex-row items-center justify-between gap-4">
				<div>
					<p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
						{greeting}
					</p>
					<h1 className="font-heading text-xl font-bold text-foreground">
						{firstName} 👋
					</h1>
					<p className="text-xs text-muted-foreground mt-0.5">
						{running > 0 ? (
							<span className="flex items-center gap-1.5">
								<span className="relative flex h-2 w-2">
									<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-(--pf-accent) opacity-75" />
									<span className="relative inline-flex rounded-full h-2 w-2 bg-(--pf-accent)" />
								</span>
								{running} analysis{running > 1 ? "es" : ""} running
							</span>
						) : (
							"Ready to analyse your next product?"
						)}
					</p>
				</div>

				<Link
					href={href}
					className="inline-flex items-center gap-1.5 rounded-lg bg-(--pf-accent) px-4 py-2 text-xs font-semibold text-white shadow-[0_2px_16px_var(--pf-accent,#6366f1)35] hover:opacity-90 hover:-translate-y-0.5 transition-all"
				>
					<PlusCircle className="h-3.5 w-3.5" />
					New
				</Link>
			</div>
		</motion.div>
	);
}
