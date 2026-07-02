// app/(dashboard)/admin/users/page.tsx
"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { SkeletonRow } from "@/components/dashboard/SkeletonCard";
import {
	Users,
	ShieldCheck,
	User,
	AlertCircle,
	X,
	ChevronRight,
	Search,
	Calendar,
	FlaskConical,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminUser {
	id: string;
	email: string;
	name: string | null;
	role: "USER" | "ADMIN";
	createdAt: string;
	_count: { analyses: number; personas: number };
}

type RoleFilter = "ALL" | "ADMIN" | "USER";

function getInitials(name: string | null, email: string) {
	if (name) return name.slice(0, 2).toUpperCase();
	return email.slice(0, 2).toUpperCase();
}

const avatarColors = [
	"bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400",
	"bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
	"bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
	"bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
	"bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400",
];

function getAvatarColor(str: string) {
	let h = 0;
	for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
	return avatarColors[Math.abs(h) % avatarColors.length];
}

export default function AdminUsersPage() {
	const [users, setUsers] = useState<AdminUser[]>([]);
	const [currentUserId, setCurrentUserId] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [updating, setUpdating] = useState<string | null>(null);
	const [pendingChange, setPendingChange] = useState<{
		userId: string;
		from: "USER" | "ADMIN";
		to: "USER" | "ADMIN";
	} | null>(null);
	const [filter, setFilter] = useState<RoleFilter>("ALL");
	const [search, setSearch] = useState("");

	const fetchUsers = async () => {
		setLoading(true);
		const res = await fetch("/api/admin/users");
		const data = await res.json();
		setUsers(data.users ?? []);
		setCurrentUserId(data.currentUserId ?? null);
		setLoading(false);
	};

	useEffect(() => {
		fetchUsers();
	}, []);

	const confirmRoleChange = async () => {
		if (!pendingChange) return;
		setUpdating(pendingChange.userId);
		setPendingChange(null);
		await fetch("/api/admin/users", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				userId: pendingChange.userId,
				role: pendingChange.to,
			}),
		});
		await fetchUsers();
		setUpdating(null);
	};

	const filtered = users
		.filter((u) => filter === "ALL" || u.role === filter)
		.filter(
			(u) =>
				search === "" ||
				u.email.toLowerCase().includes(search.toLowerCase()) ||
				(u.name?.toLowerCase() ?? "").includes(search.toLowerCase()),
		);

	const adminCount = users.filter((u) => u.role === "ADMIN").length;
	const userCount = users.filter((u) => u.role === "USER").length;

	return (
		<div className="space-y-6">
			<PageHeader
				title="Users"
				description={`${users.length} registered · ${adminCount} admins · ${userCount} members`}
			/>

			{/* Controls row */}
			<div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
				{/* Role filter toggle */}
				<div className="flex rounded-xl border border-border bg-muted/40 p-1 gap-0.5">
					{(["ALL", "ADMIN", "USER"] as RoleFilter[]).map((r) => (
						<button
							key={r}
							onClick={() => setFilter(r)}
							className={cn(
								"flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all duration-150",
								filter === r
									? "bg-card shadow-sm text-foreground"
									: "text-muted-foreground hover:text-foreground",
							)}
						>
							{r === "ALL" && <Users className="h-3 w-3" />}
							{r === "ADMIN" && <ShieldCheck className="h-3 w-3" />}
							{r === "USER" && <User className="h-3 w-3" />}
							{r === "ALL"
								? `All (${users.length})`
								: r === "ADMIN"
									? `Admins (${adminCount})`
									: `Members (${userCount})`}
						</button>
					))}
				</div>

				{/* Search */}
				<div className="relative flex-1 sm:max-w-xs">
					<Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
					<input
						type="text"
						placeholder="Search by name or email…"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="w-full rounded-xl border border-input bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus:border-(--pf-accent) focus:outline-none focus:ring-2 focus:ring-(--pf-accent)/20 transition-all"
					/>
				</div>
			</div>

			{/* Inline role confirm modal */}
			<AnimatePresence>
				{pendingChange && (
					<motion.div
						initial={{ opacity: 0, y: -8, scale: 0.98 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: -8, scale: 0.98 }}
						transition={{ duration: 0.18 }}
						className="flex items-center gap-4 rounded-xl border border-(--pf-amber)/30 bg-(--pf-amber-soft) px-4 py-3"
					>
						<AlertCircle className="h-5 w-5 text-(--pf-amber) shrink-0" />
						<div className="flex-1 min-w-0">
							<p className="text-sm font-semibold text-foreground">
								Change role to {pendingChange.to}?
							</p>
							<p className="text-xs text-muted-foreground mt-0.5">
								{users.find((u) => u.id === pendingChange.userId)?.email} will{" "}
								{pendingChange.to === "ADMIN"
									? "gain full admin access"
									: "lose admin privileges"}
								.
							</p>
						</div>
						<div className="flex gap-2 shrink-0">
							<button
								onClick={() => setPendingChange(null)}
								className="flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors"
							>
								<X className="h-3 w-3" /> Cancel
							</button>
							<button
								onClick={confirmRoleChange}
								className="flex items-center gap-1 rounded-lg bg-(--pf-amber) px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity"
							>
								<ChevronRight className="h-3 w-3" /> Confirm
							</button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* User list */}
			{loading ? (
				<div className="rounded-2xl border border-border bg-card overflow-hidden">
					{[...Array(6)].map((_, i) => (
						<SkeletonRow key={i} />
					))}
				</div>
			) : filtered.length === 0 ? (
				<div className="py-16 text-center">
					<p className="text-sm text-muted-foreground">
						No users match your filter.
					</p>
					<button
						onClick={() => {
							setFilter("ALL");
							setSearch("");
						}}
						className="mt-2 text-xs text-(--pf-accent) hover:opacity-80"
					>
						Clear filters
					</button>
				</div>
			) : (
				<motion.div
					key={filter + search}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.2 }}
					className="rounded-2xl border border-border bg-card overflow-hidden"
				>
					{filtered.map((user, idx) => {
						const isSelf = user.id === currentUserId;
						const isUpdating = updating === user.id;
						const newRole = user.role === "ADMIN" ? "USER" : "ADMIN";

						return (
							<div
								key={user.id}
								className={cn(
									"flex items-center gap-4 px-5 py-4 transition-colors",
									idx < filtered.length - 1 && "border-b border-border/60",
									isSelf ? "bg-muted/20" : "hover:bg-muted/20",
								)}
							>
								{/* Avatar */}
								<div
									className={cn(
										"flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-heading font-bold text-sm",
										getAvatarColor(user.email),
									)}
								>
									{getInitials(user.name, user.email)}
								</div>

								{/* Name + email */}
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2">
										<p className="text-sm font-semibold text-foreground truncate">
											{user.name ?? "Unnamed"}
										</p>
										{isSelf && (
											<span className="rounded-full bg-(--pf-accent-soft) border border-(--pf-accent)/20 px-2 py-0.5 text-[10px] font-semibold text-(--pf-accent)">
												You
											</span>
										)}
										<span
											className={cn(
												"rounded-full border px-2 py-0.5 text-[10px] font-semibold",
												user.role === "ADMIN"
													? "border-(--pf-amber)/25 bg-(--pf-amber-soft) text-(--pf-amber)"
													: "border-border bg-muted text-muted-foreground",
											)}
										>
											{user.role}
										</span>
									</div>
									<p className="text-xs text-muted-foreground truncate">
										{user.email}
									</p>
								</div>

								{/* Stats */}
								<div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground shrink-0">
									<span className="flex items-center gap-1">
										<FlaskConical className="h-3.5 w-3.5" />
										{user._count.analyses} analyses
									</span>
									<span className="flex items-center gap-1">
										<Calendar className="h-3.5 w-3.5" />
										{new Date(user.createdAt).toLocaleDateString("en-IN", {
											day: "numeric",
											month: "short",
											year: "numeric",
										})}
									</span>
								</div>

								{/* Role change button */}
								{isSelf ? (
									<span className="text-xs text-muted-foreground italic shrink-0">
										(cannot change own role)
									</span>
								) : (
									<button
										onClick={() =>
											setPendingChange({
												userId: user.id,
												from: user.role,
												to: newRole,
											})
										}
										disabled={isUpdating || !!pendingChange}
										className={cn(
											"shrink-0 flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-40",
											newRole === "ADMIN"
												? "border-(--pf-amber)/30 text-(--pf-amber) hover:bg-(--pf-amber-soft)"
												: "border-destructive/30 text-destructive hover:bg-destructive/8",
										)}
									>
										{isUpdating ? (
											"Updating…"
										) : newRole === "ADMIN" ? (
											<>
												<ShieldCheck className="h-3.5 w-3.5" /> Make Admin
											</>
										) : (
											<>
												<User className="h-3.5 w-3.5" /> Revoke Admin
											</>
										)}
									</button>
								)}
							</div>
						);
					})}
				</motion.div>
			)}
		</div>
	);
}
