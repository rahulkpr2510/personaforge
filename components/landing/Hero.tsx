"use client";
import { motion } from "motion/react";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  }),
};

export function Hero() {
  return (
    <section
      id="hero"
      className="noise-bg relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pt-24 pb-20"
    >
      {/* Subtle radial gradient */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, oklch(0.92 0.02 250 / 0.25) 0%, transparent 70%)",
        }}
      />
      <div className="dark:block hidden pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, oklch(0.3 0.06 250 / 0.18) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex max-w-3xl flex-col items-center text-center">
        {/* Badge */}
        <motion.div
          custom={0}
          initial="hidden"
          animate="show"
          variants={fadeUp}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3.5 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur-sm"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--pf-accent)] opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--pf-accent)]" />
          </span>
          AI-Powered Synthetic User Research
        </motion.div>

        {/* Headline */}
        <motion.h1
          custom={1}
          initial="hidden"
          animate="show"
          variants={fadeUp}
          className="mb-6 text-[clamp(2.5rem,6vw,4.5rem)] font-black leading-[1.08] tracking-tight text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Know how your users{" "}
          <span className="italic text-[var(--pf-accent)]">feel</span>
          <br />
          before they ever arrive.
        </motion.h1>

        {/* Sub */}
        <motion.p
          custom={2}
          initial="hidden"
          animate="show"
          variants={fadeUp}
          className="mb-10 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
        >
          PersonaForge generates diverse AI personas that browse your product,
          argue about it, and hand you evidence-backed friction reports — hours
          before your first real user test.
        </motion.p>

        {/* CTAs */}
        <motion.div
          custom={3}
          initial="hidden"
          animate="show"
          variants={fadeUp}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            href="/sign-in"
            className="group inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-2.5 text-sm font-semibold text-background shadow-sm transition-all hover:opacity-85 active:scale-95"
          >
            Start for free
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-background/60 px-5 py-2.5 text-sm font-medium text-foreground backdrop-blur-sm transition-all hover:bg-foreground/5 active:scale-95"
          >
            See how it works
          </a>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          custom={5}
          initial="hidden"
          animate="show"
          variants={fadeUp}
          className="mt-20"
        >
          <a href="#how-it-works" aria-label="Scroll down" className="flex flex-col items-center gap-1 text-muted-foreground/50 transition-colors hover:text-muted-foreground">
            <motion.div
              animate={{ y: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              <ChevronDown className="h-4 w-4" />
            </motion.div>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
