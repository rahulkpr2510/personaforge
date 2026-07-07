// components/dashboard/PersonaCard.tsx
"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
	Briefcase,
	Zap,
	Trash2,
	Edit,
	ChevronDown,
	Target,
	Frown,
	Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const techColors = {
	LOW: "bg-[var(--pf-amber-soft)] text-[var(--pf-amber)]",
	MEDIUM: "bg-[var(--pf-accent-soft)] text-[var(--pf-accent)]",
	HIGH: "bg-[var(--pf-green-soft)] text-[var(--pf-green)]",
};

const techLabels = {
	LOW: "Non-technical",
	MEDIUM: "Intermediate",
	HIGH: "Power user",
};

const avatarColors = [
	"bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400",
	"bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
	"bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
	"bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
	"bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400",
	"bg-cyan-100 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-400",
];

function getAvatarColor(label: string) {
	let hash = 0;
	for (let i = 0; i < label.length; i++)
		hash = label.charCodeAt(i) + ((hash << 5) - hash);
	return avatarColors[Math.abs(hash) % avatarColors.length];
}

interface PersonaCardProps {
	persona: {
		id: string;
		label: string;
		name: string;
		age: number;
		occupation: string;
		technicalLevel: "LOW" | "MEDIUM" | "HIGH";
		goals: string;
		frustrations: string;
		tags: string[];
		isPrebuilt?: boolean;
		description?: string | null;
		_count?: { analysisPersonas: number };
	};
	onEdit?: (id: string) => void;
	onDelete?: (id: string) => void;
	selectable?: boolean;
	selected?: boolean;
	onSelect?: (id: string) => void;
	className?: string;
	footerActions?: React.ReactNode;
}

export function PersonaCard({
	persona,
	onEdit,
	onDelete,
	selectable,
	selected,
	onSelect,
	className,
	footerActions,
}: PersonaCardProps) {
	const [expanded, setExpanded] = useState(false);
	const avatarColor = getAvatarColor(persona.label);

	const handleClick = () => {
		if (selectable) {
			onSelect?.(persona.id);
		}
	};

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.98 }}
			animate={{ opacity: 1, scale: 1 }}
			whileHover={{ y: -6, scale: 1.02 }}
			whileTap={{ scale: 0.99 }}
			transition={{ 
				opacity: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
				default: { type: "spring", stiffness: 220, damping: 18, mass: 0.8 }
			}}
			style={{ willChange: "transform" }}
			className={cn(
				"group relative flex flex-col h-full rounded-xl border bg-card transition-shadow duration-500",
				selectable
					? selected
						? "border-(--pf-accent) ring-2 ring-(--pf-accent)/20 shadow-md cursor-pointer"
						: "border-border cursor-pointer hover:border-(--pf-accent)/40 hover:shadow-xl"
					: "border-border hover:shadow-xl",
				className,
			)}
			onClick={handleClick}
		>
			{/* Selected checkmark */}
			{selectable && selected && (
				<div className="absolute right-3 top-3 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-(--pf-accent)">
					<svg
						className="h-3 w-3 text-white"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth={3}
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M5 13l4 4L19 7"
						/>
					</svg>
				</div>
			)}

			{/* Prebuilt badge */}
			{persona.isPrebuilt && !selectable && (
				<span className="absolute right-3 top-3 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
					Library
				</span>
			)}

			<div className="p-5">
				{/* Header */}
				<div className="flex items-start gap-3">
					<div
						className={cn(
							"flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-heading font-bold text-base",
							avatarColor,
						)}
					>
						{persona.label.charAt(0)}
					</div>
					<div className="min-w-0 flex-1 pt-0.5">
						<p className="text-sm font-semibold text-foreground leading-tight">
							{persona.label}
						</p>
						<p className="text-xs text-muted-foreground mt-0.5">
							{persona.name} · {persona.age}y · {persona.occupation}
						</p>
					</div>
				</div>

				{/* Tech level + tags */}
				<div className="mt-3.5 flex flex-wrap gap-1.5 text-xs">
					<span
						className={cn(
							"flex items-center gap-1 rounded-full px-2.5 py-1 font-medium",
							techColors[persona.technicalLevel],
						)}
					>
						<Zap className="h-3 w-3" />
						{techLabels[persona.technicalLevel]}
					</span>
					<span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
						<Briefcase className="h-3 w-3" />
						{persona.occupation}
					</span>
				</div>

				{/* LLM description (if available) */}
				{persona.description && (
					<p className="mt-3 text-xs text-muted-foreground leading-relaxed line-clamp-2 italic">
						{persona.description}
					</p>
				)}

				{/* Goals preview (collapsed) */}
				{!persona.description && (
					<p className="mt-3 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
						<span className="font-medium text-foreground/70">Goals: </span>
						{persona.goals}
					</p>
				)}

				{/* Tags */}
				{persona.tags.length > 0 && (
					<div className="mt-3 flex flex-wrap gap-1">
						{persona.tags.slice(0, 4).map((tag) => (
							<span
								key={tag}
								className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
							>
								#{tag}
							</span>
						))}
					</div>
				)}

				{/* Expand toggle */}
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						setExpanded((v) => !v);
					}}
					className="mt-3 flex w-full items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
				>
					<span>{expanded ? "Show less" : "Show details"}</span>
					<motion.div
						animate={{ rotate: expanded ? 180 : 0 }}
						transition={{ duration: 0.2 }}
					>
						<ChevronDown className="h-3.5 w-3.5" />
					</motion.div>
				</button>

				{/* Expanded section */}
				<AnimatePresence initial={false}>
					{expanded && (
						<motion.div
							key="expanded"
							initial={{ height: 0, opacity: 0 }}
							animate={{ height: "auto", opacity: 1 }}
							exit={{ height: 0, opacity: 0 }}
							transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
							className="overflow-hidden"
						>
							<div className="mt-4 space-y-3 border-t border-border pt-4">
								{/* Description from LLM */}
								{persona.description && (
									<div className="rounded-lg bg-(--pf-accent-soft) border border-(--pf-accent)/15 p-3">
										<p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-(--pf-accent)">
											<Sparkles className="h-3.5 w-3.5" /> AI Portrait
										</p>
										<p className="text-xs text-foreground leading-relaxed">
											{persona.description}
										</p>
									</div>
								)}

								{/* Goals */}
								<div>
									<p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-(--pf-green)">
										<Target className="h-3.5 w-3.5" /> Goals
									</p>
									<p className="text-xs text-foreground leading-relaxed">
										{persona.goals}
									</p>
								</div>

								{/* Frustrations */}
								<div>
									<p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-destructive">
										<Frown className="h-3.5 w-3.5" /> Frustrations
									</p>
									<p className="text-xs text-foreground leading-relaxed">
										{persona.frustrations}
									</p>
								</div>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{/* Action bar (manage/admin/custom mode) */}
			{(onEdit || onDelete || footerActions) && (
				<div className="mt-auto flex items-center gap-2 border-t border-border px-5 py-3 bg-muted/20 rounded-b-xl">
					{footerActions ? (
						footerActions
					) : (
						<>
							{onEdit && (
								<button
									onClick={(e) => {
										e.stopPropagation();
										onEdit(persona.id);
									}}
									className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
								>
									<Edit className="h-3 w-3" /> Edit
								</button>
							)}
							{onDelete && !persona.isPrebuilt && (
								<button
									onClick={(e) => {
										e.stopPropagation();
										onDelete(persona.id);
									}}
									className="ml-auto flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors"
								>
									<Trash2 className="h-3 w-3" /> Delete
								</button>
							)}
						</>
					)}
				</div>
			)}
		</motion.div>
	);
}
