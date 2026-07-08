// components/dashboard/ErrorCard.tsx
"use client";

import { useState } from "react";
import {
	XCircle,
	RefreshCw,
	ArrowLeft,
	ChevronDown,
	ChevronUp,
	AlertTriangle,
	Wifi,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AppError, ErrorCategory } from "@/lib/api/types";

interface ErrorCardProps {
	error: AppError | Error | string | null;
	/** Title override — defaults to error.title or "Something went wrong" */
	title?: string;
	/** Called when the user clicks Retry */
	onRetry?: () => void;
	/** Called when the user clicks the back link */
	onBack?: () => void;
	backLabel?: string;
	className?: string;
}

function categoryColor(category: ErrorCategory): string {
	switch (category) {
		case ErrorCategory.AUTHENTICATION:
		case ErrorCategory.PERMISSION:
			return "border-amber-500/30 bg-amber-500/5";
		case ErrorCategory.RATE_LIMIT:
			return "border-orange-500/30 bg-orange-500/5";
		case ErrorCategory.CRAWLER:
		case ErrorCategory.NETWORK:
			return "border-blue-500/30 bg-blue-500/5";
		default:
			return "border-destructive/25 bg-destructive/5";
	}
}

function categoryIcon(category: ErrorCategory) {
	switch (category) {
		case ErrorCategory.NETWORK:
			return <Wifi className="h-5 w-5 text-blue-500" />;
		case ErrorCategory.RATE_LIMIT:
			return <AlertTriangle className="h-5 w-5 text-orange-500" />;
		default:
			return <XCircle className="h-5 w-5 text-destructive" />;
	}
}

export function ErrorCard({
	error,
	title,
	onRetry,
	onBack,
	backLabel = "← Back to Analyses",
	className,
}: ErrorCardProps) {
	const [showDetails, setShowDetails] = useState(false);

	// Normalize to display values
	let displayTitle = title ?? "Something went wrong";
	let displayMessage = "An unexpected error occurred. Please try again.";
	let displaySuggestion: string | null = null;
	let technicalReason: string | null = null;
	let requestId: string | null = null;
	let category = ErrorCategory.UNKNOWN;
	let retryable = true;
	let retryAfter: number | undefined;
	let fieldErrors: Record<string, string[]> | undefined;

	if (error instanceof AppError) {
		// AppError.message is set to the user-friendly message in the constructor
		displayTitle = title ?? error.title;
		displayMessage = error.userMessage;
		displaySuggestion = error.suggestedAction;
		technicalReason = error.technicalReason;
		requestId = error.requestId;
		category = error.category;
		retryable = error.retryable;
		retryAfter = error.retryAfter;
		fieldErrors = error.fieldErrors;
	} else if (error instanceof Error) {
		displayMessage = error.message;
	} else if (typeof error === "string") {
		displayMessage = error;
	}

	const borderBg = categoryColor(category);
	const icon = categoryIcon(category);

	return (
		<div
			role="alert"
			className={cn("rounded-2xl border p-6 space-y-4", borderBg, className)}
		>
			{/* Header */}
			<div className="flex items-start gap-3">
				<div className="mt-0.5 shrink-0">{icon}</div>
				<div className="flex-1 min-w-0">
					<h3 className="font-heading text-sm font-semibold text-foreground">
						{displayTitle}
					</h3>
					<p className="mt-1 text-sm text-foreground/80 leading-relaxed">
						{displayMessage}
					</p>
				</div>
			</div>

			{/* Field errors */}
			{fieldErrors && Object.keys(fieldErrors).length > 0 && (
				<ul className="space-y-1 ml-8">
					{Object.entries(fieldErrors).map(([field, msgs]) =>
						msgs.map((msg) => (
							<li key={`${field}-${msg}`} className="text-xs text-destructive">
								<span className="font-medium capitalize">{field}:</span> {msg}
							</li>
						)),
					)}
				</ul>
			)}

			{/* Suggestion */}
			{displaySuggestion && (
				<div className="ml-8 rounded-lg bg-background/60 border border-border px-3 py-2">
					<p className="text-xs text-muted-foreground">
						<span className="font-medium text-foreground">Suggested fix: </span>
						{displaySuggestion}
					</p>
					{retryAfter && (
						<p className="mt-1 text-xs text-muted-foreground">
							Auto-retry available in {retryAfter}s
						</p>
					)}
				</div>
			)}

			{/* Actions */}
			<div className="ml-8 flex flex-wrap gap-2">
				{onRetry && retryable && (
					<button
						onClick={onRetry}
						className="inline-flex items-center gap-1.5 rounded-lg bg-(--pf-accent) px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
					>
						<RefreshCw className="h-3 w-3" />
						{retryAfter ? `Retry (${retryAfter}s)` : "Retry"}
					</button>
				)}
				{onBack && (
					<button
						onClick={onBack}
						className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
					>
						<ArrowLeft className="h-3 w-3" />
						{backLabel}
					</button>
				)}
			</div>

			{/* Developer details (expandable) */}
			{(technicalReason || requestId) && (
				<div className="ml-8">
					<button
						onClick={() => setShowDetails((v) => !v)}
						className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
					>
						{showDetails ? (
							<ChevronUp className="h-3 w-3" />
						) : (
							<ChevronDown className="h-3 w-3" />
						)}
						Developer Details
					</button>

					{showDetails && (
						<div className="mt-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5 space-y-1 font-mono text-[11px] text-muted-foreground">
							{requestId && (
								<div className="flex gap-2">
									<span className="text-foreground/50 shrink-0">
										Request ID
									</span>
									<span className="text-foreground/80 break-all">
										{requestId}
									</span>
								</div>
							)}
							{category && (
								<div className="flex gap-2">
									<span className="text-foreground/50 shrink-0">Category</span>
									<span className="text-foreground/80">{category}</span>
								</div>
							)}
							{technicalReason && (
								<div className="flex gap-2">
									<span className="text-foreground/50 shrink-0">Technical</span>
									<span className="text-foreground/80 wrap-break-word">
										{technicalReason}
									</span>
								</div>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
