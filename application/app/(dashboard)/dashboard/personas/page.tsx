"use client";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PersonaApi } from "@/lib/api/personas";
import { PersonaCard } from "@/components/dashboard/PersonaCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { SkeletonCard } from "@/components/dashboard/SkeletonCard";
import { PersonaFormModal } from "@/components/dashboard/PersonaFormModal";
import {
  PlusCircle,
  Search,
  X,
  AlertCircle,
  Trash2,
  Library,
  Sparkles,
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

type Tab = "library" | "custom";

export default function PersonasPage() {
  const [prebuilt, setPrebuilt] = useState<Persona[]>([]);
  const [custom, setCustom] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Persona | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("library");
  const [search, setSearch] = useState("");

  const fetchPersonas = async () => {
    setLoading(true);
    try {
      const data = await PersonaApi.list();
      setPrebuilt(data.prebuilt ?? []);
      setCustom(data.custom ?? []);
    } catch (err) {
      console.error("Failed to fetch personas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonas();
  }, []);

  const handleCreate = async (
    formData: Omit<Persona, "id" | "label" | "isPrebuilt" | "description">,
  ) => {
    await PersonaApi.create(formData);
    await fetchPersonas();
  };

  const handleEdit = async (
    formData: Omit<Persona, "id" | "label" | "isPrebuilt" | "description">,
  ) => {
    if (!editing) return;
    await PersonaApi.update(editing.id, formData);
    setEditing(null);
    await fetchPersonas();
  };

  const handleDelete = async (id: string) => {
    try {
      await PersonaApi.delete(id);
      setCustom((c) => c.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Failed to delete persona:", err);
    } finally {
      setPendingDelete(null);
    }
  };

  const q = search.toLowerCase().trim();

  const filteredPrebuilt = useMemo(
    () =>
      prebuilt.filter(
        (p) =>
          !q ||
          p.label.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          p.occupation.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)),
      ),
    [prebuilt, q],
  );

  const filteredCustom = useMemo(
    () =>
      custom.filter(
        (p) =>
          !q ||
          p.label.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          p.occupation.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)),
      ),
    [custom, q],
  );

  const TABS: {
    value: Tab;
    label: string;
    count: number;
    icon: React.ElementType;
  }[] = [
    {
      value: "library",
      label: "Persona Library",
      count: prebuilt.length,
      icon: Library,
    },
    { value: "custom", label: "Custom", count: custom.length, icon: Sparkles },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personas"
        description={`${prebuilt.length} library · ${custom.length}/20 custom`}
        actions={
          <button
            onClick={() => {
              setEditing(null);
              setShowModal(true);
              setActiveTab("custom");
            }}
            className="flex items-center gap-2 rounded-xl bg-(--pf-accent) px-4 py-2.5 text-sm font-semibold text-white shadow-[0_2px_12px_var(--pf-accent,#6366f1)30] hover:opacity-90 hover:-translate-y-0.5 transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            Create Persona
          </button>
        }
      />

      {/* Search + Tab bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Tab switcher */}
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

        {/* Search */}
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

      <AnimatePresence mode="wait" initial={false}>
        {loading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </motion.div>
        ) : (
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
                {filteredPrebuilt.length === 0 ? (
                  <EmptyState
                    icon="Users"
                    title={
                      search
                        ? "No matching library personas"
                        : "No library personas"
                    }
                    description={
                      search
                        ? `No personas match "${search}"`
                        : "Library personas appear here."
                    }
                  />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredPrebuilt.map((p) => (
                      <PersonaCard
                        key={p.id}
                        persona={{ ...p, isPrebuilt: true }}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Custom tab */}
            {activeTab === "custom" && (
              <>
                {filteredCustom.length === 0 && !search ? (
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
                ) : filteredCustom.length === 0 ? (
                  <EmptyState
                    icon="Users"
                    title="No matching personas"
                    description={`No custom personas match "${search}"`}
                  />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredCustom.map((p) => (
                      <div key={p.id} className="relative">
                        <PersonaCard
                          persona={p}
                          onEdit={() => {
                            setEditing(p);
                            setShowModal(true);
                          }}
                          onDelete={() => setPendingDelete(p.id)}
                        />
                        {/* Delete confirm overlay */}
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
                                  Delete &quot;{p.label}&quot;?
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  This cannot be undone.
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
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <PersonaFormModal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setEditing(null);
        }}
        onSubmit={editing ? handleEdit : handleCreate}
        initial={editing ?? undefined}
        title={editing ? `Edit — ${editing.label}` : "Create Custom Persona"}
      />
    </div>
  );
}
