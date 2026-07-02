// components/dashboard/AnalysisFavicon.tsx
"use client";
import { useState } from "react";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalysisFaviconProps {
	domain: string;
	className?: string;
	size?: number;
}

export function AnalysisFavicon({ domain, className, size = 32 }: AnalysisFaviconProps) {
	const [failed, setFailed] = useState(false);

	return (
		<div className={cn("relative flex items-center justify-center bg-muted border border-border overflow-hidden", className)}>
			{!failed && (
				/* eslint-disable-next-line @next/next/no-img-element */
				<img
					src={`https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`}
					alt=""
					className="h-full w-full object-contain z-10"
					onError={() => setFailed(true)}
				/>
			)}
			<Globe
				className="absolute h-1/2 w-1/2 text-muted-foreground"
				strokeWidth={1.5}
			/>
		</div>
	);
}
