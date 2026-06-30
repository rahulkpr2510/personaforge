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
   Shared animation presets
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const spring = { type: "spring" as const, stiffness: 400, damping: 24 };
const smoothEase = [0.16, 1, 0.3, 1] as const;

const staggerContainer: Variants = {
	hidden: {},
	show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const fadeSlideUp: Variants = {
	hidden: { opacity: 0, y: 14, filter: "blur(4px)" },
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
function SubmitStep() {
	const [typed, setTyped] = useState("");
	const [done, setDone] = useState(false);
	const [scanning, setScanning] = useState(false);
	const full = "https://yourproduct.com";

	useEffect(() => {
		setTyped("");
		setDone(false);
		setScanning(false);
		let i = 0;
		const t = setInterval(() => {
			i++;
			setTyped(full.slice(0, i));
			if (i >= full.length) {
				clearInterval(t);
				setTimeout(() => setScanning(true), 400);
				setTimeout(() => {
					setScanning(false);
					setDone(true);
				}, 2200);
			}
		}, 50);
		return () => clearInterval(t);
	}, []);

	return (
		<motion.div
			className="flex flex-col items-center justify-center h-full gap-7 px-8 sm:px-12"
			variants={staggerContainer}
			initial="hidden"
			animate="show"
		>
			<motion.p
				variants={fadeSlideUp}
				className="text-[11px] font-body text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.2em] font-medium"
			>
				Submit your website
			</motion.p>

			<motion.div variants={fadeSlideUp} className="w-full max-w-md">
				<div className="flex items-center gap-3 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/80 dark:bg-neutral-800/50 px-5 py-4 backdrop-blur-sm">
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
							animate={{ opacity: [1, 0] }}
							transition={{ repeat: Infinity, duration: 0.55 }}
							className="inline-block w-[2px] h-[18px] bg-(--pf-accent) ml-0.5 align-middle rounded-full"
						/>
					</span>
				</div>
			</motion.div>

			{/* Scanning state */}
			<AnimatePresence mode="wait">
				{scanning && (
					<motion.div
						key="scanning"
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -6 }}
						transition={{ duration: 0.3, ease: smoothEase }}
						className="flex items-center gap-3"
					>
						<motion.div
							animate={{ rotate: 360 }}
							transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
							className="h-4 w-4 rounded-full border-2 border-neutral-300 border-t-(--pf-accent) dark:border-neutral-600 dark:border-t-(--pf-accent)"
						/>
						<div className="flex flex-col gap-0.5">
							<span className="text-xs font-body font-medium text-neutral-600 dark:text-neutral-300">
								Scanning pages…
							</span>
							<motion.div className="h-1 w-32 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
								<motion.div
									className="h-full rounded-full bg-(--pf-accent)"
									initial={{ width: "0%" }}
									animate={{ width: "100%" }}
									transition={{ duration: 1.8, ease: "easeInOut" }}
								/>
							</motion.div>
						</div>
					</motion.div>
				)}

				{done && (
					<motion.button
						key="cta"
						initial={{ opacity: 0, scale: 0.8, y: 10 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						transition={{ type: "spring", stiffness: 350, damping: 20 }}
						className="flex items-center gap-2 px-8 py-3 rounded-xl bg-neutral-900 dark:bg-neutral-50 text-white dark:text-neutral-900 text-sm font-semibold font-body shadow-lg shadow-neutral-900/10 dark:shadow-neutral-50/10"
					>
						<motion.svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2.5"
							strokeLinecap="round"
							strokeLinejoin="round"
							initial={{ pathLength: 0 }}
							animate={{ pathLength: 1 }}
							transition={{ duration: 0.4, delay: 0.2 }}
						>
							<polyline points="20 6 9 17 4 12" />
						</motion.svg>
						Start analysis
					</motion.button>
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

function PersonaStep() {
	const [selected, setSelected] = useState<number[]>([]);

	useEffect(() => {
		setSelected([]);
		const delays = [400, 1000, 1600, 2300];
		const timers = delays.map((d, i) =>
			setTimeout(() => setSelected((prev) => [...prev, i]), d),
		);
		return () => timers.forEach(clearTimeout);
	}, []);

	return (
		<motion.div
			className="flex flex-col h-full px-6 sm:px-10 py-7 sm:py-9 gap-3"
			variants={staggerContainer}
			initial="hidden"
			animate="show"
		>
			<motion.div
				variants={fadeSlideUp}
				className="flex items-center justify-between mb-2"
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
						animate={isSelected ? { scale: [1, 1.02, 1] } : {}}
						transition={isSelected ? { duration: 0.3 } : undefined}
						className={`
              flex items-center gap-4 px-5 py-4 rounded-2xl border transition-all duration-300 cursor-pointer
              ${
								isSelected
									? `border-neutral-400/60 dark:border-neutral-500/60 ${p.color} shadow-sm`
									: "border-neutral-200/80 dark:border-neutral-700/40 bg-transparent hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20"
							}
            `}
					>
						<motion.span
							className="text-2xl"
							animate={
								isSelected
									? { scale: [1, 1.35, 1], rotate: [0, 8, -8, 0] }
									: { scale: 1 }
							}
							transition={{ duration: 0.4, ease: smoothEase }}
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

function AnalysisStep() {
	const [progress, setProgress] = useState([0, 0, 0, 0]);
	const [done, setDone] = useState([false, false, false, false]);
	const [allDone, setAllDone] = useState(false);

	useEffect(() => {
		setProgress([0, 0, 0, 0]);
		setDone([false, false, false, false]);
		setAllDone(false);

		const intervals = ANALYSIS_PERSONAS.map((_, i) => {
			const delay = i * 350;
			let val = 0;
			return setTimeout(() => {
				const tick = setInterval(() => {
					val = Math.min(val + Math.random() * 6 + 2, 100);
					setProgress((prev) => {
						const next = [...prev];
						next[i] = val;
						return next;
					});
					if (val >= 100) {
						clearInterval(tick);
						setDone((prev) => {
							const n = [...prev];
							n[i] = true;
							return n;
						});
					}
				}, 70);
			}, delay);
		});
		return () => intervals.forEach(clearTimeout);
	}, []);

	useEffect(() => {
		if (done.every(Boolean)) {
			const t = setTimeout(() => setAllDone(true), 300);
			return () => clearTimeout(t);
		}
	}, [done]);

	return (
		<motion.div
			className="flex flex-col h-full px-6 sm:px-10 py-7 sm:py-9 gap-5"
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
							transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
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
								animate={done[i] ? { scale: [1, 1.2, 1] } : {}}
								transition={{ duration: 0.3 }}
							>
								{persona.emoji}
							</motion.span>
							<span className="text-sm font-body font-medium text-neutral-600 dark:text-neutral-300">
								{persona.name}
							</span>
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
					<div className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-700/50 overflow-hidden">
						<motion.div
							className={`h-full rounded-full transition-colors duration-500 ${
								done[i]
									? "bg-emerald-500 dark:bg-emerald-400"
									: "bg-neutral-500 dark:bg-neutral-400"
							}`}
							style={{ width: `${progress[i]}%` }}
						/>
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
		const duration = 800;
		const animate = (ts: number) => {
			if (!start) start = ts;
			const elapsed = ts - start;
			const progress = Math.min(elapsed / duration, 1);
			// ease-out quad
			const eased = 1 - (1 - progress) * (1 - progress);
			setCount(Math.round(eased * target));
			if (progress < 1) frame = requestAnimationFrame(animate);
		};
		frame = requestAnimationFrame(animate);
		return () => cancelAnimationFrame(frame);
	}, [active, target]);

	return <span className="tabular-nums">{count}</span>;
}

function ReportStep() {
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
		setVisible(false);
		const t = setTimeout(() => setVisible(true), 250);
		return () => clearTimeout(t);
	}, []);

	return (
		<motion.div
			className="flex flex-col h-full px-6 sm:px-10 py-7 sm:py-9 gap-5"
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
					<div className="h-2.5 rounded-full bg-neutral-100 dark:bg-neutral-700/50 overflow-hidden">
						<motion.div
							className={`h-full rounded-full ${bar.color}`}
							initial={{ width: 0 }}
							animate={{ width: visible ? `${bar.score}%` : 0 }}
							transition={{
								delay: 0.15 + i * 0.12,
								duration: 0.8,
								ease: smoothEase,
							}}
						/>
					</div>
				</motion.div>
			))}

			<motion.div
				variants={fadeSlideUp}
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 10 }}
				transition={{ delay: 0.8, duration: 0.45, ease: smoothEase }}
				className="mt-1 p-4 rounded-xl border border-dashed border-neutral-300/80 dark:border-neutral-600/60 bg-neutral-50/80 dark:bg-neutral-800/30 backdrop-blur-sm"
			>
				<p className="text-[13px] font-body text-neutral-500 dark:text-neutral-400 leading-relaxed">
					<span className="font-semibold text-neutral-700 dark:text-neutral-200">
						⚡ Top conflict:{" "}
					</span>
					Engineer wants more controls; Senior finds same area overwhelming.
				</p>
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
		<div className="w-full rounded-2xl overflow-hidden border border-neutral-200/80 dark:border-neutral-700/70 bg-white dark:bg-neutral-900 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.12)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)]">
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
				<div className="w-[62px]" /> {/* Balance for the dots on left */}
			</div>
			{/* Content — tall enough to show everything */}
			<div className="min-h-[420px] sm:min-h-[460px] relative overflow-hidden">
				{children}
			</div>
		</div>
	);
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Step data (defined after components so JSX references resolve)
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

/** Returns the step content component — remounts on activeStep change via key */
function StepContent({ stepIndex }: { stepIndex: number }) {
	switch (stepIndex) {
		case 0:
			return <SubmitStep />;
		case 1:
			return <PersonaStep />;
		case 2:
			return <AnalysisStep />;
		case 3:
			return <ReportStep />;
		default:
			return null;
	}
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Main Section
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export function HowItWorks() {
	const [activeStep, setActiveStep] = useState(0);
	const [autoplay, setAutoplay] = useState(true);
	const sectionRef = useRef<HTMLDivElement>(null);
	const isInView = useInView(sectionRef, { once: false, margin: "-20%" });

	useEffect(() => {
		if (!isInView || !autoplay) return;
		const t = setInterval(() => {
			setActiveStep((prev) => (prev + 1) % STEPS.length);
		}, 5000);
		return () => clearInterval(t);
	}, [isInView, autoplay]);

	const step = STEPS[activeStep];

	const goToStep = useCallback((i: number) => {
		setActiveStep(i);
		setAutoplay(false);
	}, []);

	return (
		<section
			id="how-it-works"
			ref={sectionRef}
			className="relative w-full py-28 sm:py-36 px-4 overflow-hidden"
		>
			<NoiseTexture />

			{/* Grid background */}
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
					transition={{ duration: 0.6, ease: smoothEase }}
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
									{/* Active indicator bar */}
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

									{/* Autoplay progress */}
									{isActive && autoplay && (
										<div className="mt-3 pl-8">
											<div className="h-[2px] rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
												<motion.div
													className="h-full bg-(--pf-accent) rounded-full"
													initial={{ width: "0%" }}
													animate={{ width: "100%" }}
													transition={{ duration: 5, ease: "linear" }}
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
						<AnimatePresence mode="wait">
							<motion.div
								key={activeStep}
								initial={{
									opacity: 0,
									y: 28,
									scale: 0.96,
									filter: "blur(6px)",
								}}
								animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
								exit={{ opacity: 0, y: -20, scale: 0.97, filter: "blur(4px)" }}
								transition={{ duration: 0.55, ease: smoothEase }}
							>
								<BrowserMock url={step.browserUrl}>
									<StepContent stepIndex={activeStep} />
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
