// components/dashboard/PersonaFormModal.tsx
"use client";
import { useState, useEffect } from "react";
import { X, Plus, Minus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

interface PersonaFormData {
	name: string;
	age: number;
	occupation: string;
	technicalLevel: "LOW" | "MEDIUM" | "HIGH";
	goals: string;
	frustrations: string;
	tags: string[];
}

interface PersonaFormModalProps {
	open: boolean;
	onClose: () => void;
	onSubmit: (data: PersonaFormData) => Promise<void>;
	initial?: Partial<PersonaFormData>;
	title?: string;
}

const defaultForm: PersonaFormData = {
	name: "",
	age: 28,
	occupation: "",
	technicalLevel: "MEDIUM",
	goals: "",
	frustrations: "",
	tags: [],
};

export function PersonaFormModal({
	open,
	onClose,
	onSubmit,
	initial,
	title = "Create Persona",
}: PersonaFormModalProps) {
	const [form, setForm] = useState<PersonaFormData>({
		...defaultForm,
		...initial,
	});
	const [tagInput, setTagInput] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Reset form when initial (editing target) changes
	useEffect(() => {
		setForm({ ...defaultForm, ...initial });
		setTagInput("");
		setError(null);
	}, [initial]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setLoading(true);
		try {
			await onSubmit(form);
			onClose();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Something went wrong");
		} finally {
			setLoading(false);
		}
	};

	const addTag = () => {
		const t = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
		if (t && !form.tags.includes(t) && form.tags.length < 10) {
			setForm((f) => ({ ...f, tags: [...f.tags, t] }));
		}
		setTagInput("");
	};

	const inputCls =
		"w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[var(--pf-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--pf-accent)]/20 transition-all";
	const labelCls = "block text-xs font-medium text-muted-foreground mb-1.5";

	return (
		<AnimatePresence>
			{open && (
				<>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
						onClick={onClose}
					/>
					<motion.div
						initial={{ opacity: 0, scale: 0.96, y: 16 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.96, y: 16 }}
						transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
						className="fixed inset-x-4 top-1/2 z-50 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-2xl sm:inset-x-auto sm:left-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2"
						onClick={(e) => e.stopPropagation()}
					>
						<div className="mb-5 flex items-center justify-between">
							<h2 className="font-heading text-lg font-semibold">{title}</h2>
							<button
								onClick={onClose}
								className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
							>
								<X className="h-4 w-4" />
							</button>
						</div>

						<form
							onSubmit={handleSubmit}
							className="space-y-4 overflow-y-auto max-h-[65vh] pr-1"
						>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className={labelCls}>Name *</label>
									<input
										className={inputCls}
										required
										value={form.name}
										placeholder="e.g. Priya Sharma"
										onChange={(e) =>
											setForm((f) => ({ ...f, name: e.target.value }))
										}
									/>
								</div>
								<div>
									<label className={labelCls}>Age *</label>
									<input
										className={inputCls}
										type="number"
										min={10}
										max={90}
										required
										value={form.age}
										onChange={(e) =>
											setForm((f) => ({ ...f, age: Number(e.target.value) }))
										}
									/>
								</div>
							</div>

							<div>
								<label className={labelCls}>Occupation *</label>
								<input
									className={inputCls}
									required
									value={form.occupation}
									placeholder="e.g. Product Manager"
									onChange={(e) =>
										setForm((f) => ({ ...f, occupation: e.target.value }))
									}
								/>
							</div>

							<div>
								<label className={labelCls}>Technical Level *</label>
								<div className="flex gap-2">
									{(["LOW", "MEDIUM", "HIGH"] as const).map((level) => (
										<button
											key={level}
											type="button"
											onClick={() =>
												setForm((f) => ({ ...f, technicalLevel: level }))
											}
											className={cn(
												"flex-1 rounded-lg border py-2 text-xs font-medium transition-all",
												form.technicalLevel === level
													? "border-(--pf-accent) bg-(--pf-accent-soft) text-(--pf-accent)"
													: "border-input bg-background text-muted-foreground hover:border-(--pf-accent)/50",
											)}
										>
											{level.charAt(0) + level.slice(1).toLowerCase()}
										</button>
									))}
								</div>
							</div>

							<div>
								<label className={labelCls}>Goals *</label>
								<textarea
									className={cn(inputCls, "min-h-[80px] resize-none")}
									required
									value={form.goals}
									placeholder="What does this persona want to achieve?"
									onChange={(e) =>
										setForm((f) => ({ ...f, goals: e.target.value }))
									}
								/>
							</div>

							<div>
								<label className={labelCls}>Frustrations *</label>
								<textarea
									className={cn(inputCls, "min-h-[80px] resize-none")}
									required
									value={form.frustrations}
									placeholder="What annoys or blocks this persona?"
									onChange={(e) =>
										setForm((f) => ({ ...f, frustrations: e.target.value }))
									}
								/>
							</div>

							<div>
								<label className={labelCls}>Tags</label>
								<div className="flex gap-2">
									<input
										className={cn(inputCls, "flex-1")}
										value={tagInput}
										placeholder="Add a tag and press Enter"
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												e.preventDefault();
												addTag();
											}
										}}
										onChange={(e) => setTagInput(e.target.value)}
									/>
									<button
										type="button"
										onClick={addTag}
										className="flex items-center gap-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors"
									>
										<Plus className="h-4 w-4" />
									</button>
								</div>
								{form.tags.length > 0 && (
									<div className="mt-2 flex flex-wrap gap-1.5">
										{form.tags.map((tag) => (
											<span
												key={tag}
												className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
											>
												#{tag}
												<button
													type="button"
													onClick={() =>
														setForm((f) => ({
															...f,
															tags: f.tags.filter((t) => t !== tag),
														}))
													}
													className="text-muted-foreground hover:text-destructive transition-colors"
												>
													<Minus className="h-2.5 w-2.5" />
												</button>
											</span>
										))}
									</div>
								)}
							</div>

							{error && (
								<p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
									{error}
								</p>
							)}

							<div className="flex gap-3 pt-2">
								<button
									type="button"
									onClick={onClose}
									className="flex-1 rounded-lg border border-input py-2.5 text-sm text-muted-foreground hover:bg-accent transition-colors"
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={loading}
									className="flex-1 rounded-lg bg-(--pf-accent) py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-all"
								>
									{loading ? "Saving…" : "Save Persona"}
								</button>
							</div>
						</form>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}
