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
	CheckCircle2,
	Info,
} from "lucide-react";
import { PersonaCard } from "./PersonaCard";
import { cn } from "@/lib/utils";
import { AnalysisApi } from "@/lib/api/analyses";
import { ErrorCard } from "./ErrorCard";
import { AppError } from "@/lib/api/types";

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
	description?: string | null;
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
	const [submitError, setSubmitError] = useState<AppError | Error | null>(null);

	const allPersonas = [...prebuiltPersonas, ...customPersonas];

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
		setSubmitError(null);
		try {
			const result = await AnalysisApi.create({
				url,
				personaIds: selectedPersonaIds,
				customPersonas: [],
				deviceType,
			});
			router.push(`/dashboard/analyses/${result.analysisId}`);
		} catch (err) {
			setSubmitError(err instanceof Error ? err : new Error("Failed to start analysis"));
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

	const selectedPersonas = allPersonas.filter((p) =>
		selectedPersonaIds.includes(p.id),
	);

	return (
		<div>
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
					{/* ── Step 1: URL + Device ── */}
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
										We'll crawl up to 10 pages and capture how each persona
										reacts to your product.
									</p>
								</div>
							</div>

							<div className="space-y-5">
								<div>
									<label className="block text-xs font-medium text-muted-foreground mb-2">
										Website URL <span className="text-destructive">*</span>
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
									<p className="mt-1.5 text-xs text-muted-foreground">
										Include the full URL with{" "}
										<code className="bg-muted px-1 rounded">https://</code>
									</p>
								</div>

								<div>
									<label className="block text-xs font-medium text-muted-foreground mb-2">
										Device type
									</label>
									<p className="mb-3 text-xs text-muted-foreground">
										Personas will evaluate the site as if they're browsing on
										this device — this affects layout, navigation, and
										interaction patterns.
									</p>
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
														{d === "DESKTOP" ? "Desktop" : "Mobile"}
													</p>
													<p className="text-xs text-muted-foreground">
														{d === "DESKTOP"
															? "Full layout, keyboard & mouse"
															: "Touch-first, smaller viewport"}
													</p>
												</div>
											</button>
										))}
									</div>
								</div>
							</div>
						</motion.div>
					)}

					{/* ── Step 2: Persona Selection ── */}
					{step === 2 && (
						<motion.div
							key="step2"
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: -20 }}
							transition={{ duration: 0.2 }}
						>
							<div className="mb-5 flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-(--pf-accent-soft)">
									<Users className="h-5 w-5 text-(--pf-accent)" />
								</div>
								<div>
									<h2 className="font-heading text-lg font-semibold">
										Choose personas
									</h2>
									<p className="text-sm text-muted-foreground">
										Select up to 5 people who will evaluate your product
									</p>
								</div>
							</div>

							{/* Progress bar */}
							<div className="mb-5">
								<div className="flex items-center justify-between mb-1.5">
									<span className="text-xs text-muted-foreground">
										{selectedPersonaIds.length === 0
											? "Select at least 1 persona"
											: `${selectedPersonaIds.length} of 5 selected`}
									</span>
									{selectedPersonaIds.length === 5 && (
										<span className="text-xs font-medium text-(--pf-amber)">
											Maximum reached
										</span>
									)}
								</div>
								<div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
									<motion.div
										className="h-full rounded-full bg-(--pf-accent)"
										animate={{
											width: `${(selectedPersonaIds.length / 5) * 100}%`,
										}}
										transition={{ type: "spring", stiffness: 200, damping: 24 }}
									/>
								</div>
							</div>

							{/* Info tip */}
							<div className="mb-5 flex items-start gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
								<Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
								<p className="text-xs text-muted-foreground leading-relaxed">
									Each persona independently browses your product and writes a
									report with positives, pain points, and actionable
									recommendations. More diverse personas = richer insights.
								</p>
							</div>

							{prebuiltPersonas.length > 0 && (
								<div className="mb-5">
									<p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
										Persona Library
									</p>
									<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
									<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

					{/* ── Step 3: Review ── */}
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
										Review your settings — this typically takes 2–5 minutes
									</p>
								</div>
							</div>

							<div className="space-y-3">
								{/* URL */}
								<div className="flex items-start justify-between rounded-xl bg-muted/40 px-4 py-3">
									<span className="text-xs text-muted-foreground mt-0.5">
										Target URL
									</span>
									<span className="font-medium text-sm truncate max-w-[60%] text-right text-foreground">
										{url}
									</span>
								</div>

								{/* Device */}
								<div className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">
									<span className="text-xs text-muted-foreground">Device</span>
									<span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
										{deviceType === "DESKTOP" ? (
											<Monitor className="h-3.5 w-3.5 text-muted-foreground" />
										) : (
											<Smartphone className="h-3.5 w-3.5 text-muted-foreground" />
										)}
										{deviceType === "DESKTOP" ? "Desktop" : "Mobile"}
									</span>
								</div>

								{/* Personas */}
								<div className="rounded-xl bg-muted/40 px-4 py-3">
									<div className="flex items-center justify-between mb-3">
										<span className="text-xs text-muted-foreground">
											Personas ({selectedPersonas.length})
										</span>
									</div>
									<div className="space-y-2">
										{selectedPersonas.map((p) => (
											<div key={p.id} className="flex items-center gap-2.5">
												<CheckCircle2 className="h-3.5 w-3.5 text-(--pf-green) shrink-0" />
												<span className="text-sm font-medium text-foreground">
													{p.label}
												</span>
												<span className="text-xs text-muted-foreground ml-auto">
													{p.name}, {p.age}y
												</span>
											</div>
										))}
									</div>
								</div>

								{/* What happens next */}
								<div className="rounded-xl border border-(--pf-accent)/20 bg-(--pf-accent-soft) px-4 py-3">
									<p className="text-xs font-semibold text-(--pf-accent) mb-1">
										What happens next
									</p>
									<p className="text-xs text-foreground/80 leading-relaxed">
										PersonaForge will crawl the URL, take screenshots, then
										simulate how each persona experiences your product. You'll
										get a detailed report with friction scores, sentiment
										analysis, and actionable recommendations.
									</p>
								</div>
							</div>

							{submitError && (
								<div className="mt-4">
									<ErrorCard
										error={submitError}
										onRetry={() => handleSubmit()}
									/>
								</div>
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
						className="ml-auto flex items-center gap-2 rounded-xl bg-(--pf-accent) px-6 py-2.5 text-sm font-semibold text-white shadow-[0_2px_12px_var(--pf-accent,#6366f1)30] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
					>
						{step === 3
							? loading
								? "Starting analysis…"
								: "Start Analysis"
							: "Continue"}
						{step < 3 && <ChevronRight className="h-4 w-4" />}
					</button>
				</div>
			</div>
		</div>
	);
}
