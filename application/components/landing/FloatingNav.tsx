"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useTheme } from "@/components/shared/ThemeProvider";

/* ------------------------------------------------------------------ */
/*  Theme Toggle — clean icon swap with AnimatePresence               */
/* ------------------------------------------------------------------ */
function ThemeToggle() {
	const { theme, toggleTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => setMounted(true), []);

	const isDark = mounted ? theme === "dark" : false;

	if (!mounted) {
		return <div className="h-8 w-8 rounded-lg" />;
	}

	return (
		<motion.button
			onClick={toggleTheme}
			aria-label="Toggle theme"
			whileTap={{ scale: 0.85 }}
			whileHover={{ scale: 1.1 }}
			className="relative flex h-8 w-8 items-center justify-center rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-150 cursor-pointer overflow-hidden"
		>
			<AnimatePresence mode="wait" initial={false}>
				{isDark ? (
					<motion.svg
						key="moon"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						initial={{ rotate: 90, scale: 0, opacity: 0 }}
						animate={{ rotate: 0, scale: 1, opacity: 1 }}
						exit={{ rotate: -90, scale: 0, opacity: 0 }}
						transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
					>
						<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
					</motion.svg>
				) : (
					<motion.svg
						key="sun"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						initial={{ rotate: -90, scale: 0, opacity: 0 }}
						animate={{ rotate: 0, scale: 1, opacity: 1 }}
						exit={{ rotate: 90, scale: 0, opacity: 0 }}
						transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
					>
						<circle cx="12" cy="12" r="5" />
						<line x1="12" y1="1" x2="12" y2="3" />
						<line x1="12" y1="21" x2="12" y2="23" />
						<line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
						<line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
						<line x1="1" y1="12" x2="3" y2="12" />
						<line x1="21" y1="12" x2="23" y2="12" />
						<line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
						<line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
					</motion.svg>
				)}
			</AnimatePresence>
		</motion.button>
	);
}

/* ------------------------------------------------------------------ */
/*  Floating Navigation                                               */
/* ------------------------------------------------------------------ */
export function FloatingNav() {
	const [scrolled, setScrolled] = useState(false);

	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 20);
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	const handleScroll = (id: string) => (e: React.MouseEvent) => {
		e.preventDefault();
		document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
	};

	return (
		<motion.header
			initial={{ y: -20, opacity: 0 }}
			animate={{ y: 0, opacity: 1 }}
			transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
			className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
		>
			<motion.nav
				animate={{
					boxShadow: scrolled
						? "0 10px 30px -10px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.05)"
						: "0 1px 2px rgba(0,0,0,0.02)",
				}}
				transition={{ duration: 0.3 }}
				className="pointer-events-auto flex items-center justify-between w-full max-w-3xl px-4 py-2 rounded-xl border border-neutral-200/70 dark:border-neutral-700/60 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md transition-colors duration-300"
			>
				{/* Logo */}
				<Link
					href="#hero"
					onClick={handleScroll("hero")}
					className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-150 shrink-0"
				>
					<svg
						width="28"
						height="28"
						viewBox="0 0 32 32"
						fill="none"
						aria-label="PersonaForge logo"
					>
						<rect
							width="32"
							height="32"
							rx="8"
							fill="var(--pf-accent)"
							opacity="0.15"
						/>
						<path
							d="M8 10C8 8.895 8.895 8 10 8h5c3.314 0 6 2.686 6 6s-2.686 6-6 6H8V10z"
							fill="var(--pf-accent)"
							opacity="0.8"
						/>
						<circle cx="22" cy="22" r="4" fill="var(--pf-accent)" />
					</svg>
					<span className="font-heading text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
						PersonaForge
					</span>
				</Link>

				{/* Right side: nav links + divider + toggle */}
				<div className="flex items-center gap-1">
					{/* Nav links — hidden on small screens */}
					<div className="hidden sm:flex items-center gap-0.5">
						{[
							{ label: "How it works", id: "how-it-works" },
							{ label: "Contact", id: "contact" },
						].map((item) => (
							<Link
								key={item.id}
								href={`#${item.id}`}
								onClick={handleScroll(item.id)}
								className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-150"
							>
								{item.label}
							</Link>
						))}
					</div>

					<div className="hidden sm:block h-4 w-px bg-neutral-200 dark:bg-neutral-800 mx-1" />

					{/* Theme toggle */}
					<ThemeToggle />
				</div>
			</motion.nav>
		</motion.header>
	);
}
