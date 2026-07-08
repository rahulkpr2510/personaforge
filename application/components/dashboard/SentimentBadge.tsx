import { cn } from "@/lib/utils";

type Sentiment = "POSITIVE" | "NEUTRAL" | "NEGATIVE";

const config: Record<
	Sentiment,
	{ label: string; emoji: string; class: string }
> = {
	POSITIVE: {
		label: "Positive",
		emoji: "↑",
		class:
			"bg-[var(--pf-green-soft)] text-[var(--pf-green)] border-[var(--pf-green)]/20",
	},
	NEUTRAL: {
		label: "Neutral",
		emoji: "→",
		class: "bg-muted text-muted-foreground border-border",
	},
	NEGATIVE: {
		label: "Negative",
		emoji: "↓",
		class: "bg-destructive/10 text-destructive border-destructive/20",
	},
};

export function SentimentBadge({ sentiment }: { sentiment: Sentiment | null }) {
	if (!sentiment) return null;
	const { label, emoji, class: cls } = config[sentiment];
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
				cls,
			)}
		>
			<span className="font-mono">{emoji}</span>
			{label}
		</span>
	);
}
