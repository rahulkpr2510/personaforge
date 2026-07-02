"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
	motion,
	AnimatePresence,
	useInView,
	type Variants,
} from "motion/react";
import { NoiseTexture } from "@/components/ui/NoiseTexture";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Shared presets
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const smoothEase = [0.16, 1, 0.3, 1] as const;
const spring = { type: "spring" as const, stiffness: 380, damping: 26 };

const staggerContainer: Variants = {
	hidden: {},
	show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const fadeSlideUp: Variants = {
	hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
	show: {
		opacity: 1,
		y: 0,
		filter: "blur(0px)",
		transition: { duration: 0.5, ease: smoothEase },
	},
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Step 1 — Submit URL
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function SubmitStep({ isActive }: { isActive: boolean }) {
	const [typed, setTyped] = useState("");
	const [phase, setPhase] = useState<"typing" | "scanning" | "done" | "idle">(
		"idle",
	);
	const full = "https://yourproduct.com";

	useEffect(() => {
		if (!isActive) {
			setTyped("");
			setPhase("idle");
			return;
		}

		setTyped("");
		setPhase("typing");
		let i = 0;
		const t = setInterval(() => {
			i++;
			setTyped(full.slice(0, i));
			if (i >= full.length) {
				clearInterval(t);
				setTimeout(() => setPhase("scanning"), 400);
				setTimeout(() => setPhase("done"), 2400);
			}
		}, 48);
		return () => clearInterval(t);
	}, [isActive]);

	return (
		<motion.div
			className="flex flex-col items-center justify-center h-full gap-8 px-8 sm:px-14"
			variants={staggerContainer}
			initial="hidden"
			animate="show"
		>
			<motion.p
				variants={fadeSlideUp}
				className="text-[11px] font-body text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.2em] font-medium mt-8"
			>
				Submit your website
			</motion.p>

			{/* URL bar */}
			<motion.div variants={fadeSlideUp} className="w-full max-w-lg">
				<motion.div
					className="flex items-center gap-3 rounded-2xl border bg-neutral-50/80 dark:bg-neutral-800/50 px-5 py-4 backdrop-blur-sm"
					animate={{
						borderColor:
							phase === "scanning"
								? "var(--pf-accent)"
								: "rgba(163,163,163,0.3)",
						boxShadow:
							phase === "scanning"
								? "0 0 0 3px color-mix(in srgb, var(--pf-accent) 15%, transparent)"
								: "none",
					}}
					transition={{ duration: 0.4 }}
				>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.8"
						className="text-neutral-400 shrink-0"
					>
						<circle cx="12" cy="12" r="10" />
						<path d="M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z" />
						<path d="M2 12h20" />
					</svg>
					<span className="font-body text-[15px] text-neutral-700 dark:text-neutral-200 flex-1 min-w-0 truncate">
						{typed}
						<motion.span
							animate={{ opacity: phase === "done" ? 0 : [1, 0] }}
							transition={{ repeat: Infinity, duration: 0.55 }}
							className="inline-block w-[2px] h-[18px] bg-(--pf-accent) ml-0.5 align-middle rounded-full"
						/>
					</span>
				</motion.div>
			</motion.div>

			{/* Scanning overlay strip */}
			<AnimatePresence mode="wait">
				{phase === "scanning" && (
					<motion.div
						key="scanning"
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -6 }}
						transition={{ duration: 0.3 }}
						className="w-full max-w-lg space-y-3"
					>
						<div className="flex items-center justify-between text-xs font-body font-medium text-neutral-500 dark:text-neutral-400">
							<div className="flex items-center gap-2">
								<motion.div
									animate={{ rotate: 360 }}
									transition={{
										repeat: Infinity,
										duration: 0.9,
										ease: "linear",
									}}
									className="h-3.5 w-3.5 rounded-full border-2 border-neutral-300 border-t-(--pf-accent) dark:border-neutral-600 dark:border-t-(--pf-accent)"
								/>
								Scanning pages…
							</div>
							<motion.span
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								className="text-[11px] tabular-nums text-neutral-400"
							>
								crawling sitemap
							</motion.span>
						</div>

						{/* Multi-line skeleton rows being "scanned" */}
						{[1, 0.6, 0.85, 0.45].map((w, idx) => (
							<motion.div
								key={idx}
								className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-700/60 overflow-hidden"
								initial={{ opacity: 0, x: -8 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ delay: idx * 0.12, duration: 0.35 }}
							>
								<motion.div
									className="h-full rounded-full bg-(--pf-accent)/40"
									initial={{ width: "0%" }}
									animate={{ width: `${w * 100}%` }}
									transition={{
										delay: idx * 0.15,
										duration: 1.4,
										ease: smoothEase,
									}}
								/>
							</motion.div>
						))}

						{/* Main progress bar */}
						<div className="h-1.5 w-full rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
							<motion.div
								className="h-full rounded-full bg-(--pf-accent)"
								initial={{ width: "0%" }}
								animate={{ width: "100%" }}
								transition={{ duration: 2, ease: "easeInOut" }}
							/>
						</div>
					</motion.div>
				)}

				{phase === "done" && (
					<motion.div
						key="done"
						initial={{ opacity: 0, scale: 0.85, y: 12 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						transition={{ type: "spring", stiffness: 320, damping: 20 }}
						className="flex flex-col items-center gap-4"
					>
						<motion.div
							className="h-14 w-14 rounded-full bg-(--pf-accent)/10 flex items-center justify-center"
							animate={{ scale: [1, 1.08, 1] }}
							transition={{
								repeat: Infinity,
								duration: 2.5,
								ease: "easeInOut",
							}}
						>
							<motion.div
								className="h-9 w-9 rounded-full bg-(--pf-accent) flex items-center justify-center shadow-lg"
								initial={{ scale: 0 }}
								animate={{ scale: 1 }}
								transition={{
									type: "spring",
									stiffness: 400,
									damping: 18,
									delay: 0.1,
								}}
							>
								<motion.svg
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="white"
									strokeWidth="2.5"
									strokeLinecap="round"
									strokeLinejoin="round"
									initial={{ pathLength: 0 }}
									animate={{ pathLength: 1 }}
									transition={{ duration: 0.4, delay: 0.25 }}
								>
									<polyline points="20 6 9 17 4 12" />
								</motion.svg>
							</motion.div>
						</motion.div>
						<motion.button
							initial={{ opacity: 0, y: 6 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.3, duration: 0.4 }}
							className="flex items-center gap-2 px-8 py-3 rounded-xl bg-neutral-900 dark:bg-neutral-50 text-white dark:text-neutral-900 text-sm font-semibold font-body shadow-xl shadow-neutral-900/15"
						>
							Start analysis →
						</motion.button>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Step 2 — Pick Personas
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const PERSONA_LIST = [
	{
		emoji: "👩‍🎓",
		name: "College Student",
		age: 21,
		tech: "Medium",
		color: "bg-blue-50 dark:bg-blue-950/30",
	},
	{
		emoji: "👨‍💼",
		name: "Senior Executive",
		age: 58,
		tech: "Low",
		color: "bg-amber-50 dark:bg-amber-950/30",
	},
	{
		emoji: "👩‍💻",
		name: "Software Engineer",
		age: 28,
		tech: "Expert",
		color: "bg-emerald-50 dark:bg-emerald-950/30",
	},
	{
		emoji: "🏪",
		name: "Small Biz Owner",
		age: 44,
		tech: "Low",
		color: "bg-purple-50 dark:bg-purple-950/30",
	},
];

function PersonaStep({ isActive }: { isActive: boolean }) {
	const [selected, setSelected] = useState<number[]>([]);

	useEffect(() => {
		if (!isActive) {
			setSelected([]);
			return;
		}
		setSelected([]);
		const delays = [350, 900, 1500, 2100];
		const timers = delays.map((d, i) =>
			setTimeout(() => setSelected((prev) => [...prev, i]), d),
		);
		return () => timers.forEach(clearTimeout);
	}, [isActive]);

	return (
		<motion.div
			className="flex flex-col h-full px-6 sm:px-10 py-8 gap-3"
			variants={staggerContainer}
			initial="hidden"
			animate="show"
		>
			<motion.div
				variants={fadeSlideUp}
				className="flex items-center justify-between mb-3"
			>
				<p className="text-[11px] font-body text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.2em] font-medium">
					Select personas
				</p>
				<AnimatePresence>
					{selected.length > 0 && (
						<motion.span
							initial={{ opacity: 0, scale: 0.5 }}
							animate={{ opacity: 1, scale: 1 }}
							className="text-[11px] font-body font-semibold text-(--pf-accent) tabular-nums"
						>
							{selected.length}/4 selected
						</motion.span>
					)}
				</AnimatePresence>
			</motion.div>

			{PERSONA_LIST.map((p, i) => {
				const isSelected = selected.includes(i);
				return (
					<motion.div
						key={i}
						variants={fadeSlideUp}
						animate={
							isSelected
								? {
										scale: [1, 1.025, 1],
										transition: { duration: 0.35 },
									}
								: {}
						}
						className={`
              flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all duration-300 cursor-pointer
              ${
								isSelected
									? `border-neutral-400/50 dark:border-neutral-500/50 ${p.color} shadow-md`
									: "border-neutral-200/80 dark:border-neutral-700/40 bg-transparent"
							}
            `}
					>
						<motion.span
							className="text-2xl"
							animate={
								isSelected
									? { scale: [1, 1.4, 1], rotate: [0, 10, -8, 0] }
									: { scale: 1 }
							}
							transition={{ duration: 0.45, ease: smoothEase }}
						>
							{p.emoji}
						</motion.span>
						<div className="flex-1 min-w-0">
							<p className="text-sm font-semibold font-body text-neutral-800 dark:text-neutral-100 truncate">
								{p.name}
							</p>
							<p className="text-[11px] font-body text-neutral-400 dark:text-neutral-500">
								Age {p.age} · Tech: {p.tech}
							</p>
						</div>
						<motion.div
							initial={false}
							animate={
								isSelected
									? {
											scale: 1,
											opacity: 1,
											backgroundColor: "var(--pf-accent)",
										}
									: {
											scale: 0.4,
											opacity: 0.3,
											backgroundColor: "var(--border)",
										}
							}
							transition={spring}
							className="h-5 w-5 rounded-full flex items-center justify-center shrink-0"
						>
							<motion.svg
								width="10"
								height="10"
								viewBox="0 0 10 8"
								fill="none"
								initial={false}
								animate={
									isSelected
										? { pathLength: 1, opacity: 1 }
										: { pathLength: 0, opacity: 0 }
								}
								transition={{ duration: 0.25, delay: isSelected ? 0.1 : 0 }}
							>
								<motion.path
									d="M1 4L3.5 6.5L9 1"
									stroke="white"
									strokeWidth="1.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</motion.svg>
						</motion.div>
					</motion.div>
				);
			})}
		</motion.div>
	);
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Step 3 — AI Analysis
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const ANALYSIS_PERSONAS = [
	{ emoji: "👩‍🎓", name: "Student" },
	{ emoji: "👨‍💼", name: "Executive" },
	{ emoji: "👩‍💻", name: "Engineer" },
	{ emoji: "🏪", name: "Biz Owner" },
];

function AnalysisStep({ isActive }: { isActive: boolean }) {
	const [progress, setProgress] = useState([0, 0, 0, 0]);
	const [done, setDone] = useState([false, false, false, false]);
	const [allDone, setAllDone] = useState(false);
	const [thoughts, setThoughts] = useState(["", "", "", ""]);

	const THOUGHT_SNIPPETS = [
		["Parsing nav links…", "Checking CTA placement…", "✓ Flow mapped"],
		["Reading hero copy…", "Evaluating readability…", "✓ Assessed"],
		["Auditing API routes…", "Checking perf metrics…", "✓ Verified"],
		["Scanning pricing page…", "Checking checkout UX…", "✓ Reviewed"],
	];

	useEffect(() => {
		if (!isActive) {
			setProgress([0, 0, 0, 0]);
			setDone([false, false, false, false]);
			setAllDone(false);
			setThoughts(["", "", "", ""]);
			return;
		}

		const intervals = ANALYSIS_PERSONAS.map((_, i) => {
			const delay = i * 320;
			let val = 0;
			let thoughtIdx = 0;

			return setTimeout(() => {
				// Cycle thoughts
				const thoughtCycle = setInterval(() => {
					setThoughts((prev) => {
						const n = [...prev];
						n[i] = THOUGHT_SNIPPETS[i][thoughtIdx % THOUGHT_SNIPPETS[i].length];
						return n;
					});
					thoughtIdx++;
				}, 700);

				const tick = setInterval(() => {
					val = Math.min(val + Math.random() * 5 + 2.5, 100);
					setProgress((prev) => {
						const next = [...prev];
						next[i] = val;
						return next;
					});
					if (val >= 100) {
						clearInterval(tick);
						clearInterval(thoughtCycle);
						setThoughts((prev) => {
							const n = [...prev];
							n[i] = "✓ Complete";
							return n;
						});
						setDone((prev) => {
							const n = [...prev];
							n[i] = true;
							return n;
						});
					}
				}, 65);
			}, delay);
		});
		return () => intervals.forEach(clearTimeout);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isActive]);

	useEffect(() => {
		if (done.every(Boolean)) {
			const t = setTimeout(() => setAllDone(true), 300);
			return () => clearTimeout(t);
		}
	}, [done]);

	return (
		<motion.div
			className="flex flex-col h-full px-6 sm:px-10 py-8 gap-5"
			variants={staggerContainer}
			initial="hidden"
			animate="show"
		>
			<motion.div
				variants={fadeSlideUp}
				className="flex items-center gap-2.5 mb-1"
			>
				<AnimatePresence mode="wait">
					{!allDone ? (
						<motion.div
							key="spinner"
							animate={{ rotate: 360 }}
							transition={{ repeat: Infinity, duration: 0.85, ease: "linear" }}
							exit={{ opacity: 0, scale: 0 }}
							className="h-4 w-4 rounded-full border-2 border-neutral-300 border-t-(--pf-accent) dark:border-neutral-600 dark:border-t-(--pf-accent)"
						/>
					) : (
						<motion.div
							key="check"
							initial={{ opacity: 0, scale: 0 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={spring}
							className="h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center"
						>
							<svg width="8" height="8" viewBox="0 0 10 8" fill="none">
								<path
									d="M1 4L3.5 6.5L9 1"
									stroke="white"
									strokeWidth="2"
									strokeLinecap="round"
								/>
							</svg>
						</motion.div>
					)}
				</AnimatePresence>
				<p className="text-xs font-body font-medium text-neutral-500 dark:text-neutral-400">
					{allDone ? "All evaluations complete" : "Evaluating in parallel…"}
				</p>
			</motion.div>

			{ANALYSIS_PERSONAS.map((persona, i) => (
				<motion.div key={i} variants={fadeSlideUp} className="space-y-2">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<motion.span
								className="text-xl"
								animate={done[i] ? { scale: [1, 1.25, 1] } : {}}
								transition={{ duration: 0.35 }}
							>
								{persona.emoji}
							</motion.span>
							<div>
								<span className="text-sm font-body font-medium text-neutral-600 dark:text-neutral-300">
									{persona.name}
								</span>
								<AnimatePresence mode="wait">
									<motion.p
										key={thoughts[i]}
										initial={{ opacity: 0, y: 4 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -4 }}
										transition={{ duration: 0.25 }}
										className="text-[10px] font-body text-neutral-400 dark:text-neutral-500 leading-tight"
									>
										{thoughts[i]}
									</motion.p>
								</AnimatePresence>
							</div>
						</div>

						<AnimatePresence mode="wait">
							{done[i] ? (
								<motion.div
									key="done"
									initial={{ opacity: 0, scale: 0.5, x: 8 }}
									animate={{ opacity: 1, scale: 1, x: 0 }}
									transition={spring}
									className="flex items-center gap-1.5"
								>
									<div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
									<span className="text-xs font-body font-semibold text-emerald-600 dark:text-emerald-400">
										Complete
									</span>
								</motion.div>
							) : (
								<motion.span
									key="pct"
									className="text-xs font-body text-neutral-400 tabular-nums font-medium"
								>
									{Math.round(progress[i])}%
								</motion.span>
							)}
						</AnimatePresence>
					</div>

					{/* Progress bar with shimmer */}
					<div className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-700/50 overflow-hidden relative">
						<motion.div
							className={`h-full rounded-full transition-colors duration-500 ${
								done[i]
									? "bg-emerald-500 dark:bg-emerald-400"
									: "bg-(--pf-accent)"
							}`}
							style={{ width: `${progress[i]}%` }}
						/>
						{!done[i] && progress[i] > 5 && (
							<motion.div
								className="absolute inset-y-0 w-12 bg-linear-to-r from-transparent via-white/30 to-transparent"
								animate={{ x: ["-100%", "600%"] }}
								transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
								style={{ left: 0 }}
							/>
						)}
					</div>
				</motion.div>
			))}
		</motion.div>
	);
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Step 4 — Report
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function AnimatedScore({
	target,
	active,
}: {
	target: number;
	active: boolean;
}) {
	const [count, setCount] = useState(0);

	useEffect(() => {
		if (!active) {
			setCount(0);
			return;
		}
		let frame: number;
		let start: number | null = null;
		const duration = 900;
		const animate = (ts: number) => {
			if (!start) start = ts;
			const elapsed = ts - start;
			const progress = Math.min(elapsed / duration, 1);
			const eased = 1 - (1 - progress) * (1 - progress);
			setCount(Math.round(eased * target));
			if (progress < 1) frame = requestAnimationFrame(animate);
		};
		frame = requestAnimationFrame(animate);
		return () => cancelAnimationFrame(frame);
	}, [active, target]);

	return <span className="tabular-nums">{count}</span>;
}

function ReportStep({ isActive }: { isActive: boolean }) {
	const bars = [
		{ label: "Navigation", score: 72, color: "bg-amber-400 dark:bg-amber-500" },
		{ label: "Onboarding", score: 41, color: "bg-red-400 dark:bg-red-500" },
		{ label: "Mobile UX", score: 63, color: "bg-amber-300 dark:bg-amber-400" },
		{
			label: "Accessibility",
			score: 88,
			color: "bg-emerald-400 dark:bg-emerald-500",
		},
	];
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		if (!isActive) {
			setVisible(false);
			return;
		}
		const t = setTimeout(() => setVisible(true), 200);
		return () => clearTimeout(t);
	}, [isActive]);

	return (
		<motion.div
			className="flex flex-col h-full px-6 sm:px-10 py-8 gap-5"
			variants={staggerContainer}
			initial="hidden"
			animate="show"
		>
			<motion.p
				variants={fadeSlideUp}
				className="text-[11px] font-body text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.2em] font-medium mb-1"
			>
				Friction scores by area
			</motion.p>

			{bars.map((bar, i) => (
				<motion.div key={i} variants={fadeSlideUp} className="space-y-2">
					<div className="flex justify-between items-center">
						<span className="text-sm font-body font-medium text-neutral-600 dark:text-neutral-300">
							{bar.label}
						</span>
						<span className="text-sm font-body font-semibold text-neutral-700 dark:text-neutral-200">
							<AnimatedScore target={bar.score} active={visible} />
							/100
						</span>
					</div>
					<div className="h-3 rounded-full bg-neutral-100 dark:bg-neutral-700/50 overflow-hidden">
						<motion.div
							className={`h-full rounded-full ${bar.color}`}
							initial={{ width: 0 }}
							animate={{ width: visible ? `${bar.score}%` : 0 }}
							transition={{
								delay: 0.1 + i * 0.1,
								duration: 0.9,
								ease: smoothEase,
							}}
						/>
					</div>
				</motion.div>
			))}

			<motion.div
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 12 }}
				transition={{ delay: 0.75, duration: 0.5, ease: smoothEase }}
				className="mt-1 p-4 rounded-xl border border-dashed border-neutral-300/80 dark:border-neutral-600/60 bg-neutral-50/80 dark:bg-neutral-800/30 backdrop-blur-sm"
			>
				<motion.div
					animate={visible ? { scale: [1, 1.01, 1] } : {}}
					transition={{ delay: 1.2, duration: 0.6 }}
				>
					<p className="text-[13px] font-body text-neutral-500 dark:text-neutral-400 leading-relaxed">
						<span className="font-semibold text-neutral-700 dark:text-neutral-200">
							⚡ Top conflict:{" "}
						</span>
						Engineer wants more controls; Senior finds same area overwhelming.
					</p>
				</motion.div>
			</motion.div>
		</motion.div>
	);
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Browser Chrome
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function BrowserMock({
	url,
	children,
}: {
	url: string;
	children: React.ReactNode;
}) {
	return (
		<motion.div
			className="w-full rounded-xl overflow-hidden border border-neutral-200/80 dark:border-neutral-700/70 bg-white dark:bg-neutral-900 shadow-[0_32px_80px_-16px_rgba(0,0,0,0.15)] dark:shadow-[0_32px_80px_-16px_rgba(0,0,0,0.6)]"
			whileHover={{ scale: 1.008, rotateX: -1 }}
			transition={{ type: "spring", stiffness: 280, damping: 30 }}
			style={{ transformPerspective: 1200 }}
		>
			{/* Title bar */}
			<div className="flex items-center gap-3 px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-800/50">
				<div className="flex gap-2">
					<div className="h-3 w-3 rounded-full bg-[#FF5F57] shadow-[0_0_0_0.5px_rgba(0,0,0,0.12)]" />
					<div className="h-3 w-3 rounded-full bg-[#FEBC2E] shadow-[0_0_0_0.5px_rgba(0,0,0,0.12)]" />
					<div className="h-3 w-3 rounded-full bg-[#28C840] shadow-[0_0_0_0.5px_rgba(0,0,0,0.12)]" />
				</div>
				<div className="flex-1 flex justify-center">
					<div className="flex items-center gap-2 bg-white dark:bg-neutral-700/40 border border-neutral-200/80 dark:border-neutral-600/40 rounded-lg px-4 py-1.5 max-w-sm w-full">
						<svg
							width="11"
							height="11"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							className="text-neutral-400 shrink-0"
						>
							<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
						</svg>
						<AnimatePresence mode="wait">
							<motion.span
								key={url}
								initial={{ opacity: 0, y: 6 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -6 }}
								transition={{ duration: 0.25, ease: smoothEase }}
								className="text-xs font-body text-neutral-500 dark:text-neutral-400 truncate"
							>
								{url}
							</motion.span>
						</AnimatePresence>
					</div>
				</div>
				<div className="w-[62px]" />
			</div>

			{/* Content */}
			<div className="min-h-[400px] sm:min-h-[400px] relative overflow-hidden">
				{children}
			</div>
		</motion.div>
	);
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Steps config
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const STEPS = [
	{
		id: "url",
		title: "Drop in any live URL",
		description:
			"PersonaForge opens the site in a real browser, crawls pages, captures screenshots, and maps every interaction point.",
		browserUrl: "app.personaforge.ai/new",
	},
	{
		id: "personas",
		title: "Assemble your test audience",
		description:
			"Choose from 8 prebuilt archetypes or build custom personas with precise demographics, goals and frustrations.",
		browserUrl: "app.personaforge.ai/personas",
	},
	{
		id: "analysis",
		title: "Each persona explores independently",
		description:
			"Every persona browses the site, analyses it through their unique lens, and generates evidence-backed findings in parallel.",
		browserUrl: "app.personaforge.ai/analysis/running",
	},
	{
		id: "report",
		title: "Conflicts, friction scores, fixes",
		description:
			"A full dashboard shows persona disagreements, friction scores, sentiment breakdowns, and prioritised recommendations.",
		browserUrl: "app.personaforge.ai/report/abc123",
	},
];

function StepContent({
	stepIndex,
	isActive,
}: {
	stepIndex: number;
	isActive: boolean;
}) {
	switch (stepIndex) {
		case 0:
			return <SubmitStep isActive={isActive} />;
		case 1:
			return <PersonaStep isActive={isActive} />;
		case 2:
			return <AnalysisStep isActive={isActive} />;
		case 3:
			return <ReportStep isActive={isActive} />;
		default:
			return null;
	}
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Main Section
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export function HowItWorks() {
	const [activeStep, setActiveStep] = useState(0);
	const [prevStep, setPrevStep] = useState(0);
	const [autoplay, setAutoplay] = useState(true);
	const sectionRef = useRef<HTMLDivElement>(null);
	const isInView = useInView(sectionRef, { once: false, margin: "-15%" });

	// Start/stop autoplay based on viewport
	useEffect(() => {
		if (!isInView || !autoplay) return;
		const t = setInterval(() => {
			setActiveStep((prev) => {
				setPrevStep(prev);
				return (prev + 1) % STEPS.length;
			});
		}, 5200);
		return () => clearInterval(t);
	}, [isInView, autoplay]);

	// Pause animations when out of view
	const effectivelyActive = isInView;

	const step = STEPS[activeStep];
	const direction = activeStep > prevStep ? 1 : -1;

	const goToStep = useCallback(
		(i: number) => {
			setPrevStep(activeStep);
			setActiveStep(i);
			setAutoplay(false);
		},
		[activeStep],
	);

	return (
		<section
			id="how-it-works"
			ref={sectionRef}
			className="relative w-full py-28 sm:py-36 px-4 overflow-hidden"
		>
			<NoiseTexture />

			{/* Grid */}
			<div
				className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
				style={{
					backgroundImage:
						"linear-gradient(var(--color-neutral-400,#aaa) 1px, transparent 1px), linear-gradient(to right, var(--color-neutral-400,#aaa) 1px, transparent 1px)",
					backgroundSize: "40px 40px",
				}}
			/>

			<div className="relative mx-auto max-w-6xl z-10">
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: 24 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.65, ease: smoothEase }}
					className="text-center mb-16 sm:mb-20"
				>
					<p className="font-body text-xs tracking-[0.2em] uppercase text-neutral-400 dark:text-neutral-500 mb-3 font-medium">
						How it works
					</p>
					<h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
						From URL to insights in minutes
					</h2>
					<p className="mt-4 font-body text-[15px] text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto leading-relaxed">
						Four steps. No recruitment. No scheduling. Just answers.
					</p>
				</motion.div>

				{/* Layout */}
				<div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-14 items-start">
					{/* Step tabs — left */}
					<div className="lg:col-span-2 flex flex-col gap-1.5">
						{STEPS.map((s, i) => {
							const isActive = activeStep === i;
							return (
								<motion.button
									key={s.id}
									onClick={() => goToStep(i)}
									className={`
                    relative text-left px-5 py-5 rounded-xl border transition-colors duration-200 group cursor-pointer
                    ${
											isActive
												? "border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800/60 shadow-sm"
												: "border-transparent hover:border-neutral-200/60 dark:hover:border-neutral-700/40"
										}
                  `}
									whileHover={{ x: isActive ? 0 : 4 }}
									transition={{ type: "spring", stiffness: 400, damping: 30 }}
								>
									<AnimatePresence>
										{isActive && (
											<motion.div
												layoutId="activeStepIndicator"
												className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 rounded-full bg-(--pf-accent)"
												initial={{ opacity: 0, scaleY: 0 }}
												animate={{ opacity: 1, scaleY: 1 }}
												exit={{ opacity: 0, scaleY: 0 }}
												transition={{ duration: 0.3, ease: smoothEase }}
											/>
										)}
									</AnimatePresence>

									<div className="flex items-center gap-3 mb-1">
										<span
											className={`font-body text-xs tabular-nums font-semibold transition-colors duration-200 ${
												isActive
													? "text-(--pf-accent)"
													: "text-neutral-300 dark:text-neutral-600"
											}`}
										>
											{String(i + 1).padStart(2, "0")}
										</span>
										<span
											className={`font-heading text-sm sm:text-[15px] font-semibold transition-colors duration-200 ${
												isActive
													? "text-neutral-900 dark:text-neutral-50"
													: "text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-600 dark:group-hover:text-neutral-400"
											}`}
										>
											{s.title}
										</span>
									</div>

									<AnimatePresence>
										{isActive && (
											<motion.p
												initial={{ opacity: 0, height: 0 }}
												animate={{ opacity: 1, height: "auto" }}
												exit={{ opacity: 0, height: 0 }}
												transition={{ duration: 0.35, ease: smoothEase }}
												className="font-body text-[13px] text-neutral-500 dark:text-neutral-400 leading-relaxed pl-8 overflow-hidden"
											>
												{s.description}
											</motion.p>
										)}
									</AnimatePresence>

									{isActive && autoplay && isInView && (
										<div className="mt-3 pl-8">
											<div className="h-[2px] rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
												<motion.div
													className="h-full bg-(--pf-accent) rounded-full"
													initial={{ width: "0%" }}
													animate={{ width: "100%" }}
													transition={{ duration: 5.2, ease: "linear" }}
													key={`progress-${activeStep}`}
												/>
											</div>
										</div>
									)}
								</motion.button>
							);
						})}
					</div>

					{/* Browser demo — right */}
					<div className="lg:col-span-3">
						<AnimatePresence mode="wait" custom={direction}>
							<motion.div
								key={activeStep}
								custom={direction}
								initial={{
									opacity: 0,
									y: direction * 32,
									scale: 0.97,
									filter: "blur(6px)",
								}}
								animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
								exit={{
									opacity: 0,
									y: direction * -24,
									scale: 0.97,
									filter: "blur(4px)",
								}}
								transition={{ duration: 0.5, ease: smoothEase }}
							>
								<BrowserMock url={step.browserUrl}>
									<StepContent
										stepIndex={activeStep}
										isActive={effectivelyActive}
									/>
								</BrowserMock>
							</motion.div>
						</AnimatePresence>

						{/* Dots */}
						<div className="flex justify-center gap-2.5 mt-7">
							{STEPS.map((_, i) => (
								<motion.button
									key={i}
									onClick={() => goToStep(i)}
									className="relative h-2 rounded-full cursor-pointer"
									animate={{ width: activeStep === i ? 32 : 8 }}
									transition={{ type: "spring", stiffness: 350, damping: 28 }}
									whileHover={{ scale: 1.2 }}
									whileTap={{ scale: 0.9 }}
								>
									<motion.div
										className="absolute inset-0 rounded-full"
										animate={{
											backgroundColor:
												activeStep === i ? "var(--pf-accent)" : "var(--border)",
										}}
										transition={{ duration: 0.25 }}
									/>
								</motion.button>
							))}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
