// components/dashboard/PersonaCard.tsx
"use client";
import { motion } from "motion/react";
import { User, Briefcase, Zap, Trash2, Edit } from "lucide-react";
import { cn } from "@/lib/utils";

const techColors = {
	LOW: "bg-[var(--pf-amber-soft)] text-[var(--pf-amber)]",
	MEDIUM: "bg-[var(--pf-accent-soft)] text-[var(--pf-accent)]",
	HIGH: "bg-[var(--pf-green-soft)] text-[var(--pf-green)]",
};

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
		_count?: { analysisPersonas: number };
	};
	onEdit?: (id: string) => void;
	onDelete?: (id: string) => void;
	selectable?: boolean;
	selected?: boolean;
	onSelect?: (id: string) => void;
	className?: string;
}

export function PersonaCard({
	persona,
	onEdit,
	onDelete,
	selectable,
	selected,
	onSelect,
	className,
}: PersonaCardProps) {
	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.98 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
			className={cn(
				"group relative flex flex-col rounded-xl border bg-card p-5 transition-all duration-200",
				selectable
					? selected
						? "border-(--pf-accent) ring-2 ring-(--pf-accent)/20 shadow-sm cursor-pointer"
						: "border-border hover:border-(--pf-accent)/50 cursor-pointer"
					: "border-border hover:shadow-md",
				className,
			)}
			onClick={() => selectable && onSelect?.(persona.id)}
		>
			{/* Prebuilt badge */}
			{persona.isPrebuilt && (
				<span className="absolute right-3 top-3 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
					Library
				</span>
			)}

			<div className="flex items-start gap-3">
				<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-(--pf-accent-soft) text-(--pf-accent)">
					<User className="h-5 w-5" strokeWidth={1.5} />
				</div>
				<div className="min-w-0 flex-1">
					<p className="text-sm font-semibold text-foreground leading-tight">
						{persona.label}
					</p>
					<p className="text-xs text-muted-foreground mt-0.5">
						{persona.name} · {persona.age}y
					</p>
				</div>
			</div>

			<div className="mt-4 flex flex-wrap gap-2 text-xs">
				<span className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
					<Briefcase className="h-3 w-3" />
					{persona.occupation}
				</span>
				<span
					className={cn(
						"flex items-center gap-1 rounded-full px-2.5 py-1 font-medium",
						techColors[persona.technicalLevel],
					)}
				>
					<Zap className="h-3 w-3" />
					{persona.technicalLevel.charAt(0) +
						persona.technicalLevel.slice(1).toLowerCase()}{" "}
					tech
				</span>
			</div>

			<p className="mt-3 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
				<span className="font-medium text-foreground/70">Goals: </span>
				{persona.goals}
			</p>

			{persona.tags.length > 0 && (
				<div className="mt-3 flex flex-wrap gap-1.5">
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

			{(onEdit || onDelete) && (
				<div className="mt-4 flex gap-2 border-t border-border pt-4 opacity-0 transition-opacity group-hover:opacity-100">
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
				</div>
			)}
		</motion.div>
	);
}
