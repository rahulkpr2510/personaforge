"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { NoiseTexture } from "@/components/ui/NoiseTexture";
import { TextHoverEffect } from "@/components/ui/TextHoverEffect";

const NAV_LINKS = [
	{ label: "Product", href: "#features" },
	{ label: "How it works", href: "#how-it-works" },
	{ label: "FAQ", href: "#faq" },
];

const SOCIAL_LINKS = [
	{
		label: "X / Twitter",
		href: "https://twitter.com/rahulkpr2510",
		icon: (
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.8"
				strokeLinecap="round"
				strokeLinejoin="round"
				className="h-4 w-4"
			>
				<path d="M4 4l11.733 16h4.267l-11.733 -16z" />
				<path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
			</svg>
		),
	},
	{
		label: "LinkedIn",
		href: "https://linkedin.com/in/rahulkapoor2510",
		icon: (
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.8"
				strokeLinecap="round"
				strokeLinejoin="round"
				className="h-4 w-4"
			>
				<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
				<rect x="2" y="9" width="4" height="12" />
				<circle cx="4" cy="4" r="2" />
			</svg>
		),
	},
	{
		label: "GitHub",
		href: "https://github.com/rahulkpr2510",
		icon: (
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.8"
				strokeLinecap="round"
				strokeLinejoin="round"
				className="h-4 w-4"
			>
				<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
			</svg>
		),
	},
	{
		label: "Instagram",
		href: "https://instagram.com/notrahulkapoor",
		icon: (
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="1.8"
				strokeLinecap="round"
				strokeLinejoin="round"
				className="h-4 w-4"
			>
				<rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
				<path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
				<line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
			</svg>
		),
	},
];

function FooterLink({ text, href }: { text: string; href: string }) {
	const isExternal = href.startsWith("http") || href.startsWith("mailto");

	const className =
		"font-body text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors duration-200";

	if (isExternal) {
		return (
			<a
				href={href}
				target="_blank"
				rel="noopener noreferrer"
				className={className}
			>
				{text}
			</a>
		);
	}

	return (
		<Link href={href} className={className}>
			{text}
		</Link>
	);
}

export function Footer() {
	return (
		<footer
			id="contact"
			className="relative border-t border-neutral-100 dark:border-neutral-900 bg-background overflow-hidden"
		>
			{/* Noise overlay */}
			<NoiseTexture />

			<div className="mx-auto max-w-5xl px-4 py-16 relative z-10">
				{/* Brand */}
				<div className="mb-8 flex flex-col items-center gap-2">
					<div className="flex items-center gap-2">
						<span className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 dark:bg-neutral-50 text-white dark:text-black text-xs font-black">
							P
						</span>
						<span
							className="text-lg font-bold text-neutral-900 dark:text-neutral-100"
							style={{ fontFamily: "var(--font-display)" }}
						>
							PersonaForge
						</span>
					</div>
					<p className="text-xs text-neutral-400 dark:text-neutral-500 text-center max-w-xs">
						AI-powered synthetic user research for modern product teams.
					</p>
				</div>

				{/* CTAs */}
				<div className="mb-10 flex flex-wrap items-center justify-center gap-3">
					<Link
						href="/sign-in"
						className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 dark:bg-neutral-50 px-5 py-2.5 text-sm font-semibold text-white dark:text-neutral-900 shadow-sm transition-all hover:opacity-85 active:scale-95"
					>
						Start for free
					</Link>
					<a
						href="#features"
						className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white/60 dark:bg-neutral-900/60 px-5 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 backdrop-blur-sm transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800 active:scale-95"
					>
						Explore features
					</a>
				</div>

				{/* Nav links — plain, no translate effect */}
				<nav className="mb-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
					{NAV_LINKS.map((l) => (
						<FooterLink key={l.label} text={l.label} href={l.href} />
					))}
				</nav>

				{/* Divider (Dashed) */}
				<div className="mb-8 border-t border-dashed border-neutral-200 dark:border-neutral-800" />

				{/* Bottom row */}
				<div className="flex flex-col items-center justify-between gap-4 sm:flex-row mb-12">
					<p className="text-xs text-neutral-400 dark:text-neutral-500">
						© {new Date().getFullYear()} PersonaForge. All rights reserved.
					</p>
					<div className="flex items-center gap-2">
						{SOCIAL_LINKS.map((s) => (
							<motion.a
								key={s.label}
								href={s.href}
								target="_blank"
								rel="noopener noreferrer"
								aria-label={s.label}
								whileHover={{ scale: 1.12 }}
								whileTap={{ scale: 0.92 }}
								className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-150"
							>
								{s.icon}
							</motion.a>
						))}
					</div>
				</div>

				{/* Aceternity TextHoverEffect */}
				<div className="h-24 sm:h-32 w-full">
					<TextHoverEffect text="PERSONAFORGE" />
				</div>
			</div>
		</footer>
	);
}
