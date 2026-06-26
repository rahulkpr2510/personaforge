"use client";
import { motion, AnimatePresence, useInView } from "motion/react";
import { useRef, useState } from "react";

const FAQS = [
  {
    category: "Product",
    items: [
      {
        q: "Does PersonaForge replace real user testing?",
        a: "No — and we are deliberate about that. PersonaForge is a predictive layer that runs before you recruit real participants. It surfaces friction points early so your actual user sessions go deeper, not wider.",
      },
      {
        q: "How accurate are the AI personas?",
        a: "Accuracy scales with specificity. Our personas cite concrete evidence — number of form fields, navigation depth, button placement — rather than opinion. The more detailed your custom persona, the sharper the analysis.",
      },
      {
        q: "Which websites can I analyse?",
        a: "Any publicly accessible URL. For staging environments behind authentication, you can provide credentials. SPAs, static sites, e-commerce stores — all supported.",
      },
    ],
  },
  {
    category: "Pricing & Access",
    items: [
      {
        q: "Is there a free tier?",
        a: "Yes. The free tier includes 3 analyses per month, up to 3 personas each. No credit card required to get started.",
      },
      {
        q: "How long does an analysis take?",
        a: "Typically 2 – 5 minutes for a 5-persona run. Crawling time depends on the website size; evaluation and focus group synthesis happen in parallel.",
      },
      {
        q: "Can I export the reports?",
        a: "PDF and JSON exports are available on paid plans. The dashboard is always accessible in-app regardless of plan.",
      },
    ],
  },
];

function FAQItem({
  q, a, delay,
}: { q: string; a: string; delay: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-5%" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className={`group w-full rounded-xl border px-5 py-4 text-left transition-all ${
          open
            ? "border-dashed border-foreground/25 bg-foreground/4"
            : "border-dashed border-border hover:border-foreground/20 hover:bg-foreground/3"
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-foreground">{q}</span>
          <motion.span
            animate={{ rotate: open ? 45 : 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="shrink-0 text-lg leading-none text-muted-foreground"
          >
            +
          </motion.span>
        </div>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{a}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </motion.div>
  );
}

export function FAQ() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });

  return (
    <section id="faq" className="relative px-4 py-28 sm:py-36">
      <div className="mx-auto max-w-2xl">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-14 text-center"
        >
          <h2
            className="mb-4 text-[clamp(1.8rem,4vw,2.8rem)] font-black tracking-tight text-foreground"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Frequently Asked Questions
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Everything you need to know about AI synthetic user research.
          </p>
        </motion.div>

        <div className="space-y-10">
          {FAQS.map((group) => (
            <div key={group.category}>
              <motion.p
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ duration: 0.4 }}
                className="mb-3 text-sm font-semibold text-foreground"
              >
                {group.category}
              </motion.p>
              <div className="space-y-2">
                {group.items.map((item, i) => (
                  <FAQItem key={item.q} q={item.q} a={item.a} delay={i * 0.08} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
