"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { NoiseTexture } from "@/components/ui/NoiseTexture";

const FAQS = [
  {
    category: "About PersonaForge",
    items: [
      {
        q: "What exactly is PersonaForge?",
        a: "PersonaForge is an AI-powered synthetic user research platform. Instead of recruiting real participants, it generates diverse AI personas — each with unique demographics, goals, and technical literacy — that browse your website and deliver structured UX feedback from their distinct perspectives.",
      },
      {
        q: "Does this replace real user testing?",
        a: "No — and we're upfront about that. PersonaForge is a predictive layer you run before expensive real-world sessions. It surfaces friction points, accessibility gaps, and audience-specific reactions early so you ship a better product to your actual testers.",
      },
      {
        q: "How is this different from a generic AI review?",
        a: 'Every evaluation is grounded in hard evidence collected from your site: form field counts, navigation depth, button density, visual complexity scores. The AI never says "this feels overwhelming" without citing exactly why — e.g. "11 input fields across a 3-step registration."',
      },
    ],
  },
  {
    category: "Personas & Analysis",
    items: [
      {
        q: "How many personas can I use per analysis?",
        a: "Up to five personas per run. You can mix prebuilt archetypes (Student, Senior Citizen, Software Developer, etc.) with fully custom personas you define — name, age, occupation, technical literacy, goals, and frustrations.",
      },
      {
        q: "What does the Focus Group simulation do?",
        a: "After all personas evaluate independently, an AI moderator compares their feedback, surfaces genuine disagreements, and explains why they differ. For example: a Developer wants more advanced controls while a Senior finds the same interface too complex — that conflict is surfaced clearly.",
      },
      {
        q: "What device types does the crawler support?",
        a: "PersonaForge uses Playwright and supports both desktop (1280×800) and mobile (390×844) viewpoints. You can pick the device type when submitting a URL.",
      },
    ],
  },
  {
    category: "Privacy & Data",
    items: [
      {
        q: "Where are screenshots stored?",
        a: "All captured screenshots are uploaded to ImageKit and served via CDN. Only the CDN URL is stored in our PostgreSQL database — no raw image bytes hit our servers permanently.",
      },
      {
        q: "Is my website data kept private?",
        a: "Yes. Analyses are scoped to your account and never shared. We do not train models on your website content. You can delete any analysis from your dashboard at any time.",
      },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      layout="position"
      className={`
        transition-all duration-300 rounded-xl overflow-hidden
        ${
          open
            ? "border border-dashed border-neutral-300 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 p-5"
            : "border-b border-dashed border-neutral-200 dark:border-neutral-800 bg-transparent py-4 px-2 hover:bg-neutral-50/40 dark:hover:bg-neutral-900/20"
        }
      `}
    >
      {/* Trigger row */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 text-left focus:outline-none cursor-pointer group"
      >
        <span className="font-heading text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-snug">
          {q}
        </span>
        <motion.div
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 22 }}
          className="h-5 w-5 rounded-full flex items-center justify-center border border-neutral-300 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-neutral-200 transition-colors duration-150 shrink-0"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M5 1v8M1 5h8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </motion.div>
      </button>

      {/* Answer */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: "auto", marginTop: 12 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="font-body text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function FAQ() {
  return (
    <section id="faq" className="relative w-full py-28 px-4 bg-background border-t border-neutral-100 dark:border-neutral-900 overflow-hidden">
      {/* Noise background overlay */}
      <NoiseTexture />

      <div className="relative mx-auto max-w-3xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16 text-center"
        >
          <p className="mb-3 font-body text-xs tracking-[0.18em] uppercase text-neutral-400 dark:text-neutral-500">
            Got questions
          </p>
          <h2 className="font-heading text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 sm:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mt-4 font-body text-[15px] text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto leading-relaxed">
            Everything you need to know about PersonaForge and synthetic user research.
          </p>
        </motion.div>

        {/* Categories */}
        <div className="space-y-12">
          {FAQS.map((group, gi) => (
            <motion.div
              key={group.category}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.5,
                ease: [0.16, 1, 0.3, 1],
                delay: gi * 0.07,
              }}
            >
              {/* Category label */}
              <div className="flex items-center gap-3 mb-4">
                <span className="font-body text-xs tracking-[0.14em] uppercase font-medium text-neutral-400 dark:text-neutral-500 shrink-0">
                  {group.category}
                </span>
                <div className="h-px flex-1 border-t border-dashed border-neutral-300 dark:border-neutral-800" />
              </div>

              {/* Items */}
              <div className="space-y-2">
                {group.items.map((item, ii) => (
                  <motion.div
                    key={item.q}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-20px" }}
                    transition={{
                      duration: 0.4,
                      ease: [0.16, 1, 0.3, 1],
                      delay: gi * 0.05 + ii * 0.04,
                    }}
                  >
                    <FAQItem q={item.q} a={item.a} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-16 text-center"
        >
          <p className="font-body text-sm text-neutral-500">
            Still have questions?{" "}
            <a
              href="#contact"
              className="text-neutral-700 dark:text-neutral-300 underline underline-offset-4 decoration-neutral-300 dark:decoration-neutral-700 hover:decoration-neutral-500 dark:hover:decoration-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors duration-150"
            >
              Reach out to us
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
