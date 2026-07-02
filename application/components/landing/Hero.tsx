"use client";

import { motion, Variants, useMotionValue, useTransform } from "motion/react";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { NoiseTexture } from "@/components/ui/NoiseTexture";

const ease = [0.16, 1, 0.3, 1] as const;

const fadeUp: Variants = {
	hidden: { opacity: 0, y: 24 },
	show: (i: number) => ({
		opacity: 1,
		y: 0,
		transition: { delay: i * 0.1, duration: 0.6, ease },
	}),
};

/* ── Floating persona chips ── */
const CHIPS = [
	{
		emoji: "👩‍🎓",
		label: "Maya, 23 · Student",
		sub: "friction: 8.4",
		color: "#6366f1",
		anchor: "top-left" as const,
		delay: 0.55,
	},
	{
		emoji: "👨‍💼",
		label: "Richard, 45 · Enterprise Exec",
		sub: "friction: 3.1",
		color: "#f59e0b",
		anchor: "top-right" as const,
		delay: 0.65,
	},
	{
		emoji: "👩‍💻",
		label: "Priya, 31 · Senior Dev",
		sub: "friction: 5.7",
		color: "#10b981",
		anchor: "mid-left" as const,
		delay: 0.75,
	},
	{
		emoji: "🏪",
		label: "Carlos, 38 · SMB Owner",
		sub: "friction: 9.2",
		color: "#ec4899",
		anchor: "mid-right" as const,
		delay: 0.85,
	},
];

const ANCHOR_CLASSES: Record<string, string> = {
	"top-left": "top-[18%] left-[4%]",
	"top-right": "top-[18%] right-[4%]",
	"mid-left": "top-[52%] left-[4%]",
	"mid-right": "top-[52%] right-[4%]",
};

function PersonaChip({
	emoji,
	label,
	sub,
	color,
	anchor,
	delay,
}: (typeof CHIPS)[0]) {
	return (
		<motion.div
			className={`absolute hidden xl:block z-10 ${ANCHOR_CLASSES[anchor]}`}
			initial={{ opacity: 0, scale: 0.5 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{
				delay,
				type: "spring",
				stiffness: 300,
				damping: 16,
				mass: 0.8,
			}}
		>
			{/* Layer 2 — continuous idle float, independent of entrance and hover */}
			<motion.div
				animate={{ y: [0, -7, 0] }}
				transition={{
					repeat: Infinity,
					duration: 2.6 + delay * 0.4,
					ease: "easeInOut",
					delay: delay * 0.3,
				}}
			>
				{/* Layer 3 — hover card */}
				<motion.div
					className="flex items-center gap-3 rounded-2xl border bg-background/90 backdrop-blur-md px-3.5 py-2.5 shadow-xl cursor-default select-none"
					style={{
						borderColor: `${color}35`,
						boxShadow: `0 8px 32px ${color}12`,
					}}
					whileHover={{
						scale: 1.06,
						boxShadow: `0 18px 50px ${color}35`,
						borderColor: `${color}90`,
					}}
					whileTap={{ scale: 0.97 }}
					transition={{ type: "spring", stiffness: 420, damping: 22 }}
				>
					{/* Emoji avatar — jiggles on hover via inherited whileHover propagation */}
					<motion.div
						className="h-9 w-9 rounded-full flex items-center justify-center text-lg border shrink-0"
						style={{ backgroundColor: `${color}18`, borderColor: `${color}50` }}
						whileHover={{
							scale: 1.18,
							rotate: [0, -10, 10, -4, 0],
							transition: {
								scale: { type: "spring", stiffness: 380, damping: 18 },
								rotate: { type: "tween", duration: 0.45, ease: "easeInOut" },
							},
						}}
					>
						{emoji}
					</motion.div>

					{/* Text */}
					<div className="min-w-0">
						<p className="text-[11.5px] font-semibold text-foreground font-heading leading-none whitespace-nowrap">
							{label}
						</p>
						<motion.p
							className="text-[10px] font-mono mt-1 whitespace-nowrap"
							style={{ color }}
							animate={{ opacity: [0.65, 1, 0.65] }}
							transition={{
								repeat: Infinity,
								duration: 2.4,
								ease: "easeInOut",
								delay: delay * 0.5,
							}}
						>
							{sub}
						</motion.p>
					</div>

					{/* Inset glow ring on hover */}
					<motion.div
						className="pointer-events-none absolute inset-0 rounded-2xl"
						initial={{ opacity: 0 }}
						whileHover={{ opacity: 1 }}
						transition={{ duration: 0.15 }}
						style={{ boxShadow: `inset 0 0 0 1px ${color}65` }}
					/>
				</motion.div>
			</motion.div>
		</motion.div>
	);
}

/* ── Stat pills ── */
const STATS = [
	{ value: "5", label: "AI personas per run" },
	{ value: "< 5m", label: "to first friction report" },
	{ value: "100%", label: "evidence-backed findings" },
];

export function Hero() {
	return (
		<section
			id="hero"
			className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pt-24 pb-20"
		>
			<NoiseTexture />

			{/* Radial glows */}
			<div
				className="pointer-events-none absolute inset-0 z-0"
				style={{
					background:
						"radial-gradient(ellipse 80% 60% at 50% 0%, oklch(0.92 0.02 250 / 0.25) 0%, transparent 70%)",
				}}
			/>
			<div
				className="dark:block hidden pointer-events-none absolute inset-0 z-0"
				style={{
					background:
						"radial-gradient(ellipse 80% 50% at 50% 0%, oklch(0.3 0.06 250 / 0.22) 0%, transparent 70%)",
				}}
			/>

			{/* Floating persona chips — absolutely positioned on the section */}
			{CHIPS.map((chip) => (
				<PersonaChip key={chip.label} {...chip} />
			))}

			{/* Content wrapper */}
			<div className="relative z-10 w-full max-w-3xl">
				<div className="flex flex-col items-center text-center">
					{/* Badge */}
					<motion.div
						custom={0}
						initial="hidden"
						animate="show"
						variants={fadeUp}
						className="mb-7 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3.5 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur-sm"
					>
						<span className="relative flex h-1.5 w-1.5">
							<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--pf-accent) opacity-60" />
							<span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-(--pf-accent)" />
						</span>
						AI-Powered Synthetic User Research
					</motion.div>

					{/* Headline */}
					<motion.h1
						custom={1}
						initial="hidden"
						animate="show"
						variants={fadeUp}
						className="mb-5 text-[clamp(2.4rem,5.5vw,4.2rem)] font-black leading-[1.08] tracking-tight text-foreground"
						style={{ fontFamily: "var(--font-display)" }}
					>
						Simulate real users.
						<br />
						Find UX friction{" "}
						<span className="italic text-(--pf-accent)">before</span>
						<br />
						launch day.
					</motion.h1>

					{/* Sub */}
					<motion.p
						custom={2}
						initial="hidden"
						animate="show"
						variants={fadeUp}
						className="mb-9 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-[17px]"
					>
						PersonaForge spins up AI personas with real demographics, crawls
						your product with a live browser, and delivers ranked friction
						scores with evidence — so you fix the right things before users ever
						complain.
					</motion.p>

					{/* CTAs */}
					<motion.div
						custom={3}
						initial="hidden"
						animate="show"
						variants={fadeUp}
						className="flex flex-wrap items-center justify-center gap-3 mb-12"
					>
						<Link
							href="/sign-in"
							className="group inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-2.5 text-sm font-semibold text-background shadow-sm transition-all hover:opacity-85 active:scale-95"
						>
							Run your first test now
							<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
						</Link>
						<a
							href="#features"
							className="inline-flex items-center gap-2 rounded-lg border border-border bg-background/60 px-5 py-2.5 text-sm font-medium text-foreground backdrop-blur-sm transition-all hover:bg-foreground/5 active:scale-95"
						>
							See how it works
						</a>
					</motion.div>

					{/* Stat pills */}
					<motion.div
						custom={4}
						initial="hidden"
						animate="show"
						variants={fadeUp}
						className="flex flex-wrap items-center justify-center gap-3 mb-16"
					>
						{STATS.map((s, i) => (
							<motion.div
								key={i}
								initial={{ opacity: 0, y: 8 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.5 + i * 0.1, duration: 0.5, ease }}
								className="flex items-center gap-2 rounded-full border border-border/60 bg-background/50 px-4 py-1.5 backdrop-blur-sm"
							>
								<span className="text-sm font-bold text-foreground font-heading tabular-nums">
									{s.value}
								</span>
								<span className="text-xs text-muted-foreground">{s.label}</span>
							</motion.div>
						))}
					</motion.div>

					{/* Scroll cue */}
					<motion.div
						custom={5}
						initial="hidden"
						animate="show"
						variants={fadeUp}
					>
						<a
							href="#features"
							aria-label="Scroll down"
							className="flex flex-col items-center gap-1 text-muted-foreground/40 transition-colors hover:text-muted-foreground"
						>
							<motion.div
								animate={{ y: [0, 5, 0] }}
								transition={{
									repeat: Infinity,
									duration: 2,
									ease: "easeInOut",
								}}
							>
								<ChevronDown className="h-4 w-4" />
							</motion.div>
						</a>
					</motion.div>
				</div>
			</div>
		</section>
	);
}
