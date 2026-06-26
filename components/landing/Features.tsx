"use client";
import { motion, useInView } from "motion/react";
import { useRef, useState } from "react";

const FEATURES = [
  {
    icon: "👥",
    title: "Diverse Persona Engine",
    description: "Generate up to 5 personas per analysis. Prebuilt archetypes or fully custom — mixed freely in a single run.",
    size: "col-span-2",
    accent: "var(--pf-accent)",
    accentSoft: "var(--pf-accent-soft)",
  },
  {
    icon: "⚡",
    title: "Parallel Evaluations",
    description: "All personas evaluate simultaneously. A full 5-persona report in under 3 minutes.",
    size: "col-span-1",
    accent: "var(--pf-amber)",
    accentSoft: "var(--pf-amber-soft)",
  },
  {
    icon: "🔍",
    title: "Evidence-Based Findings",
    description: "Every insight cites hard data — form field counts, navigation depth, button density, and screenshot references.",
    size: "col-span-1",
    accent: "var(--pf-green)",
    accentSoft: "var(--pf-green-soft)",
  },
  {
    icon: "💬",
    title: "Synthetic Focus Group",
    description: "After individual evaluations, an AI moderator surfaces conflicts between personas and explains why they disagree.",
    size: "col-span-1",
    accent: "var(--pf-accent)",
    accentSoft: "var(--pf-accent-soft)",
  },
  {
    icon: "👁️",
    title: "Gemini Vision Analysis",
    description: "Screenshots are analyzed for layout hierarchy, visual complexity, and accessibility observations.",
    size: "col-span-2",
    accent: "var(--pf-amber)",
    accentSoft: "var(--pf-amber-soft)",
  },
  {
    icon: "📊",
    title: "Actionable Dashboard",
    description: "Friction scores, sentiment breakdown, persona conflicts, and prioritised recommendations — all in one view.",
    size: "col-span-1",
    accent: "var(--pf-green)",
    accentSoft: "var(--pf-green-soft)",
  },
];

function FeatureCard({
  icon, title, description, size, accent, accentSoft, delay,
}: (typeof FEATURES)[0] & { delay: number }) {
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-5%" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className={`group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-md ${
        size === "col-span-2" ? "sm:col-span-2" : "sm:col-span-1"
      }`}
    >
      {/* Hover glow */}
      <motion.div
        className="absolute inset-0 rounded-2xl"
        animate={{ opacity: hovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        style={{ background: `radial-gradient(circle at 30% 30%, ${accentSoft}, transparent 70%)` }}
      />

      <div className="relative z-10">
        {/* Animated icon */}
        <motion.div
          animate={hovered ? { scale: 1.18, rotate: [0, -8, 8, 0] } : { scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 16 }}
          className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl text-xl"
          style={{ background: accentSoft }}
        >
          {icon}
        </motion.div>

        <h3
          className="mb-2 text-base font-bold text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </motion.div>
  );
}

export function Features() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });

  return (
    <section id="features" className="relative px-4 py-28 sm:py-36">
      <div className="mx-auto max-w-5xl">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-14 text-center"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Features</p>
          <h2
            className="text-[clamp(2rem,4vw,3rem)] font-black tracking-tight text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Everything you need to{" "}
            <span className="italic" style={{ color: "var(--pf-accent)" }}>know your users</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} {...f} delay={i * 0.07} />
          ))}
        </div>
      </div>
    </section>
  );
}
