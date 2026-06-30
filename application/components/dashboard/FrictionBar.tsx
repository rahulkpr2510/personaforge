// components/dashboard/FrictionBar.tsx
"use client";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

function getColor(score: number) {
	if (score <= 33) return "var(--pf-green)";
	if (score <= 66) return "var(--pf-amber)";
	return "oklch(0.577 0.245 27.325)"; // destructive
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
			if (barRef.current) {
				barRef.current.style.transition =
					"width 0.8s cubic-bezier(0.16,1,0.3,1)";
				barRef.current.style.width = `${score}%`;
			}
		});
		return () => cancelAnimationFrame(raf);
	}, [score]);

	if (score == null)
		return <span className="text-xs text-muted-foreground">—</span>;

	return (
		<div className={cn("flex items-center gap-2", className)}>
			<div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
				<div
					ref={barRef}
					className="h-full rounded-full"
					style={{ background: getColor(score), width: "0%" }}
				/>
			</div>
			{showLabel && (
				<span className="w-7 text-right font-mono text-xs text-muted-foreground tabular-nums">
					{score}
				</span>
			)}
		</div>
	);
}
