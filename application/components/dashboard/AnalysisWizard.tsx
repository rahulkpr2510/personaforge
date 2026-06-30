// components/dashboard/AnalysisWizard.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
	Globe,
	Monitor,
	Smartphone,
	ChevronRight,
	ChevronLeft,
	Zap,
	Users,
} from "lucide-react";
import { PersonaCard } from "./PersonaCard";
import { cn } from "@/lib/utils";

interface Persona {
	id: string;
	label: string;
	name: string;
	age: number;
	occupation: string;
	technicalLevel: "LOW" | "MEDIUM" | "HIGH";
	goals: string;
	frustrations: string;
	tags: string[];
}

interface AnalysisWizardProps {
	prebuiltPersonas: Persona[];
	customPersonas: Persona[];
}

type Step = 1 | 2 | 3;

export function AnalysisWizard({
	prebuiltPersonas,
	customPersonas,
}: AnalysisWizardProps) {
	const router = useRouter();
	const [step, setStep] = useState<Step>(1);
	const [url, setUrl] = useState("");
	const [deviceType, setDeviceType] = useState<"DESKTOP" | "MOBILE">("DESKTOP");
	const [selectedPersonaIds, setSelectedPersonaIds] = useState<string[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const togglePersona = (id: string) => {
		setSelectedPersonaIds((prev) =>
			prev.includes(id)
				? prev.filter((p) => p !== id)
				: prev.length < 5
					? [...prev, id]
					: prev,
		);
	};

	const handleSubmit = async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await fetch("/api/analyses", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					url,
					personaIds: selectedPersonaIds,
					customPersonas: [],
					deviceType,
				}),
			});
			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error ?? "Failed to start analysis");
			}
			const { analysisId } = await res.json();
			router.push(`/dashboard/analyses/${analysisId}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to start analysis");
			setLoading(false);
		}
	};

	const steps = [
		{ n: 1, label: "Target URL" },
		{ n: 2, label: "Personas" },
		{ n: 3, label: "Review" },
	];

	const inputCls =
		"w-full rounded-lg border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-[var(--pf-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--pf-accent)]/20 transition-all";

	return (
		<div className="mx-auto max-w-2xl">
			{/* Step indicator */}
			<div className="mb-8 flex items-center justify-between">
				{steps.map((s, i) => (
					<div key={s.n} className="flex flex-1 items-center">
						<div className="flex flex-col items-center">
							<div
								className={cn(
									"flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300",
									step === s.n
										? "bg-(--pf-accent) text-white shadow-md"
										: step > s.n
											? "bg-(--pf-green) text-white"
											: "bg-muted text-muted-foreground",
								)}
							>
								{step > s.n ? "✓" : s.n}
							</div>
							<span
								className={cn(
									"mt-1.5 text-xs font-medium hidden sm:block",
									step === s.n ? "text-(--pf-accent)" : "text-muted-foreground",
								)}
							>
								{s.label}
							</span>
						</div>
						{i < steps.length - 1 && (
							<div
								className={cn(
									"mx-2 flex-1 h-px transition-colors duration-500",
									step > s.n ? "bg-(--pf-green)" : "bg-border",
								)}
							/>
						)}
					</div>
				))}
			</div>

			{/* Step content */}
			<div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
				<AnimatePresence mode="wait">
					{step === 1 && (
						<motion.div
							key="step1"
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
							transition={{ duration: 0.2 }}
						>
							<div className="mb-6 flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--pf-accent-soft)">
									<Globe className="h-5 w-5 text-(--pf-accent)" />
								</div>
								<div>
									<h2 className="font-heading text-lg font-semibold">
										Enter target URL
									</h2>
									<p className="text-sm text-muted-foreground">
										We'll crawl and analyse your product or page
									</p>
								</div>
							</div>

							<div className="space-y-5">
								<div>
									<label className="block text-xs font-medium text-muted-foreground mb-2">
										URL *
									</label>
									<div className="relative">
										<Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
										<input
											className={cn(inputCls, "pl-10")}
											type="url"
											value={url}
											placeholder="https://your-product.com"
											onChange={(e) => setUrl(e.target.value)}
										/>
									</div>
								</div>

								<div>
									<label className="block text-xs font-medium text-muted-foreground mb-2">
										Device type
									</label>
									<div className="grid grid-cols-2 gap-3">
										{(["DESKTOP", "MOBILE"] as const).map((d) => (
											<button
												key={d}
												type="button"
												onClick={() => setDeviceType(d)}
												className={cn(
													"flex items-center gap-3 rounded-xl border p-4 text-left transition-all",
													deviceType === d
														? "border-(--pf-accent) bg-(--pf-accent-soft)"
														: "border-border bg-background hover:border-(--pf-accent)/50",
												)}
											>
												{d === "DESKTOP" ? (
													<Monitor
														className={cn(
															"h-5 w-5",
															deviceType === d
																? "text-(--pf-accent)"
																: "text-muted-foreground",
														)}
													/>
												) : (
													<Smartphone
														className={cn(
															"h-5 w-5",
															deviceType === d
																? "text-(--pf-accent)"
																: "text-muted-foreground",
														)}
													/>
												)}
												<div>
													<p
														className={cn(
															"text-sm font-medium",
															deviceType === d
																? "text-(--pf-accent)"
																: "text-foreground",
														)}
													>
														{d.charAt(0) + d.slice(1).toLowerCase()}
													</p>
													<p className="text-xs text-muted-foreground">
														{d === "DESKTOP" ? "Full layout" : "Touch-first"}
													</p>
												</div>
											</button>
										))}
									</div>
								</div>
							</div>
						</motion.div>
					)}

					{step === 2 && (
						<motion.div
							key="step2"
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
							transition={{ duration: 0.2 }}
						>
							<div className="mb-6 flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--pf-accent-soft)">
									<Users className="h-5 w-5 text-(--pf-accent)" />
								</div>
								<div>
									<h2 className="font-heading text-lg font-semibold">
										Choose personas
									</h2>
									<p className="text-sm text-muted-foreground">
										Select up to 5 personas · {selectedPersonaIds.length}/5
										selected
									</p>
								</div>
							</div>

							{prebuiltPersonas.length > 0 && (
								<div className="mb-5">
									<p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
										Persona Library
									</p>
									<div className="grid gap-3 sm:grid-cols-2">
										{prebuiltPersonas.map((p) => (
											<PersonaCard
												key={p.id}
												persona={p}
												selectable
												selected={selectedPersonaIds.includes(p.id)}
												onSelect={togglePersona}
											/>
										))}
									</div>
								</div>
							)}

							{customPersonas.length > 0 && (
								<div>
									<p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
										Your Custom Personas
									</p>
									<div className="grid gap-3 sm:grid-cols-2">
										{customPersonas.map((p) => (
											<PersonaCard
												key={p.id}
												persona={p}
												selectable
												selected={selectedPersonaIds.includes(p.id)}
												onSelect={togglePersona}
											/>
										))}
									</div>
								</div>
							)}
						</motion.div>
					)}

					{step === 3 && (
						<motion.div
							key="step3"
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
							transition={{ duration: 0.2 }}
						>
							<div className="mb-6 flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--pf-green-soft)">
									<Zap className="h-5 w-5 text-(--pf-green)" />
								</div>
								<div>
									<h2 className="font-heading text-lg font-semibold">
										Ready to analyse
									</h2>
									<p className="text-sm text-muted-foreground">
										Review your settings before starting
									</p>
								</div>
							</div>

							<div className="space-y-4 rounded-xl bg-muted/40 p-5 text-sm">
								<div className="flex justify-between">
									<span className="text-muted-foreground">URL</span>
									<span className="font-medium truncate max-w-xs text-right">
										{url}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Device</span>
									<span className="font-medium">
										{deviceType.charAt(0) + deviceType.slice(1).toLowerCase()}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-muted-foreground">Personas</span>
									<span className="font-medium">
										{selectedPersonaIds.length} selected
									</span>
								</div>
							</div>

							{error && (
								<p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
									{error}
								</p>
							)}
						</motion.div>
					)}
				</AnimatePresence>

				{/* Navigation */}
				<div className="mt-8 flex gap-3">
					{step > 1 && (
						<button
							onClick={() => setStep((s) => (s - 1) as Step)}
							className="flex items-center gap-2 rounded-xl border border-input px-4 py-2.5 text-sm text-muted-foreground hover:bg-accent transition-colors"
						>
							<ChevronLeft className="h-4 w-4" /> Back
						</button>
					)}
					<button
						onClick={() =>
							step < 3 ? setStep((s) => (s + 1) as Step) : handleSubmit()
						}
						disabled={
							(step === 1 && !url) ||
							(step === 2 && selectedPersonaIds.length === 0) ||
							loading
						}
						className="ml-auto flex items-center gap-2 rounded-xl bg-(--pf-accent) px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40 transition-all"
					>
						{step === 3
							? loading
								? "Starting…"
								: "Start Analysis"
							: "Continue"}
						{step < 3 && <ChevronRight className="h-4 w-4" />}
					</button>
				</div>
			</div>
		</div>
	);
}
