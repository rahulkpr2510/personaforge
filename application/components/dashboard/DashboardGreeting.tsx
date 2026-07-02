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
			className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8"
		>
			{/* Subtle gradient background */}
			<div
				className="pointer-events-none absolute inset-0 rounded-2xl opacity-40"
				style={{
					background:
						"radial-gradient(ellipse 80% 120% at 90% 50%, var(--pf-accent, #6366f1)08, transparent 70%)",
				}}
			/>

			<div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<div>
					<p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">
						{greeting}
					</p>
					<h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
						{firstName} 👋
					</h1>
					<p className="mt-1.5 text-sm text-muted-foreground">
						{running > 0 ? (
							<span className="flex items-center gap-1.5">
								<span className="relative flex h-2 w-2">
									<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-(--pf-accent) opacity-75" />
									<span className="relative inline-flex rounded-full h-2 w-2 bg-(--pf-accent)" />
								</span>
								{running} analysis{running > 1 ? "es" : ""} running right now
							</span>
						) : (
							"Ready to analyse your next product?"
						)}
					</p>
				</div>

				<Link
					href={href}
					className="inline-flex items-center gap-2 self-start sm:self-auto rounded-xl bg-(--pf-accent) px-5 py-2.5 text-sm font-semibold text-white shadow-[0_2px_16px_var(--pf-accent,#6366f1)35] hover:opacity-90 hover:-translate-y-0.5 transition-all"
				>
					<PlusCircle className="h-4 w-4" />
					New Analysis
				</Link>
			</div>
		</motion.div>
	);
}
