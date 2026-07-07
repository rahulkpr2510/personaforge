// components/dashboard/PersonaDiscussion.tsx
"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { AnalysisPersona, FocusGroupInsight } from "@prisma/client";

const AVATAR_COLORS = [
	"bg-blue-500",
	"bg-purple-500",
	"bg-emerald-500",
	"bg-orange-500",
	"bg-pink-500",
	"bg-teal-500",
];

const TECH_BADGE: Record<string, string> = {
	LOW: "👤 Non-technical",
	MEDIUM: "⚡ Intermediate",
	HIGH: "🔧 Technical",
};

function getInitials(name: string) {
	return name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
}

/** Safely parse a JSON array stored as a string, returning an empty array on failure */
function parseJsonArray(raw: string | null | undefined): string[] {
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw);
		if (Array.isArray(parsed)) return parsed.filter((v) => typeof v === "string");
	} catch {
		// If it's a plain string (not JSON), return it as a single-item array
		if (typeof raw === "string" && raw.trim().length > 0) return [raw.trim()];
	}
	return [];
}

interface MessageItem {
	personaIdx: number;
	name: string;
	occupation: string;
	techLevel: string;
	// Structured fields instead of a single raw text string
	firstImpressions: string | null;
	positives: string[];
	painPoints: string[];
	phase: "individual" | "discussion";
	// For discussion phase: use plain text
	discussionText?: string;
}

interface Props {
	personas: AnalysisPersona[];
	focusGroup: FocusGroupInsight | null;
	onComplete: () => void;
}

export function PersonaDiscussion({ personas, focusGroup, onComplete }: Props) {
	const [visibleCount, setVisibleCount] = useState(0);
	const [discussionDone, setDiscussionDone] = useState(false);

	// Build the full message queue
	const messages: MessageItem[] = [
		// Phase 1: individual findings — use structured fields
		...personas.map((p, i) => ({
			personaIdx: i,
			name: p.name,
			occupation: p.occupation,
			techLevel: p.technicalLevel,
			firstImpressions: p.firstImpressions,
			positives: parseJsonArray(p.positives),
			painPoints: parseJsonArray(p.painPoints),
			phase: "individual" as const,
		})),
		// Phase 2: discussion snippets from focusGroup summary
		...(focusGroup?.summary
			? focusGroup.summary
					.split(/(?<=[.!?])\s+/)
					.slice(0, 4)
					.map((sentence, i) => ({
						personaIdx: i % personas.length,
						name: personas[i % personas.length]?.name ?? "Persona",
						occupation: personas[i % personas.length]?.occupation ?? "",
						techLevel:
							personas[i % personas.length]?.technicalLevel ?? "MEDIUM",
						firstImpressions: null,
						positives: [],
						painPoints: [],
						phase: "discussion" as const,
						discussionText: sentence.trim(),
					}))
			: []),
	];

	// Reveal messages one by one — stop when all shown, do NOT auto-call onComplete
	useEffect(() => {
		if (visibleCount >= messages.length) {
			// All messages visible — mark discussion done but do NOT auto-redirect
			setDiscussionDone(true);
			return;
		}
		const delay = visibleCount === 0 ? 600 : 1800;
		const timer = setTimeout(() => setVisibleCount((c) => c + 1), delay);
		return () => clearTimeout(timer);
	}, [visibleCount, messages.length]);

	const showConsensus = visibleCount >= messages.length;

	return (
		<div className="rounded-2xl border border-border bg-card p-6 space-y-6">
			<div>
				<h2 className="font-heading text-base font-semibold text-foreground flex items-center gap-2">
					👥 Research Team Discussion
				</h2>
				<p className="text-xs text-muted-foreground mt-0.5">
					Your AI personas are collaborating on their findings
				</p>
			</div>

			{/* Phase separator */}
			{visibleCount > 0 && (
				<p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
					— Individual Findings —
				</p>
			)}

			{/* Messages */}
			<div className="space-y-4">
				{messages.slice(0, visibleCount).map((msg, i) => {
					const showPhaseSep =
						msg.phase === "discussion" &&
						(i === 0 || messages[i - 1].phase === "individual");

					return (
						<div key={i}>
							{showPhaseSep && (
								<p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
									— Group Discussion —
								</p>
							)}
							<div
								className="flex items-start gap-3"
								style={{ animation: "fadeSlideUp 0.5s ease forwards" }}
							>
								{/* Avatar */}
								<div
									className={cn(
										"h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0",
										AVATAR_COLORS[msg.personaIdx % AVATAR_COLORS.length],
									)}
								>
									{getInitials(msg.name)}
								</div>
								{/* Bubble */}
								<div className="flex-1 bg-muted/40 border border-border rounded-2xl rounded-tl-none p-4 space-y-2">
									<div className="flex items-center gap-2 flex-wrap">
										<span className="text-sm font-semibold text-foreground">
											{msg.name}
										</span>
										<span className="text-xs text-muted-foreground">
											{msg.occupation}
										</span>
										<span className="text-xs bg-muted border border-border rounded-full px-2 py-0.5">
											{TECH_BADGE[msg.techLevel] ?? msg.techLevel}
										</span>
									</div>

									{msg.phase === "discussion" ? (
										<p className="text-sm text-foreground leading-relaxed">
											{msg.discussionText}
										</p>
									) : (
										<div className="space-y-2">
											{/* First impressions */}
											{msg.firstImpressions && (
												<p className="text-sm text-foreground leading-relaxed">
													{msg.firstImpressions}
												</p>
											)}
											{/* Positives */}
											{msg.positives.length > 0 && (
												<div>
													<p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1">
														Positives
													</p>
													<ul className="space-y-0.5">
														{msg.positives.map((item, j) => (
															<li
																key={j}
																className="text-sm text-foreground leading-relaxed flex items-start gap-1.5"
															>
																<span className="text-emerald-500 mt-0.5 shrink-0">
																	•
																</span>
																{item}
															</li>
														))}
													</ul>
												</div>
											)}
											{/* Pain points */}
											{msg.painPoints.length > 0 && (
												<div>
													<p className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wide mb-1">
														Pain Points
													</p>
													<ul className="space-y-0.5">
														{msg.painPoints.map((item, j) => (
															<li
																key={j}
																className="text-sm text-foreground leading-relaxed flex items-start gap-1.5"
															>
																<span className="text-rose-500 mt-0.5 shrink-0">
																	•
																</span>
																{item}
															</li>
														))}
													</ul>
												</div>
											)}
										</div>
									)}
								</div>
							</div>
						</div>
					);
				})}
			</div>

			{/* Phase 3: Consensus */}
			{showConsensus && focusGroup && (
				<div
					className="rounded-2xl border border-(--pf-accent)/20 bg-(--pf-accent-soft) p-6 space-y-4"
					style={{ animation: "fadeSlideUp 0.6s ease forwards" }}
				>
					<h3 className="font-heading text-sm font-semibold text-(--pf-accent) flex items-center gap-2">
						🏁 Team Consensus
					</h3>
					<p className="text-sm text-foreground leading-relaxed">
						{focusGroup.summary}
					</p>
					{Array.isArray(
						(focusGroup.conflicts as { items?: { topic?: string }[] })?.items,
					) && (
						<ul className="space-y-1">
							{(
								focusGroup.conflicts as {
									items: { topic?: string; reason?: string }[];
								}
							).items.map((c, i) => (
								<li
									key={i}
									className="text-sm text-muted-foreground flex items-start gap-2"
								>
									<span className="text-(--pf-accent) mt-0.5">•</span>
									<span>
										<strong>{c.topic}</strong>
										{c.reason ? ` — ${c.reason}` : ""}
									</span>
								</li>
							))}
						</ul>
					)}
				</div>
			)}

			{/* Explicit CTA — only shown after all messages + consensus are visible */}
			{discussionDone && (
				<div
					className="flex justify-center pt-2"
					style={{ animation: "fadeSlideUp 0.5s ease forwards" }}
				>
					<button
						onClick={onComplete}
						className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-(--pf-accent) text-white text-sm font-semibold shadow-lg hover:opacity-90 active:scale-95 transition-all duration-150"
					>
						View Full Dashboard →
					</button>
				</div>
			)}
		</div>
	);
}
