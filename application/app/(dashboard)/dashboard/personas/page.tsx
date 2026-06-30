// app/(dashboard)/dashboard/personas/page.tsx
"use client";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PersonaCard } from "@/components/dashboard/PersonaCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { SkeletonCard } from "@/components/dashboard/SkeletonCard";
import { PersonaFormModal } from "@/components/dashboard/PersonaFormModal";
import { Users, PlusCircle } from "lucide-react";

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
}

export default function PersonasPage() {
	const [prebuilt, setPrebuilt] = useState<Persona[]>([]);
	const [custom, setCustom] = useState<Persona[]>([]);
	const [loading, setLoading] = useState(true);
	const [showModal, setShowModal] = useState(false);

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
		formData: Omit<Persona, "id" | "label" | "isPrebuilt">,
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
		if (!confirm("Delete this persona?")) return;
		await fetch(`/api/personas/${id}`, { method: "DELETE" });
		setCustom((c) => c.filter((p) => p.id !== id));
	};

	return (
		<div className="space-y-8">
			<PageHeader
				title="Personas"
				description={`${prebuilt.length} library + ${custom.length} custom`}
				actions={
					<button
						onClick={() => setShowModal(true)}
						className="flex items-center gap-2 rounded-xl bg-(--pf-accent) px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
					>
						<PlusCircle className="h-4 w-4" />
						Create Persona
					</button>
				}
			/>

			{loading ? (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{[...Array(6)].map((_, i) => (
						<SkeletonCard key={i} />
					))}
				</div>
			) : (
				<>
					{prebuilt.length > 0 && (
						<div>
							<p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
								Persona Library
							</p>
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

					<div>
						<p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
							Your Custom Personas ({custom.length}/20)
						</p>
						{custom.length === 0 ? (
							<EmptyState
								icon="Users"
								title="No custom personas yet"
								description="Create personas tailored to your specific user segments."
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
									<PersonaCard key={p.id} persona={p} onDelete={handleDelete} />
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
