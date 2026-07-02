// app/(dashboard)/admin/personas/page.tsx
"use client";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PersonaCard } from "@/components/dashboard/PersonaCard";
import { PersonaFormModal } from "@/components/dashboard/PersonaFormModal";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { SkeletonCard } from "@/components/dashboard/SkeletonCard";
import { UserCog, PlusCircle, ToggleLeft, ToggleRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminPersona {
	id: string;
	label: string;
	name: string;
	age: number;
	occupation: string;
	technicalLevel: "LOW" | "MEDIUM" | "HIGH";
	goals: string;
	frustrations: string;
	tags: string[];
	isActive: boolean;
	isPrebuilt: boolean;
	description?: string | null;
	_count: { analysisPersonas: number };
}

export default function AdminPersonasPage() {
	const [personas, setPersonas] = useState<AdminPersona[]>([]);
	const [loading, setLoading] = useState(true);
	const [showModal, setShowModal] = useState(false);
	const [editing, setEditing] = useState<AdminPersona | null>(null);
	const [toggling, setToggling] = useState<string | null>(null);

	const fetchPersonas = async () => {
		setLoading(true);
		const res = await fetch("/api/admin/personas");
		const data = await res.json();
		setPersonas(data.personas ?? []);
		setLoading(false);
	};

	useEffect(() => {
		fetchPersonas();
	}, []);

	const handleCreate = async (
		formData: Omit<
			AdminPersona,
			"id" | "label" | "isPrebuilt" | "isActive" | "_count"
		>,
	) => {
		const res = await fetch("/api/admin/personas", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ ...formData, isPrebuilt: true }),
		});
		if (!res.ok) {
			const d = await res.json();
			throw new Error(d.error ?? "Failed to create persona");
		}
		await fetchPersonas();
	};

	const handleEdit = async (
		formData: Omit<
			AdminPersona,
			"id" | "label" | "isPrebuilt" | "isActive" | "_count"
		>,
	) => {
		if (!editing) return;
		const res = await fetch(`/api/admin/personas/${editing.id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(formData),
		});
		if (!res.ok) {
			const d = await res.json();
			throw new Error(d.error ?? "Failed to update persona");
		}
		setEditing(null);
		await fetchPersonas();
	};

	const toggleActive = async (id: string, current: boolean) => {
		setToggling(id);
		await fetch(`/api/admin/personas/${id}`, {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ isActive: !current }),
		});
		setPersonas((ps) =>
			ps.map((p) => (p.id === id ? { ...p, isActive: !current } : p)),
		);
		setToggling(null);
	};

	const handleDelete = async (id: string) => {
		if (!confirm("Delete this prebuilt persona? This cannot be undone."))
			return;
		await fetch(`/api/admin/personas/${id}`, { method: "DELETE" });
		setPersonas((ps) => ps.filter((p) => p.id !== id));
	};

	const active = personas.filter((p) => p.isActive);
	const inactive = personas.filter((p) => !p.isActive);

	return (
		<div className="space-y-8">
			<PageHeader
				title="Persona Library"
				description={`${active.length} active · ${inactive.length} inactive`}
				actions={
					<button
						onClick={() => {
							setEditing(null);
							setShowModal(true);
						}}
						className="flex items-center gap-2 rounded-xl bg-(--pf-accent) px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
					>
						<PlusCircle className="h-4 w-4" />
						Add Persona
					</button>
				}
			/>

			{loading ? (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{[...Array(6)].map((_, i) => (
						<SkeletonCard key={i} />
					))}
				</div>
			) : personas.length === 0 ? (
				<EmptyState
					icon="UserCog"
					title="No prebuilt personas yet"
					description="Add personas to the library so all users can access them when running analyses."
					action={
						<button
							onClick={() => setShowModal(true)}
							className="inline-flex items-center gap-2 rounded-xl bg-(--pf-accent) px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
						>
							<PlusCircle className="h-4 w-4" /> Add First Persona
						</button>
					}
				/>
			) : (
				<>
					{/* Active personas */}
					{active.length > 0 && (
						<div>
							<p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
								Active ({active.length})
							</p>
							<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
								{active.map((persona) => (
									<AdminPersonaCard
										key={persona.id}
										persona={persona}
										toggling={toggling === persona.id}
										onEdit={() => {
											setEditing(persona);
											setShowModal(true);
										}}
										onToggle={() => toggleActive(persona.id, persona.isActive)}
										onDelete={() => handleDelete(persona.id)}
									/>
								))}
							</div>
						</div>
					)}

					{/* Inactive personas */}
					{inactive.length > 0 && (
						<div>
							<p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
								Inactive ({inactive.length})
							</p>
							<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 opacity-60">
								{inactive.map((persona) => (
									<AdminPersonaCard
										key={persona.id}
										persona={persona}
										toggling={toggling === persona.id}
										onEdit={() => {
											setEditing(persona);
											setShowModal(true);
										}}
										onToggle={() => toggleActive(persona.id, persona.isActive)}
										onDelete={() => handleDelete(persona.id)}
									/>
								))}
							</div>
						</div>
					)}
				</>
			)}

			{/* Create / Edit modal */}
			<PersonaFormModal
				open={showModal}
				onClose={() => {
					setShowModal(false);
					setEditing(null);
				}}
				onSubmit={editing ? handleEdit : handleCreate}
				initial={editing ?? undefined}
				title={editing ? `Edit — ${editing.label}` : "Add Library Persona"}
			/>
		</div>
	);
}

/* ─── Local sub-component (admin-only card overlay) ─── */
interface AdminPersonaCardProps {
	persona: AdminPersona;
	toggling: boolean;
	onEdit: () => void;
	onToggle: () => void;
	onDelete: () => void;
}

function AdminPersonaCard({
	persona,
	toggling,
	onEdit,
	onToggle,
	onDelete,
}: AdminPersonaCardProps) {
	return (
		<div className="relative h-full">
			{/* Usage count badge overlaid top-right */}
			<div className="absolute right-3 top-3 z-20">
				<span className="rounded-full bg-muted/95 backdrop-blur-xs px-2 py-0.5 text-xs text-muted-foreground tabular-nums border border-border/40">
					{persona._count.analysisPersonas} uses
				</span>
			</div>

			<PersonaCard
				persona={persona}
				className={cn(
					"transition-all duration-200",
					persona.isActive ? "" : "border-dashed opacity-75",
				)}
				footerActions={
					<div className="flex items-center gap-1.5 w-full">
						<button
							onClick={onToggle}
							disabled={toggling}
							title={
								persona.isActive
									? "Deactivate for all users"
									: "Activate for all users"
							}
							className={cn(
								"flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
								persona.isActive
									? "text-(--pf-green) hover:bg-(--pf-green-soft)"
									: "text-muted-foreground hover:bg-accent",
							)}
						>
							{persona.isActive ? (
								<ToggleRight className="h-4 w-4" />
							) : (
								<ToggleLeft className="h-4 w-4" />
							)}
							{toggling ? "…" : persona.isActive ? "Active" : "Inactive"}
						</button>

						<div className="ml-auto flex items-center gap-1">
							<button
								onClick={onEdit}
								className="rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
							>
								Edit
							</button>
							<button
								onClick={onDelete}
								className="rounded-lg px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors"
							>
								Delete
							</button>
						</div>
					</div>
				}
			/>
		</div>
	);
}
