"use client";

import { useState } from "react";
import { motion, TargetAndTransition } from "motion/react";
import { NoiseTexture } from "@/components/ui/NoiseTexture";

const FEATURES = [
	{
		icon: (
			<svg
				width="22"
				height="22"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.6"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
				<circle cx="9" cy="7" r="4" />
				<path d="M23 21v-2a4 4 0 0 0-3-3.87" />
				<path d="M16 3.13a4 4 0 0 1 0 7.75" />
			</svg>
		),
		title: "Synthetic Personas",
		description:
			"Generate up to 5 AI users per run — each with distinct demographics, goals, technical fluency, and frustrations.",
		size: "md",
		hoverAnim: "users",
	},
	{
		icon: (
			<svg
				width="22"
				height="22"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.6"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<circle cx="11" cy="11" r="8" />
				<line x1="21" y1="21" x2="16.65" y2="16.65" />
			</svg>
		),
		title: "Real Browser Crawling",
		description:
			"Playwright opens your actual URL, captures full-page screenshots, maps navigation, and detects every form and button.",
		size: "lg",
		hoverAnim: "search",
	},
	{
		icon: (
			<svg
				width="22"
				height="22"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.6"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
				<circle cx="12" cy="12" r="3" />
			</svg>
		),
		title: "Vision-Powered Analysis",
		description:
			"Gemini Vision reads every screenshot for UI complexity, accessibility gaps, and layout hierarchy.",
		size: "sm",
		hoverAnim: "eye",
	},
	{
		icon: (
			<svg
				width="22"
				height="22"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.6"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
			</svg>
		),
		title: "Evidence-Backed Findings",
		description:
			'Every pain point is tied to a metric — "11 input fields across 3 steps" not "feels overwhelming".',
		size: "sm",
		hoverAnim: "pulse",
	},
	{
		icon: (
			<svg
				width="22"
				height="22"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.6"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<line x1="18" y1="20" x2="18" y2="10" />
				<line x1="12" y1="20" x2="12" y2="4" />
				<line x1="6" y1="20" x2="6" y2="14" />
			</svg>
		),
		title: "Friction Scores",
		description:
			"Quantified friction per persona, per page area — giving you a ranked list of what to fix first.",
		size: "md",
		hoverAnim: "bars",
	},
	{
		icon: (
			<svg
				width="22"
				height="22"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.6"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
			</svg>
		),
		title: "Focus Group Simulation",
		description:
			"An AI moderator surfaces real disagreements between personas and explains the demographic root of each conflict.",
		size: "lg",
		hoverAnim: "chat",
	},
];

const iconAnimVariants: Record<
	string,
	{ hover: TargetAndTransition; initial: TargetAndTransition }
> = {
	users: {
		initial: { x: 0, rotate: 0 },
		hover: {
			x: [0, -3, 3, -2, 0],
			rotate: [0, -5, 5, -3, 0],
			transition: { duration: 0.5 },
		},
	},
	search: {
		initial: { rotate: 0, scale: 1 },
		hover: {
			rotate: [0, -15, 15, -10, 0],
			scale: [1, 1.15, 1],
			transition: { duration: 0.5 },
		},
	},
	eye: {
		initial: { scaleX: 1, scaleY: 1 },
		hover: {
			scaleX: [1, 0.6, 1.1, 1],
			scaleY: [1, 1.3, 0.9, 1],
			transition: { duration: 0.45 },
		},
	},
	pulse: {
		initial: { scale: 1, y: 0 },
		hover: {
			scale: [1, 1.25, 0.95, 1.1, 1],
			y: [0, -2, 0],
			transition: { duration: 0.5 },
		},
	},
	chat: {
		initial: { y: 0, rotate: 0 },
		hover: {
			y: [0, -5, 1, -3, 0],
			rotate: [0, 3, -3, 2, 0],
			transition: { duration: 0.5 },
		},
	},
	bars: {
		initial: { scaleY: 1 },
		hover: {
			scaleY: [1, 1.3, 0.8, 1.15, 1],
			originY: 1,
			transition: { duration: 0.5 },
		},
	},
};

function FeatureCard({ feature }: { feature: (typeof FEATURES)[0] }) {
	const [hovered, setHovered] = useState(false);
	const anim = iconAnimVariants[feature.hoverAnim];

	return (
		<motion.div
			onHoverStart={() => setHovered(true)}
			onHoverEnd={() => setHovered(false)}
			initial={{ opacity: 0, y: 16 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: "-40px" }}
			transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
			className="group relative flex flex-col gap-4 rounded-2xl border border-neutral-200 dark:border-neutral-700/60 bg-white dark:bg-neutral-900/60 p-6 overflow-hidden transition-all duration-300 hover:shadow-lg dark:hover:shadow-neutral-900/50 h-full cursor-default"
		>
			{/* Hover gradient glow — top-left corner */}
			<motion.div
				className="pointer-events-none absolute -top-16 -left-16 w-48 h-48 rounded-full"
				animate={
					hovered ? { opacity: 0.5, scale: 1.2 } : { opacity: 0, scale: 0.8 }
				}
				transition={{ duration: 0.4, ease: "easeOut" }}
				style={{
					background:
						"radial-gradient(circle, var(--pf-accent-soft) 0%, transparent 70%)",
				}}
			/>

			{/* Border shimmer on hover */}
			<motion.div
				className="pointer-events-none absolute inset-0 rounded-2xl"
				animate={hovered ? { opacity: 1 } : { opacity: 0 }}
				transition={{ duration: 0.3 }}
				style={{
					boxShadow: "inset 0 0 0 1px oklch(0.6 0.15 250 / 0.2)",
				}}
			/>

			{/* Icon */}
			<motion.div
				animate={hovered ? anim.hover : anim.initial}
				className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300 shrink-0 transition-colors duration-300 group-hover:bg-(--pf-accent-soft) group-hover:text-(--pf-accent)"
			>
				{feature.icon}
			</motion.div>

			{/* Text */}
			<div className="flex flex-col gap-1.5 relative">
				<h3 className="font-heading text-base font-semibold text-neutral-900 dark:text-neutral-50">
					{feature.title}
				</h3>
				<p className="font-body text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
					{feature.description}
				</p>
			</div>

			{/* Arrow indicator — subtle right arrow on hover */}
			<motion.div
				className="absolute bottom-5 right-5 text-neutral-300 dark:text-neutral-700"
				animate={hovered ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
				transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
			>
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<line x1="5" y1="12" x2="19" y2="12" />
					<polyline points="12 5 19 12 12 19" />
				</svg>
			</motion.div>
		</motion.div>
	);
}

export function Features() {
	return (
		<section
			id="features"
			className="relative w-full py-28 px-4 overflow-hidden"
		>
			<NoiseTexture />
			<div className="mx-auto max-w-5xl">
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
					className="text-center mb-14"
				>
					<p className="font-body text-xs tracking-[0.18em] uppercase text-neutral-400 dark:text-neutral-500 mb-3">
						Features
					</p>
					<h2 className="font-heading text-3xl sm:text-4xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
						Everything you need to test smarter
					</h2>
					<p className="mt-4 font-body text-[15px] text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
						Predictive research infrastructure — built for product teams who
						move fast.
					</p>
				</motion.div>

				{/* Bento grid — 3 col desktop, dynamic layout */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{FEATURES.map((f, i) => {
						let gridSpan = "";
						if (f.title === "Synthetic Personas")
							gridSpan = "lg:col-span-1 md:col-span-1";
						else if (f.title === "Real Browser Crawling")
							gridSpan = "lg:col-span-2 md:col-span-1";
						else if (f.title === "Vision-Powered Analysis")
							gridSpan = "lg:col-span-1 md:col-span-1";
						else if (f.title === "Evidence-Backed Findings")
							gridSpan = "lg:col-span-1 md:col-span-1";
						else if (f.title === "Friction Scores")
							gridSpan = "lg:col-span-1 md:col-span-2";
						else if (f.title === "Focus Group Simulation")
							gridSpan = "lg:col-span-3 md:col-span-2";

						return (
							<motion.div
								key={f.title}
								className={gridSpan}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true, margin: "-30px" }}
								transition={{
									delay: i * 0.07,
									duration: 0.45,
									ease: [0.16, 1, 0.3, 1],
								}}
							>
								<FeatureCard feature={f} />
							</motion.div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
