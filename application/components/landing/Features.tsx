"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useInView } from "motion/react";
import { NoiseTexture } from "@/components/ui/NoiseTexture";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Shared
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const ease = [0.16, 1, 0.3, 1] as const;

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   1. SYNTHETIC PERSONAS
   Marquee of persona cards (like Aceternity's
   infinite moving cards / team marquee)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const PERSONAS = [
	{
		emoji: "👩‍🎓",
		name: "Maya",
		role: "Student",
		fluency: "Low",
		color: "#6366f1",
	},
	{
		emoji: "👨‍💼",
		name: "Richard",
		role: "Enterprise Exec",
		fluency: "Medium",
		color: "#f59e0b",
	},
	{
		emoji: "👩‍💻",
		name: "Priya",
		role: "Senior Dev",
		fluency: "High",
		color: "#10b981",
	},
	{
		emoji: "🏪",
		name: "Carlos",
		role: "SMB Owner",
		fluency: "Low",
		color: "#ec4899",
	},
	{
		emoji: "🎮",
		name: "Jordan",
		role: "Power User",
		fluency: "High",
		color: "#8b5cf6",
	},
];

function PersonaCard({ p }: { p: (typeof PERSONAS)[0] }) {
	return (
		<div className="shrink-0 flex items-center gap-2.5 bg-background border border-border rounded-xl px-3 py-2 mx-1.5 shadow-sm">
			<div
				className="h-8 w-8 rounded-full flex items-center justify-center text-base border"
				style={{ backgroundColor: `${p.color}22`, borderColor: `${p.color}55` }}
			>
				{p.emoji}
			</div>
			<div>
				<p className="text-[11px] font-semibold text-foreground font-heading leading-none">
					{p.name}
				</p>
				<p className="text-[10px] text-muted-foreground font-body mt-0.5">
					{p.role}
				</p>
			</div>
			<div
				className="ml-1 text-[9px] font-mono px-1.5 py-0.5 rounded-full border"
				style={{
					color: p.color,
					borderColor: `${p.color}55`,
					backgroundColor: `${p.color}15`,
				}}
			>
				{p.fluency}
			</div>
		</div>
	);
}

function PersonasIllustration({ hovered }: { hovered: boolean }) {
	const doubled = [...PERSONAS, ...PERSONAS];
	return (
		<div className="w-full h-full flex flex-col gap-2.5 justify-center overflow-hidden py-2">
			{/* Row 1 — scrolls left */}
			<div className="relative overflow-hidden">
				<motion.div
					className="flex"
					animate={{ x: ["0%", "-50%"] }}
					transition={{
						duration: hovered ? 8 : 18,
						ease: "linear",
						repeat: Infinity,
					}}
				>
					{doubled.map((p, i) => (
						<PersonaCard key={i} p={p} />
					))}
				</motion.div>
			</div>
			{/* Row 2 — scrolls right */}
			<div className="relative overflow-hidden">
				<motion.div
					className="flex"
					animate={{ x: ["-50%", "0%"] }}
					transition={{
						duration: hovered ? 10 : 22,
						ease: "linear",
						repeat: Infinity,
					}}
				>
					{[...doubled].reverse().map((p, i) => (
						<PersonaCard key={i} p={p} />
					))}
				</motion.div>
			</div>
		</div>
	);
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   2. REAL BROWSER CRAWLING  — fixed
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const SITE_TREE = [
	{ path: "/", depth: 0 },
	{ path: "/pricing", depth: 1 },
	{ path: "/features", depth: 1 },
	{ path: "/blog", depth: 1 },
	{ path: "/login", depth: 2 },
	{ path: "/docs", depth: 2 },
];

function CrawlIllustration({ hovered }: { hovered: boolean }) {
	const [activeIdx, setActiveIdx] = useState(0);
	const [doneSet, setDoneSet] = useState<Set<number>>(new Set());
	const idxRef = useRef(0); // single source of truth — no stale closures
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const scheduleNext = (currentIdx: number, fast: boolean) => {
		const dwell = fast ? 550 : 1000; // how long a page stays "active" before marking done
		const pause = fast ? 300 : 600; // gap before moving to next

		// Mark current as done after dwell
		timerRef.current = setTimeout(() => {
			setDoneSet((prev) => new Set(prev).add(currentIdx));

			const nextIdx = currentIdx + 1;

			if (nextIdx < SITE_TREE.length) {
				// Move to next page after a short pause
				timerRef.current = setTimeout(() => {
					idxRef.current = nextIdx;
					setActiveIdx(nextIdx);
					scheduleNext(nextIdx, fast);
				}, pause);
			} else {
				// All done — hold for a moment then restart from scratch
				timerRef.current = setTimeout(
					() => {
						idxRef.current = 0;
						setActiveIdx(0);
						setDoneSet(new Set()); // clear only here, once per full cycle
						scheduleNext(0, fast);
					},
					fast ? 1200 : 2000,
				);
			}
		}, dwell);
	};

	useEffect(() => {
		// Clear any running timer and restart from current state when hovered changes
		if (timerRef.current) clearTimeout(timerRef.current);
		idxRef.current = 0;
		setActiveIdx(0);
		setDoneSet(new Set());
		scheduleNext(0, hovered);

		return () => {
			if (timerRef.current) clearTimeout(timerRef.current);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [hovered]);

	return (
		<div className="w-full h-full flex items-center justify-center p-3">
			<div className="w-full max-w-[220px] rounded-xl overflow-hidden border border-border bg-[#1a1a1a] shadow-xl">
				{/* Browser chrome */}
				<div className="bg-neutral-800/90 px-3 py-2 flex items-center gap-2 border-b border-neutral-700/40">
					<div className="flex gap-1">
						<div className="h-2 w-2 rounded-full bg-[#FF5F57]" />
						<div className="h-2 w-2 rounded-full bg-[#FEBC2E]" />
						<div className="h-2 w-2 rounded-full bg-[#28C840]" />
					</div>
					<div className="flex-1 bg-neutral-700/50 rounded px-2 py-0.5 flex items-center gap-1.5 overflow-hidden">
						<motion.div
							className="h-1.5 w-1.5 rounded-full shrink-0"
							animate={{ backgroundColor: ["#6366f1", "#10b981", "#6366f1"] }}
							transition={{ duration: 2, repeat: Infinity }}
						/>
						<AnimatePresence mode="wait">
							<motion.span
								key={activeIdx}
								initial={{ opacity: 0, y: 3 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -3 }}
								transition={{ duration: 0.2 }}
								className="text-[9px] font-mono text-neutral-400 truncate"
							>
								yourproduct.com{SITE_TREE[activeIdx].path}
							</motion.span>
						</AnimatePresence>
					</div>
				</div>

				{/* Progress bar — runs while page is "active" */}
				<motion.div
					className="h-0.5 bg-indigo-500 origin-left"
					key={activeIdx} // re-mounts on each new page so it always sweeps fresh
					initial={{ scaleX: 0 }}
					animate={{ scaleX: [0, 0.6, 1] }}
					transition={{
						duration: hovered ? 0.5 : 0.9,
						ease: [0.16, 1, 0.3, 1],
					}}
				/>

				{/* Sitemap tree */}
				<div className="p-3 space-y-1.5">
					<p className="text-[8px] font-mono uppercase tracking-widest text-neutral-500 mb-2">
						Sitemap
					</p>
					{SITE_TREE.map((node, i) => {
						const isDone = doneSet.has(i);
						const isActive = activeIdx === i && !isDone;
						const isPending = !isDone && !isActive;

						return (
							<div
								key={i}
								className="flex items-center gap-2"
								style={{ paddingLeft: node.depth * 12 }}
							>
								{/* Status dot */}
								<motion.div
									className="h-1.5 w-1.5 rounded-full shrink-0"
									animate={
										isActive
											? { backgroundColor: "#6366f1", scale: [1, 1.7, 1] }
											: isDone
												? { backgroundColor: "#10b981", scale: 1 }
												: { backgroundColor: "#2a2a2a", scale: 1 }
									}
									transition={
										isActive
											? {
													scale: { repeat: Infinity, duration: 0.7 },
													backgroundColor: { duration: 0.2 },
												}
											: { duration: 0.3 }
									}
								/>

								{/* Path label */}
								<motion.span
									className="text-[9px] font-mono"
									animate={{
										color: isActive
											? "#a5b4fc"
											: isDone
												? "#6b7280"
												: "#3f3f46",
									}}
									transition={{ duration: 0.3 }}
								>
									{node.path}
								</motion.span>

								{/* Tick — only renders once isDone, never disappears */}
								{isDone && (
									<motion.span
										initial={{ opacity: 0, scale: 0 }}
										animate={{ opacity: 1, scale: 1 }}
										transition={{ type: "spring", stiffness: 420, damping: 22 }}
										className="text-[9px] text-emerald-500 ml-auto"
									>
										✓
									</motion.span>
								)}
							</div>
						);
					})}
				</div>

				{/* Footer */}
				<div className="border-t border-neutral-700/40 px-3 py-2 flex items-center justify-between">
					<span className="text-[9px] font-mono text-neutral-600">
						{doneSet.size} / {SITE_TREE.length} pages
					</span>
					<motion.span
						className="text-[9px] font-mono text-indigo-400"
						animate={{ opacity: [1, 0.3, 1] }}
						transition={{ repeat: Infinity, duration: 1.4 }}
					>
						crawling…
					</motion.span>
				</div>
			</div>
		</div>
	);
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   3. VISION ANALYSIS
   Screenshots sliding in with annotation badges
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const ANNOTATIONS = [
	{ label: "Low contrast", x: "18%", y: "22%", color: "bg-red-500" },
	{ label: "Missing alt", x: "60%", y: "45%", color: "bg-amber-500" },
	{ label: "Dense layout", x: "35%", y: "68%", color: "bg-indigo-500" },
];

function VisionIllustration({ hovered }: { hovered: boolean }) {
	const [shown, setShown] = useState<number[]>([]);
	const cycleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const runCycle = () => {
		setShown([]);
		ANNOTATIONS.forEach((_, i) => {
			cycleRef.current = setTimeout(
				() => {
					setShown((p) => [...p, i]);
				},
				400 + i * (hovered ? 400 : 700),
			);
		});
		cycleRef.current = setTimeout(
			runCycle,
			ANNOTATIONS.length * (hovered ? 400 : 700) + 1400,
		);
	};

	useEffect(() => {
		runCycle();
		return () => clearTimeout(cycleRef.current!);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [hovered]);

	return (
		<div className="w-full h-full flex items-center justify-center p-3">
			<div className="relative w-full max-w-[200px] h-[110px] rounded-xl border border-neutral-700/50 bg-[#1e1e1e] overflow-hidden">
				{/* Mock screenshot skeleton */}
				<div className="absolute inset-0 p-2.5 space-y-1.5">
					<div className="h-3 bg-neutral-700/60 rounded w-2/3" />
					<div className="h-2 bg-neutral-700/40 rounded w-full" />
					<div className="h-2 bg-neutral-700/40 rounded w-5/6" />
					<div className="flex gap-1.5 mt-1">
						<div className="h-10 w-16 bg-neutral-700/50 rounded" />
						<div className="flex-1 space-y-1">
							<div className="h-2 bg-neutral-700/40 rounded w-full" />
							<div className="h-2 bg-neutral-700/40 rounded w-3/4" />
							<div className="h-2 bg-neutral-700/40 rounded w-full" />
						</div>
					</div>
					<div className="h-2 bg-neutral-700/40 rounded w-4/5" />
				</div>

				{/* Scan line */}
				<motion.div
					className="absolute left-0 right-0 h-[1.5px] bg-linear-to-r from-transparent via-indigo-400/70 to-transparent pointer-events-none z-10"
					animate={{ top: ["0%", "100%", "0%"] }}
					transition={{
						duration: hovered ? 1.5 : 3,
						repeat: Infinity,
						ease: "linear",
					}}
				/>

				{/* Annotation badges */}
				{ANNOTATIONS.map((ann, i) => (
					<AnimatePresence key={i}>
						{shown.includes(i) && (
							<motion.div
								className={`absolute flex items-center gap-1 ${ann.color} text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-lg z-20`}
								style={{ left: ann.x, top: ann.y }}
								initial={{ opacity: 0, scale: 0, y: 4 }}
								animate={{ opacity: 1, scale: 1, y: 0 }}
								exit={{ opacity: 0, scale: 0.8 }}
								transition={{ type: "spring", stiffness: 400, damping: 22 }}
							>
								<div className="h-1 w-1 rounded-full bg-white/70" />
								{ann.label}
							</motion.div>
						)}
					</AnimatePresence>
				))}
			</div>
		</div>
	);
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   4. EVIDENCE METRICS
   Clean metric rows that count up on loop
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const METRICS = [
	{ label: "Input fields", value: 11, unit: "fields", color: "#f59e0b" },
	{ label: "Avg time on page", value: 4.2, unit: "sec", color: "#6366f1" },
	{ label: "Nav depth", value: 3, unit: "clicks", color: "#ec4899" },
	{ label: "Total issues", value: 27, unit: "found", color: "#10b981" },
];

function MetricsIllustration({ hovered }: { hovered: boolean }) {
	const [vals, setVals] = useState(METRICS.map(() => 0));
	const cycleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const rafRefs = useRef<number[]>([]);

	const runCycle = () => {
		setVals(METRICS.map(() => 0));
		rafRefs.current.forEach(cancelAnimationFrame);
		const dur = hovered ? 500 : 900;

		METRICS.forEach((m, i) => {
			let startTs: number | null = null;
			const delay = i * (hovered ? 80 : 140);
			const tick = (ts: number) => {
				if (!startTs) startTs = ts;
				const elapsed = ts - startTs - delay;
				if (elapsed < 0) {
					rafRefs.current[i] = requestAnimationFrame(tick);
					return;
				}
				const p = Math.min(elapsed / dur, 1);
				const eased = 1 - (1 - p) ** 3;
				setVals((prev) => {
					const n = [...prev];
					n[i] = parseFloat((eased * m.value).toFixed(1));
					return n;
				});
				if (p < 1) rafRefs.current[i] = requestAnimationFrame(tick);
				else if (i === METRICS.length - 1)
					cycleRef.current = setTimeout(runCycle, hovered ? 800 : 1600);
			};
			rafRefs.current[i] = requestAnimationFrame(tick);
		});
	};

	useEffect(() => {
		runCycle();
		return () => {
			clearTimeout(cycleRef.current!);
			rafRefs.current.forEach(cancelAnimationFrame);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [hovered]);

	return (
		<div className="w-full h-full flex flex-col justify-center gap-1.5 px-4 py-2">
			{METRICS.map((m, i) => (
				<div
					key={i}
					className="flex items-center justify-between rounded-lg bg-muted/50 border border-border px-3 py-2"
				>
					<span className="text-[11px] font-body text-muted-foreground">
						{m.label}
					</span>
					<span
						className="font-mono font-bold text-sm tabular-nums"
						style={{ color: m.color }}
					>
						{vals[i]}
						<span className="text-[9px] font-normal text-muted-foreground/60 ml-0.5">
							{m.unit}
						</span>
					</span>
				</div>
			))}
		</div>
	);
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   5. FRICTION SCORES
   Bar chart race with sorted ranking
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const FRICTION_BASE = [
	{ label: "Onboarding", base: 82, color: "bg-red-500" },
	{ label: "Checkout", base: 71, color: "bg-orange-400" },
	{ label: "Navigation", base: 57, color: "bg-amber-500" },
	{ label: "Mobile UX", base: 44, color: "bg-yellow-500" },
];

function FrictionIllustration({ hovered }: { hovered: boolean }) {
	const [scores, setScores] = useState(FRICTION_BASE.map((d) => d.base));
	const cycleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		const tick = () => {
			setScores(
				FRICTION_BASE.map((d) =>
					Math.max(
						15,
						Math.min(99, d.base + Math.floor(Math.random() * 18 - 9)),
					),
				),
			);
			cycleRef.current = setTimeout(tick, hovered ? 1000 : 2000);
		};
		cycleRef.current = setTimeout(tick, 300);
		return () => clearTimeout(cycleRef.current!);
	}, [hovered]);

	return (
		<div className="w-full h-full flex flex-col justify-center gap-2.5 px-4 py-2">
			{FRICTION_BASE.map((d, i) => (
				<div key={i} className="space-y-1">
					<div className="flex justify-between items-center">
						<span className="text-[11px] font-body text-muted-foreground">
							{d.label}
						</span>
						<span className="text-[11px] font-mono font-bold text-foreground tabular-nums">
							{scores[i]}
						</span>
					</div>
					<div className="h-2 rounded-full bg-muted overflow-hidden">
						<motion.div
							className={`h-full rounded-full ${d.color}`}
							animate={{ width: `${scores[i]}%` }}
							transition={{ duration: 0.85, ease }}
						/>
					</div>
				</div>
			))}
		</div>
	);
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   6. FOCUS GROUP CHAT
   Clean spring-animated chat thread, loops
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const CHAT = [
	{
		emoji: "👩‍🎓",
		text: "Pricing page is confusing 😤",
		side: "left",
		col: "bg-indigo-500/15 border-indigo-500/30",
	},
	{
		emoji: "👨‍💼",
		text: "I found it straightforward, actually.",
		side: "right",
		col: "bg-amber-500/15 border-amber-500/30",
	},
	{
		emoji: "👩‍💻",
		text: "Needs a feature comparison table.",
		side: "left",
		col: "bg-emerald-500/15 border-emerald-500/30",
	},
	{
		emoji: "🧠",
		text: "⚡ Conflict detected: tech-comfort gap.",
		side: "right",
		col: "bg-pink-500/20 border-pink-500/40",
	},
];

function ChatIllustration({ hovered }: { hovered: boolean }) {
	const [visible, setVisible] = useState<number[]>([]);
	const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

	const cycle = () => {
		setVisible([]);
		timers.current.forEach(clearTimeout);
		const gap = hovered ? 380 : 650;
		CHAT.forEach((_, i) => {
			timers.current.push(
				setTimeout(() => setVisible((p) => [...p, i]), 200 + i * gap),
			);
		});
		timers.current.push(
			setTimeout(cycle, 200 + CHAT.length * gap + (hovered ? 900 : 1600)),
		);
	};

	useEffect(() => {
		cycle();
		return () => timers.current.forEach(clearTimeout);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [hovered]);

	return (
		<div className="w-full h-full flex flex-col justify-end gap-2 p-4 overflow-hidden">
			{CHAT.map((msg, i) => (
				<AnimatePresence key={i}>
					{visible.includes(i) && (
						<motion.div
							className={`flex items-end gap-2 ${msg.side === "right" ? "flex-row-reverse" : ""}`}
							initial={{ opacity: 0, y: 12, scale: 0.9 }}
							animate={{ opacity: 1, y: 0, scale: 1 }}
							exit={{
								opacity: 0,
								y: -8,
								scale: 0.92,
								transition: { duration: 0.2 },
							}}
							transition={{ type: "spring", stiffness: 420, damping: 28 }}
						>
							<div className="h-6 w-6 rounded-full bg-muted border border-border flex items-center justify-center text-xs shrink-0">
								{msg.emoji}
							</div>
							<motion.div
								className={`max-w-[80%] rounded-2xl border px-3 py-1.5 ${msg.col}`}
								initial={{ x: msg.side === "left" ? -10 : 10, opacity: 0 }}
								animate={{ x: 0, opacity: 1 }}
								transition={{
									type: "spring",
									stiffness: 380,
									damping: 26,
									delay: 0.04,
								}}
							>
								<p className="text-[10px] font-body text-foreground leading-relaxed">
									{msg.text}
								</p>
							</motion.div>
						</motion.div>
					)}
				</AnimatePresence>
			))}
		</div>
	);
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   BentoCard — clean shell, no over-engineering
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function BentoCard({
	title,
	description,
	children,
	className = "",
	illH = "h-44",
	accent = "#6366f1",
	delay = 0,
}: {
	title: string;
	description: string;
	children: (hovered: boolean) => React.ReactNode;
	className?: string;
	illH?: string;
	accent?: string;
	delay?: number;
}) {
	const [hovered, setHovered] = useState(false);

	return (
		<motion.div
			onHoverStart={() => setHovered(true)}
			onHoverEnd={() => setHovered(false)}
			initial={{ opacity: 0, y: 16 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: "-30px" }}
			transition={{ duration: 0.45, ease, delay }}
			className={`group relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden cursor-default h-full ${className}`}
		>
			{/* Hover accent glow */}
			<motion.div
				className="pointer-events-none absolute inset-0 z-0"
				animate={hovered ? { opacity: 1 } : { opacity: 0 }}
				transition={{ duration: 0.3 }}
				style={{
					background: `radial-gradient(ellipse 80% 55% at 20% 0%, ${accent}14, transparent 65%)`,
				}}
			/>
			{/* Hover border */}
			<motion.div
				className="pointer-events-none absolute inset-0 rounded-2xl z-10"
				animate={hovered ? { opacity: 1 } : { opacity: 0 }}
				transition={{ duration: 0.25 }}
				style={{ boxShadow: `inset 0 0 0 1px ${accent}35` }}
			/>

			{/* Illustration */}
			<div className={`relative ${illH} w-full shrink-0 z-10 overflow-hidden`}>
				{children(hovered)}
			</div>

			<div className="h-px bg-border" />

			{/* Text */}
			<div className="flex flex-col gap-1.5 p-5 z-10">
				<h3 className="font-heading text-[14px] font-semibold text-foreground leading-snug">
					{title}
				</h3>
				<p className="font-body text-[12px] text-muted-foreground leading-relaxed">
					{description}
				</p>
			</div>
		</motion.div>
	);
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Features Section
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export function Features() {
	/* Focus Group card needs its own hovered + inView */
	const fgRef = useRef<HTMLDivElement>(null);
	const fgInView = useInView(fgRef, { once: false, margin: "-6%" });
	const [fgHovered, setFgHovered] = useState(false);

	return (
		<section
			id="features"
			className="relative w-full py-28 px-4 overflow-hidden"
		>
			<NoiseTexture />

			<div className="relative mx-auto max-w-5xl z-10">
				{/* Header */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.55, ease }}
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

				{/* ── Grid ── */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{/* 1 — Personas (col 1) */}
					<BentoCard
						title="Synthetic Personas"
						description="Generate up to 5 AI users per run — each with distinct demographics, goals, technical fluency, and frustrations."
						accent="#6366f1"
						delay={0}
						illH="h-40"
					>
						{(h) => <PersonasIllustration hovered={h} />}
					</BentoCard>

					{/* 2 — Crawling (col 2–3) */}
					<div className="lg:col-span-2">
						<BentoCard
							title="Real Browser Crawling"
							description="Playwright opens your actual URL, captures full-page screenshots, maps navigation, and detects every form and button."
							accent="#6366f1"
							delay={0.06}
							illH="h-40"
						>
							{(h) => <CrawlIllustration hovered={h} />}
						</BentoCard>
					</div>

					{/* 3 — Vision (col 1) */}
					<BentoCard
						title="Vision-Powered Analysis"
						description="Gemini Vision reads every screenshot for UI complexity, accessibility gaps, and layout hierarchy."
						accent="#8b5cf6"
						delay={0.1}
						illH="h-40"
					>
						{(h) => <VisionIllustration hovered={h} />}
					</BentoCard>

					{/* 4 — Metrics (col 2) */}
					<BentoCard
						title="Evidence-Backed Findings"
						description='Every pain point is tied to a metric — "11 input fields across 3 steps" not "feels overwhelming".'
						accent="#f59e0b"
						delay={0.13}
						illH="h-40"
					>
						{(h) => <MetricsIllustration hovered={h} />}
					</BentoCard>

					{/* 5 — Friction (col 3) */}
					<BentoCard
						title="Friction Scores"
						description="Quantified friction per persona, per page area — giving you a ranked list of what to fix first."
						accent="#ef4444"
						delay={0.16}
						illH="h-40"
					>
						{(h) => <FrictionIllustration hovered={h} />}
					</BentoCard>

					{/* 6 — Focus Group (full width) */}
					<div className="lg:col-span-3 md:col-span-2">
						<motion.div
							ref={fgRef}
							onHoverStart={() => setFgHovered(true)}
							onHoverEnd={() => setFgHovered(false)}
							initial={{ opacity: 0, y: 16 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, margin: "-30px" }}
							transition={{ duration: 0.45, ease, delay: 0.2 }}
							className="relative flex flex-col md:flex-row rounded-2xl border border-border bg-card overflow-hidden cursor-default"
						>
							{/* Hover glow */}
							<motion.div
								className="pointer-events-none absolute inset-0"
								animate={fgHovered ? { opacity: 1 } : { opacity: 0 }}
								transition={{ duration: 0.3 }}
								style={{
									background:
										"radial-gradient(ellipse 60% 80% at 18% 50%, #ec489914, transparent 65%)",
								}}
							/>
							<motion.div
								className="pointer-events-none absolute inset-0 rounded-2xl z-10"
								animate={fgHovered ? { opacity: 1 } : { opacity: 0 }}
								transition={{ duration: 0.25 }}
								style={{ boxShadow: "inset 0 0 0 1px #ec489935" }}
							/>

							{/* Chat — left pane */}
							<div className="relative md:w-[38%] h-52 md:h-auto border-b md:border-b-0 md:border-r border-border shrink-0 overflow-hidden z-10">
								{fgInView && <ChatIllustration hovered={fgHovered} />}
								{/* Fade edge */}
								<div className="hidden md:block absolute inset-y-0 right-0 w-8 bg-linear-to-r from-transparent to-card/80 z-20 pointer-events-none" />
							</div>

							{/* Text — right pane */}
							<div className="flex flex-col justify-center gap-3 p-5 md:p-7 relative z-10">
								<div className="inline-flex items-center gap-2 w-fit px-2.5 py-1 rounded-full bg-pink-500/10 border border-pink-500/25">
									<motion.div
										className="h-1.5 w-1.5 rounded-full bg-pink-500"
										animate={
											fgInView
												? { scale: [1, 1.6, 1], opacity: [0.5, 1, 0.5] }
												: {}
										}
										transition={{ repeat: Infinity, duration: 1.8 }}
									/>
									<span className="text-[10px] font-mono font-semibold text-pink-400 tracking-wide">
										AI Moderator
									</span>
								</div>
								<h3 className="font-heading text-lg sm:text-xl font-semibold text-foreground leading-snug">
									Focus Group Simulation
								</h3>
								<p className="font-body text-[13px] text-muted-foreground leading-relaxed max-w-lg">
									An AI moderator surfaces real disagreements between personas
									and explains the demographic root of each conflict — so you
									know exactly{" "}
									<em className="text-muted-foreground not-italic font-medium">
										why
									</em>{" "}
									users disagree, not just that they do.
								</p>
								<div className="flex gap-2 flex-wrap pt-1">
									{[
										"Conflict detection",
										"Root cause analysis",
										"Cross-persona compare",
									].map((tag) => (
										<span
											key={tag}
											className="text-[10px] font-body text-muted-foreground border border-border px-2.5 py-0.5 rounded-full"
										>
											{tag}
										</span>
									))}
								</div>
							</div>
						</motion.div>
					</div>
				</div>
			</div>
		</section>
	);
}
