// app/(dashboard)/admin/users/page.tsx
"use client";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DataTable } from "@/components/dashboard/DataTable";
import { SkeletonRow } from "@/components/dashboard/SkeletonCard";

interface AdminUser {
	id: string;
	email: string;
	name: string | null;
	role: "USER" | "ADMIN";
	createdAt: string;
	_count: { analyses: number; personas: number };
}

export default function AdminUsersPage() {
	const [users, setUsers] = useState<AdminUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [updating, setUpdating] = useState<string | null>(null);

	const fetchUsers = async () => {
		setLoading(true);
		const res = await fetch("/api/admin/users");
		const data = await res.json();
		setUsers(data.users ?? []);
		setLoading(false);
	};

	useEffect(() => {
		fetchUsers();
	}, []);

	const toggleRole = async (userId: string, currentRole: "USER" | "ADMIN") => {
		const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
		if (!confirm(`Change role to ${newRole}?`)) return;
		setUpdating(userId);
		await fetch("/api/admin/users", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ userId, role: newRole }),
		});
		await fetchUsers();
		setUpdating(null);
	};

	return (
		<div className="space-y-6">
			<PageHeader title="Users" description={`${users.length} registered`} />

			{loading ? (
				<div className="rounded-xl border border-border bg-card overflow-hidden">
					{[...Array(6)].map((_, i) => (
						<SkeletonRow key={i} />
					))}
				</div>
			) : (
				<DataTable
					data={users}
					keyExtractor={(r) => r.id}
					columns={[
						{
							key: "email",
							header: "User",
							sortable: true,
							render: (row) => (
								<div>
									<p className="font-medium text-foreground text-sm">
										{row.name ?? "—"}
									</p>
									<p className="text-xs text-muted-foreground">{row.email}</p>
								</div>
							),
						},
						{
							key: "role",
							header: "Role",
							render: (row) => (
								<span
									className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${row.role === "ADMIN" ? "border-(--pf-amber)/20 bg-(--pf-amber-soft) text-(--pf-amber)" : "border-border bg-muted text-muted-foreground"}`}
								>
									{row.role}
								</span>
							),
						},
						{
							key: "_count",
							header: "Analyses",
							render: (row) => (
								<span className="tabular-nums text-sm">
									{row._count.analyses}
								</span>
							),
						},
						{
							key: "createdAt",
							header: "Joined",
							sortable: true,
							render: (row) => (
								<span className="text-xs text-muted-foreground">
									{new Date(row.createdAt).toLocaleDateString("en-IN")}
								</span>
							),
						},
						{
							key: "actions",
							header: "",
							render: (row) => (
								<button
									onClick={() => toggleRole(row.id, row.role)}
									disabled={updating === row.id}
									className="rounded-lg border border-input px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40 transition-colors"
								>
									{updating === row.id
										? "…"
										: row.role === "ADMIN"
											? "Revoke Admin"
											: "Make Admin"}
								</button>
							),
						},
					]}
				/>
			)}
		</div>
	);
}
