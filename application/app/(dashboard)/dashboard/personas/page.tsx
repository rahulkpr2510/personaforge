// app/(dashboard)/dashboard/personas/page.tsx
"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PersonaCard } from "@/components/dashboard/PersonaCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { SkeletonCard } from "@/components/dashboard/SkeletonCard";
import { PersonaFormModal } from "@/components/dashboard/PersonaFormModal";
import {
	PlusCircle,
	Library,
	Sparkles,
	AlertCircle,
	X,
	Trash2,
} from "lucide-react";

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
	isPrebuilt?: boolean;
	description?: string | null;
}

export default function PersonasPage() {
	const [prebuilt, setPrebuilt] = useState<Persona[]>([]);
	const [custom, setCustom] = useState<Persona[]>([]);
	const [loading, setLoading] = useState(true);
	const [showModal, setShowModal] = useState(false);
	const [pendingDelete, setPendingDelete] = useState<string | null>(null);

	const fetchPersonas = async () => {
		setLoading(true);
		const res = await fetch("/api/personas");
		const data = await res.json();
		setPrebuilt(data.prebuilt ?? []);
		setCustom(data.custom ?? []);
		setLoading(false);
	};

	useEffect(() => {
		fetchPersonas();
	}, []);

	const handleCreate = async (
		formData: Omit<Persona, "id" | "label" | "isPrebuilt" | "description">,
	) => {
		const res = await fetch("/api/personas", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(formData),
		});
		if (!res.ok) {
			const d = await res.json();
			throw new Error(d.error ?? "Failed to create persona");
		}
		await fetchPersonas();
	};

	const handleDelete = async (id: string) => {
		await fetch(`/api/personas/${id}`, { method: "DELETE" });
		setCustom((c) => c.filter((p) => p.id !== id));
		setPendingDelete(null);
	};

	return (
		<div className="space-y-8">
			<PageHeader
				title="Personas"
				description={`${prebuilt.length} library · ${custom.length}/20 custom`}
				actions={
					<button
						onClick={() => setShowModal(true)}
						className="flex items-center gap-2 rounded-xl bg-(--pf-accent) px-4 py-2.5 text-sm font-semibold text-white shadow-[0_2px_12px_var(--pf-accent,#6366f1)30] hover:opacity-90 hover:-translate-y-0.5 transition-all"
					>
						<PlusCircle className="h-4 w-4" />
						Create Persona
					</button>
				}
			/>

			{/* How it works callout */}
			<div className="grid gap-3 sm:grid-cols-2">
				<div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
					<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-(--pf-accent-soft)">
						<Library className="h-4 w-4 text-(--pf-accent)" />
					</div>
					<div>
						<p className="text-sm font-semibold text-foreground">
							Persona Library
						</p>
						<p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
							Pre-built archetypes curated by PersonaForge. They represent
							common user types like "Mobile-first shopper" or "Enterprise power
							user" — ready to use instantly.
						</p>
					</div>
				</div>
				<div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
					<div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-(--pf-accent-soft)">
						<Sparkles className="h-4 w-4 text-(--pf-accent)" />
					</div>
					<div>
						<p className="text-sm font-semibold text-foreground">
							Custom Personas
						</p>
						<p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
							Define your own user types based on your actual audience. When you
							create one, AI generates a rich portrait so every team member
							understands them instantly.
						</p>
					</div>
				</div>
			</div>

			{loading ? (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{[...Array(6)].map((_, i) => (
						<SkeletonCard key={i} />
					))}
				</div>
			) : (
				<>
					{/* Library personas */}
					{prebuilt.length > 0 && (
						<div>
							<div className="mb-4 flex items-center gap-2">
								<p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
									Persona Library
								</p>
								<span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
									{prebuilt.length}
								</span>
							</div>
							<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
								{prebuilt.map((p) => (
									<PersonaCard
										key={p.id}
										persona={{ ...p, isPrebuilt: true }}
									/>
								))}
							</div>
						</div>
					)}

					{/* Custom personas */}
					<div>
						<div className="mb-4 flex items-center gap-2">
							<p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
								Your Custom Personas
							</p>
							<span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
								{custom.length}/20
							</span>
						</div>

						{custom.length === 0 ? (
							<EmptyState
								icon="Users"
								title="No custom personas yet"
								description="Create personas tailored to your specific user segments. PersonaForge will generate an AI portrait to help your team understand them."
								action={
									<button
										onClick={() => setShowModal(true)}
										className="inline-flex items-center gap-2 rounded-xl bg-(--pf-accent) px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
									>
										<PlusCircle className="h-4 w-4" /> Create Persona
									</button>
								}
							/>
						) : (
							<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
								{custom.map((p) => (
									<div key={p.id} className="relative">
										<PersonaCard
											persona={p}
											onDelete={() => setPendingDelete(p.id)}
										/>
										{/* Inline delete confirm overlay */}
										<AnimatePresence>
											{pendingDelete === p.id && (
												<motion.div
													initial={{ opacity: 0, scale: 0.96 }}
													animate={{ opacity: 1, scale: 1 }}
													exit={{ opacity: 0, scale: 0.96 }}
													transition={{ duration: 0.18 }}
													className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-xl border border-destructive/30 bg-background/95 backdrop-blur-sm p-6"
												>
													<div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
														<AlertCircle className="h-5 w-5 text-destructive" />
													</div>
													<div className="text-center">
														<p className="text-sm font-semibold text-foreground">
															Delete "{p.label}"?
														</p>
														<p className="mt-1 text-xs text-muted-foreground">
															This cannot be undone. Past analyses that used
															this persona are unaffected.
														</p>
													</div>
													<div className="flex gap-2 w-full">
														<button
															onClick={() => setPendingDelete(null)}
															className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs text-muted-foreground hover:bg-muted transition-colors"
														>
															<X className="h-3.5 w-3.5" /> Cancel
														</button>
														<button
															onClick={() => handleDelete(p.id)}
															className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-destructive py-2 text-xs font-medium text-white hover:opacity-90 transition-opacity"
														>
															<Trash2 className="h-3.5 w-3.5" /> Delete
														</button>
													</div>
												</motion.div>
											)}
										</AnimatePresence>
									</div>
								))}
							</div>
						)}
					</div>
				</>
			)}

			<PersonaFormModal
				open={showModal}
				onClose={() => setShowModal(false)}
				onSubmit={handleCreate}
				title="Create Custom Persona"
			/>
		</div>
	);
}
