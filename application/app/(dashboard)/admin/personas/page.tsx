"use client";
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PersonaCard } from "@/components/dashboard/PersonaCard";
import { PersonaFormModal } from "@/components/dashboard/PersonaFormModal";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { SkeletonCard } from "@/components/dashboard/SkeletonCard";
import { Library, Sparkles, PlusCircle, Search, X, ToggleLeft, ToggleRight } from "lucide-react";
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

type Tab = "library" | "custom";

export default function AdminPersonasPage() {
	const [personas, setPersonas] = useState<AdminPersona[]>([]);
	const [loading, setLoading] = useState(true);
	const [showModal, setShowModal] = useState(false);
	const [editing, setEditing] = useState<AdminPersona | null>(null);
	const [toggling, setToggling] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<Tab>("library");
	const [search, setSearch] = useState("");

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
		formData: Omit<AdminPersona, "id" | "label" | "isPrebuilt" | "isActive" | "_count">,
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
		formData: Omit<AdminPersona, "id" | "label" | "isPrebuilt" | "isActive" | "_count">,
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
		if (!confirm("Delete this persona? This cannot be undone.")) return;
		await fetch(`/api/admin/personas/${id}`, { method: "DELETE" });
		setPersonas((ps) => ps.filter((p) => p.id !== id));
	};

	const libraryPersonas = personas.filter((p) => p.isPrebuilt);
	const customPersonas = personas.filter((p) => !p.isPrebuilt);

	const q = search.toLowerCase().trim();

	const filteredLibrary = useMemo(
		() =>
			libraryPersonas.filter(
				(p) =>
					!q ||
					p.label.toLowerCase().includes(q) ||
					p.name.toLowerCase().includes(q) ||
					p.occupation.toLowerCase().includes(q),
			),
		[libraryPersonas, q],
	);

	const filteredCustom = useMemo(
		() =>
			customPersonas.filter(
				(p) =>
					!q ||
					p.label.toLowerCase().includes(q) ||
					p.name.toLowerCase().includes(q) ||
					p.occupation.toLowerCase().includes(q),
			),
		[customPersonas, q],
	);

	const TABS: { value: Tab; label: string; count: number; icon: React.ElementType }[] = [
		{ value: "library", label: "Library", count: libraryPersonas.length, icon: Library },
		{ value: "custom", label: "Custom", count: customPersonas.length, icon: Sparkles },
	];

	return (
		<div className="space-y-6">
			<PageHeader
				title="Persona Library"
				description={`${libraryPersonas.filter((p) => p.isActive).length} active library · ${customPersonas.length} custom`}
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

			{/* Tab + Search bar */}
			<div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
				<div className="flex items-center gap-0.5 rounded-lg border border-border bg-muted/40 p-0.5">
					{TABS.map((tab) => {
						const Icon = tab.icon;
						return (
							<button
								key={tab.value}
								onClick={() => setActiveTab(tab.value)}
								className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
									activeTab === tab.value
										? "bg-card text-foreground shadow-sm border border-border"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								<Icon className="h-3.5 w-3.5" />
								{tab.label}
								<span
									className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
										activeTab === tab.value
											? "bg-(--pf-accent)/15 text-(--pf-accent)"
											: "bg-muted text-muted-foreground"
									}`}
								>
									{tab.count}
								</span>
							</button>
						);
					})}
				</div>

				<div className="relative flex-1 max-w-xs">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
					<input
						type="text"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search personas…"
						className="w-full rounded-lg border border-border bg-card pl-9 pr-8 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-(--pf-accent)/30 focus:border-(--pf-accent)/50 transition-all"
					/>
					{search && (
						<button
							onClick={() => setSearch("")}
							className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
						>
							<X className="h-3 w-3" />
						</button>
					)}
				</div>
			</div>

			{loading ? (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{[...Array(6)].map((_, i) => (
						<SkeletonCard key={i} />
					))}
				</div>
			) : (
				<AnimatePresence mode="wait" initial={false}>
					<motion.div
						key={activeTab}
						initial={{ opacity: 0, y: 6 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -4 }}
						transition={{ duration: 0.2 }}
					>
						{/* Library tab */}
						{activeTab === "library" && (
							<>
								{filteredLibrary.length === 0 ? (
									<EmptyState
										icon="UserCog"
										title={search ? "No matching personas" : "No library personas yet"}
										description="Add personas to the library so all users can access them."
										action={
											!search ? (
												<button
													onClick={() => setShowModal(true)}
													className="inline-flex items-center gap-2 rounded-xl bg-(--pf-accent) px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
												>
													<PlusCircle className="h-4 w-4" /> Add First Persona
												</button>
											) : undefined
										}
									/>
								) : (
									<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
										{filteredLibrary.map((persona) => (
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
								)}
							</>
						)}

						{/* Custom tab */}
						{activeTab === "custom" && (
							<>
								{filteredCustom.length === 0 ? (
									<EmptyState
										icon="Users"
										title={search ? "No matching personas" : "No custom personas yet"}
										description="Custom personas created by users appear here."
									/>
								) : (
									<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
										{filteredCustom.map((persona) => (
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
								)}
							</>
						)}
					</motion.div>
				</AnimatePresence>
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

/* ─── Admin persona card overlay ─── */
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
		<div className={cn("relative h-full", !persona.isActive && "opacity-60")}>
			{/* Usage count badge */}
			<div className="absolute right-3 top-3 z-20">
				<span className="rounded-full bg-muted/95 backdrop-blur-xs px-2 py-0.5 text-xs text-muted-foreground tabular-nums border border-border/40">
					{persona._count.analysisPersonas} uses
				</span>
			</div>

			<PersonaCard
				persona={{ ...persona, isPrebuilt: false }} // hide Library badge
				className={cn(
					"transition-all duration-200",
					!persona.isActive && "border-dashed",
				)}
				footerActions={
					<div className="flex items-center gap-1.5 w-full">
						<button
							onClick={onToggle}
							disabled={toggling}
							title={persona.isActive ? "Deactivate" : "Activate"}
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
