"use client";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/** Returns a CSS gradient from green → amber → red based on the score position */
function buildGradient(score: number): string {
	// Always render the full gradient behind the fill bar; the fill clips it
	return "linear-gradient(to right, var(--pf-green) 0%, var(--pf-amber) 50%, oklch(0.577 0.245 27.325) 100%)";
}

function getTextColor(score: number): string {
	if (score <= 33) return "text-[var(--pf-green)]";
	if (score <= 66) return "text-[var(--pf-amber)]";
	return "text-destructive";
}

function getLabel(score: number): string {
	if (score <= 25) return "Smooth";
	if (score <= 50) return "Moderate";
	if (score <= 75) return "Rough";
	return "Critical";
}

export function FrictionBar({
	score,
	showLabel = true,
	className,
}: {
	score: number | null;
	showLabel?: boolean;
	className?: string;
}) {
	const barRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!barRef.current || score == null) return;
		barRef.current.style.width = "0%";
		const raf = requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				if (barRef.current) {
					barRef.current.style.transition = "width 0.85s cubic-bezier(0.16,1,0.3,1)";
					barRef.current.style.width = `${score}%`;
				}
			});
		});
		return () => cancelAnimationFrame(raf);
	}, [score]);

	if (score == null)
		return <span className="text-xs text-muted-foreground">—</span>;

	return (
		<div className={cn("space-y-1.5", className)}>
			{/* Track + fill */}
			<div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
				{/* Full gradient always behind */}
				<div
					className="absolute inset-y-0 left-0 h-full w-full rounded-full"
					style={{ background: buildGradient(score), opacity: 0.25 }}
				/>
				{/* Animated fill that clips the gradient */}
				<div
					ref={barRef}
					className="absolute inset-y-0 left-0 h-full rounded-full"
					style={{
						background: buildGradient(score),
						width: "0%",
					}}
				/>
				{/* Tick marks at 33 and 66 */}
				<div className="absolute inset-y-0 left-[33%] w-px bg-background/40" />
				<div className="absolute inset-y-0 left-[66%] w-px bg-background/40" />
			</div>

			{showLabel && (
				<div className="flex items-center justify-between">
					<span className="text-xs text-muted-foreground">0</span>
					<span className={cn("text-xs font-semibold tabular-nums", getTextColor(score))}>
						{score.toFixed(0)} — {getLabel(score)}
					</span>
					<span className="text-xs text-muted-foreground">100</span>
				</div>
			)}
		</div>
	);
}
