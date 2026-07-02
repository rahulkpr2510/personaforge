// components/dashboard/PersonaAccordion.tsx
"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
	ChevronDown,
	CheckCircle2,
	XCircle,
	Lightbulb,
	AlertTriangle,
	Sparkles,
	ThumbsUp,
	ThumbsDown,
} from "lucide-react";
import { SentimentBadge } from "./SentimentBadge";
import { FrictionBar } from "./FrictionBar";
import { cn } from "@/lib/utils";

function parseList(value: string | null | undefined): string[] {
	if (!value) return [];
	try {
		const parsed = JSON.parse(value);
		return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
	} catch {
		return value.trim() ? [value] : [];
	}
}

function BulletList({
	items,
	icon,
	colorClass,
	bgClass,
}: {
	items: string[];
	icon: React.ReactNode;
	colorClass: string;
	bgClass: string;
}) {
	if (!items.length) return null;
	return (
		<ul className={`rounded-xl ${bgClass} p-3.5 space-y-2.5`}>
			{items.map((item, i) => (
				<li
					key={i}
					className="flex items-start gap-2.5 text-sm text-foreground"
				>
					<span className={`mt-0.5 shrink-0 ${colorClass}`}>{icon}</span>
					<span className="leading-relaxed">{item}</span>
				</li>
			))}
		</ul>
	);
}

const sentimentHeaderBg = {
	POSITIVE:
		"bg-linear-to-r from-[var(--pf-green-soft)] to-card border-[var(--pf-green)]/20",
	NEUTRAL: "bg-linear-to-r from-muted/60 to-card border-border",
	NEGATIVE: "bg-linear-to-r from-destructive/6 to-card border-destructive/20",
};

const avatarBg = [
	"bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400",
	"bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400",
	"bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
	"bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400",
	"bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400",
	"bg-cyan-100 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400",
];

function getAvatarBg(label: string) {
	let h = 0;
	for (let i = 0; i < label.length; i++)
		h = label.charCodeAt(i) + ((h << 5) - h);
	return avatarBg[Math.abs(h) % avatarBg.length];
}

interface PersonaEvaluation {
	id: string;
	label: string;
	name: string;
	age: number;
	occupation: string;
	sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE" | null;
	frictionScore: number | null;
	adoptionLikelihood: number | null;
	firstImpressions: string | null;
	positives: string | null;
	painPoints: string | null;
	recommendations: string | null;
	accessibilityNotes: string | null;
}

interface PersonaAccordionProps {
	personas: PersonaEvaluation[];
}

export function PersonaAccordion({ personas }: PersonaAccordionProps) {
	const [openId, setOpenId] = useState<string | null>(personas[0]?.id ?? null);

	return (
		<div className="space-y-3">
			{personas.map((persona) => {
				const isOpen = openId === persona.id;
				const positives = parseList(persona.positives);
				const painPoints = parseList(persona.painPoints);
				const recommendations = parseList(persona.recommendations);
				const headerBg = persona.sentiment
					? sentimentHeaderBg[persona.sentiment]
					: "bg-card border-border";

				return (
					<div
						key={persona.id}
						className={cn(
							"rounded-2xl border overflow-hidden transition-all duration-200",
							isOpen
								? "border-(--pf-accent)/35 shadow-[0_4px_24px_-6px_var(--pf-accent,#6366f1)18]"
								: "border-border hover:border-(--pf-accent)/25 hover:shadow-sm",
						)}
					>
						{/* ── Accordion Header (always visible) ── */}
						<button
							type="button"
							onClick={() => setOpenId(isOpen ? null : persona.id)}
							className="w-full text-left"
						>
							<div
								className={cn("flex items-center gap-4 px-5 py-4", headerBg)}
							>
								{/* Avatar */}
								<div
									className={cn(
										"flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-heading font-bold text-base",
										getAvatarBg(persona.label),
									)}
								>
									{persona.label.charAt(0)}
								</div>

								{/* Name + meta */}
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 flex-wrap">
										<p className="text-sm font-semibold text-foreground">
											{persona.label}
										</p>
										{persona.sentiment && (
											<SentimentBadge sentiment={persona.sentiment} />
										)}
									</div>
									<p className="text-xs text-muted-foreground mt-0.5">
										{persona.name} · {persona.age}y · {persona.occupation}
									</p>
								</div>

								{/* Right metadata chips */}
								<div className="hidden sm:flex items-center gap-2 shrink-0">
									{persona.adoptionLikelihood != null && (
										<span className="rounded-full bg-background/60 border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
											{persona.adoptionLikelihood}% adoption
										</span>
									)}
									{positives.length > 0 && (
										<span className="flex items-center gap-1 rounded-full bg-(--pf-green-soft) border border-(--pf-green)/20 px-2.5 py-0.5 text-xs font-medium text-(--pf-green)">
											<ThumbsUp className="h-3 w-3" />
											{positives.length}
										</span>
									)}
									{painPoints.length > 0 && (
										<span className="flex items-center gap-1 rounded-full bg-destructive/8 border border-destructive/15 px-2.5 py-0.5 text-xs font-medium text-destructive">
											<ThumbsDown className="h-3 w-3" />
											{painPoints.length}
										</span>
									)}
								</div>

								{/* Chevron */}
								<motion.div
									animate={{ rotate: isOpen ? 180 : 0 }}
									transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
									className="shrink-0"
								>
									<ChevronDown className="h-5 w-5 text-muted-foreground" />
								</motion.div>
							</div>

							{/* Collapsed preview — friction bar + first impression snippet */}
							{!isOpen && (
								<div className="bg-card px-5 pb-4 pt-0">
									{/* Friction mini-bar */}
									{persona.frictionScore != null && (
										<div className="flex items-center gap-3 mt-3">
											<span className="text-xs text-muted-foreground shrink-0 w-12">
												Friction
											</span>
											<div className="flex-1">
												<FrictionBar
													score={persona.frictionScore}
													showLabel={false}
												/>
											</div>
											<span
												className={cn(
													"text-xs font-mono font-bold tabular-nums shrink-0",
													persona.frictionScore <= 33
														? "text-(--pf-green)"
														: persona.frictionScore <= 66
															? "text-(--pf-amber)"
															: "text-destructive",
												)}
											>
												{persona.frictionScore.toFixed(0)}/100
											</span>
										</div>
									)}

									{/* First impression snippet */}
									{persona.firstImpressions && (
										<p className="mt-2 text-xs text-muted-foreground italic line-clamp-1">
											&ldquo;{persona.firstImpressions}&rdquo;
										</p>
									)}

									{/* Mobile counts */}
									<div className="mt-2 flex sm:hidden items-center gap-2">
										{positives.length > 0 && (
											<span className="flex items-center gap-1 text-xs text-(--pf-green)">
												<ThumbsUp className="h-3 w-3" />
												{positives.length} positives
											</span>
										)}
										{painPoints.length > 0 && (
											<span className="flex items-center gap-1 text-xs text-destructive">
												<ThumbsDown className="h-3 w-3" />
												{painPoints.length} pain points
											</span>
										)}
									</div>

									<p className="mt-2 text-xs text-(--pf-accent) font-medium">
										Click to read full report ↓
									</p>
								</div>
							)}
						</button>

						{/* ── Expanded Body ── */}
						<AnimatePresence initial={false}>
							{isOpen && (
								<motion.div
									key="body"
									initial={{ height: 0, opacity: 0 }}
									animate={{ height: "auto", opacity: 1 }}
									exit={{ height: 0, opacity: 0 }}
									transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
									className="overflow-hidden"
								>
									<div className="border-t border-border/50 bg-card px-5 pb-6 pt-5 space-y-5">
										{/* Friction full bar */}
										{persona.frictionScore != null && (
											<div className="rounded-xl border border-border bg-muted/20 p-4">
												<p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
													Friction Score
												</p>
												<FrictionBar score={persona.frictionScore} showLabel />
											</div>
										)}

										{/* First impression quote */}
										{persona.firstImpressions && (
											<div className="rounded-xl border border-border/60 bg-muted/30 p-4">
												<p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
													<Sparkles className="h-3.5 w-3.5" /> First Impression
												</p>
												<p className="text-sm text-foreground leading-relaxed italic">
													&ldquo;{persona.firstImpressions}&rdquo;
												</p>
											</div>
										)}

										{/* Positives + Pain points side-by-side */}
										<div className="grid gap-4 sm:grid-cols-2">
											{positives.length > 0 && (
												<div>
													<p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-(--pf-green)">
														<CheckCircle2 className="h-3.5 w-3.5" /> What works
													</p>
													<BulletList
														items={positives}
														icon={<CheckCircle2 className="h-3.5 w-3.5" />}
														colorClass="text-[var(--pf-green)]"
														bgClass="bg-[var(--pf-green-soft)] border border-[var(--pf-green)]/15"
													/>
												</div>
											)}
											{painPoints.length > 0 && (
												<div>
													<p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-destructive">
														<XCircle className="h-3.5 w-3.5" /> Pain points
													</p>
													<BulletList
														items={painPoints}
														icon={<XCircle className="h-3.5 w-3.5" />}
														colorClass="text-destructive"
														bgClass="bg-destructive/5 border border-destructive/12"
													/>
												</div>
											)}
										</div>

										{/* Recommendations */}
										{recommendations.length > 0 && (
											<div>
												<p className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-(--pf-accent)">
													<Lightbulb className="h-3.5 w-3.5" /> Recommendations
												</p>
												<BulletList
													items={recommendations}
													icon={<Lightbulb className="h-3.5 w-3.5" />}
													colorClass="text-[var(--pf-accent)]"
													bgClass="bg-[var(--pf-accent-soft)] border border-[var(--pf-accent)]/15"
												/>
											</div>
										)}

										{/* Accessibility */}
										{persona.accessibilityNotes && (
											<div className="rounded-xl border border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20 p-4">
												<p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">
													<AlertTriangle className="h-3.5 w-3.5" />{" "}
													Accessibility notes
												</p>
												<p className="text-sm text-foreground leading-relaxed">
													{persona.accessibilityNotes}
												</p>
											</div>
										)}
									</div>
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				);
			})}
		</div>
	);
}
