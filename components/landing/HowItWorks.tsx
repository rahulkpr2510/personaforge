"use client";
import { motion, useInView, AnimatePresence } from "motion/react";
import { useRef, useState, useEffect } from "react";

const STEPS = [
  {
    step: "01",
    title: "Submit your URL",
    desc: "Paste any live website. PersonaForge opens it in a real browser and maps every page, form, and flow.",
  },
  {
    step: "02",
    title: "Choose your personas",
    desc: "Select from 8 prebuilt archetypes — or craft your own. Mix a 22-year-old developer with a 65-year-old retiree.",
  },
  {
    step: "03",
    title: "Personas evaluate",
    desc: "Each persona independently browses, reacts, and builds evidence — backed by real metrics like form depth and button density.",
  },
  {
    step: "04",
    title: "Get the full report",
    desc: "A visual dashboard surfaces persona conflicts, friction scores, and prioritised recommendations — in minutes.",
  },
];

// Browser demo frames
const DEMO_FRAMES = [
  {
    label: "Crawling website...",
    content: (
      <div className="space-y-2 p-4">
        <div className="flex items-center gap-2 rounded-md bg-foreground/5 px-3 py-2 text-xs text-muted-foreground">
          <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--pf-accent)] opacity-60" /><span className="relative flex h-2 w-2 rounded-full bg-[var(--pf-accent)]" /></span>
          Navigating https://yourproduct.com
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3">
          {["Home","Pricing","Sign Up","Dashboard","Docs","Blog"].map((p,i)=>(
            <motion.div key={p} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.15}}
              className="rounded border border-border bg-muted/60 px-2 py-1.5 text-center text-xs text-muted-foreground">{p}</motion.div>
          ))}
        </div>
        <div className="mt-3 space-y-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <motion.div className="h-full rounded-full bg-[var(--pf-accent)]" initial={{width:"0%"}} animate={{width:"72%"}} transition={{duration:1.8,ease:"easeOut"}} />
          </div>
          <p className="text-right text-[10px] text-muted-foreground">6 / 8 pages mapped</p>
        </div>
      </div>
    ),
  },
  {
    label: "Selecting personas...",
    content: (
      <div className="space-y-2 p-4">
        <p className="text-xs text-muted-foreground mb-3">Active personas (3 / 5)</p>
        {[
          { name: "Aisha, 24", role: "Software Engineer", color: "var(--pf-accent)" },
          { name: "Robert, 61", role: "Retired Banker", color: "var(--pf-green)" },
          { name: "Priya, 35", role: "Small Business Owner", color: "var(--pf-amber)" },
        ].map((p,i)=>(
          <motion.div key={p.name} initial={{x:-16,opacity:0}} animate={{x:0,opacity:1}} transition={{delay:i*0.2,type:"spring",stiffness:200,damping:20}}
            className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-background" style={{background:p.color}}>{p.name[0]}</span>
            <div>
              <p className="text-xs font-semibold text-foreground">{p.name}</p>
              <p className="text-[10px] text-muted-foreground">{p.role}</p>
            </div>
            <motion.div initial={{scale:0}} animate={{scale:1}} transition={{delay:i*0.2+0.3}} className="ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-[var(--pf-green-soft)]">
              <svg width="8" height="8" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="var(--pf-green)" strokeWidth="1.8" fill="none" strokeLinecap="round"/></svg>
            </motion.div>
          </motion.div>
        ))}
      </div>
    ),
  },
  {
    label: "Personas evaluating...",
    content: (
      <div className="space-y-3 p-4">
        {[
          { name: "Aisha", sentiment: "Positive", score: 82, color: "var(--pf-green)" },
          { name: "Robert", sentiment: "Negative", score: 34, color: "oklch(0.65 0.18 20)" },
          { name: "Priya", sentiment: "Neutral", score: 58, color: "var(--pf-amber)" },
        ].map((p,i)=>(
          <motion.div key={p.name} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.25}} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">{p.name}</span>
              <span className="text-[10px]" style={{color:p.color}}>{p.sentiment}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <motion.div className="h-full rounded-full" style={{background:p.color}} initial={{width:"0%"}} animate={{width:`${p.score}%`}} transition={{delay:i*0.25+0.3,duration:1,ease:"easeOut"}} />
            </div>
          </motion.div>
        ))}
        <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1}} className="mt-3 rounded-lg border border-dashed border-[oklch(0.65_0.18_20)/40] bg-[oklch(0.65_0.18_20)/6] p-2.5">
          <p className="text-[10px] font-medium text-foreground">⚡ Conflict detected</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Robert vs Aisha disagree on navigation complexity</p>
        </motion.div>
      </div>
    ),
  },
  {
    label: "Report ready",
    content: (
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Friction", value: "64/100", sub: "Medium" },
            { label: "Adoption", value: "58%", sub: "Moderate" },
            { label: "Conflicts", value: "3", sub: "Found" },
          ].map((m,i)=>(
            <motion.div key={m.label} initial={{scale:0.8,opacity:0}} animate={{scale:1,opacity:1}} transition={{delay:i*0.15,type:"spring",stiffness:220,damping:20}}
              className="rounded-lg border border-border bg-muted/40 p-2 text-center">
              <p className="text-sm font-bold text-foreground">{m.value}</p>
              <p className="text-[9px] text-muted-foreground">{m.label}</p>
            </motion.div>
          ))}
        </div>
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Top issues</p>
          {["Sign-up form too long (11 fields)","Navigation confusing for non-tech users","CTA button not visible on mobile"].map((item,i)=>(
            <motion.div key={item} initial={{x:8,opacity:0}} animate={{x:0,opacity:1}} transition={{delay:0.4+i*0.15}}
              className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
              <span className="mt-0.5 text-[oklch(0.65_0.18_20)]">✗</span>{item}
            </motion.div>
          ))}
        </div>
      </div>
    ),
  },
];

function SafariBrowser({ activeFrame }: { activeFrame: number }) {
  const frame = DEMO_FRAMES[activeFrame];
  return (
    <div className="w-full overflow-hidden rounded-xl border border-border bg-card shadow-xl">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-border bg-muted/60 px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.65_0.22_20)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.75_0.18_75)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.6_0.16_140)]" />
        </div>
        <div className="flex flex-1 items-center gap-1.5 rounded-md bg-background/80 px-3 py-1 text-[10px] text-muted-foreground border border-border/50">
          <svg className="h-2.5 w-2.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          personaforge.app / analysis
        </div>
      </div>
      {/* Content */}
      <div className="min-h-[220px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFrame}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {frame.content}
          </motion.div>
        </AnimatePresence>
      </div>
      {/* Status bar */}
      <div className="border-t border-border bg-muted/40 px-4 py-1.5">
        <p className="text-[9px] text-muted-foreground">{frame.label}</p>
      </div>
    </div>
  );
}

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const timer = setInterval(() => {
      setActiveStep((s) => (s + 1) % STEPS.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [isInView]);

  return (
    <section
      id="how-it-works"
      ref={ref}
      className="relative px-4 py-28 sm:py-36"
    >
      <div className="mx-auto max-w-5xl">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16 text-center"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">How it works</p>
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-black tracking-tight text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            Four steps to clarity
          </h2>
        </motion.div>

        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          {/* Steps list */}
          <div className="space-y-2">
            {STEPS.map((s, i) => (
              <motion.button
                key={s.step}
                onClick={() => setActiveStep(i)}
                initial={{ opacity: 0, x: -16 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: i * 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className={`group w-full rounded-xl border px-5 py-4 text-left transition-all ${
                  activeStep === i
                    ? "border-foreground/20 bg-foreground/5 shadow-sm"
                    : "border-transparent hover:border-border hover:bg-foreground/3"
                }`}
              >
                <div className="flex items-start gap-4">
                  <span
                    className={`mt-0.5 shrink-0 text-xs font-black tabular-nums transition-colors ${
                      activeStep === i ? "text-[var(--pf-accent)]" : "text-muted-foreground/40"
                    }`}
                  >
                    {s.step}
                  </span>
                  <div>
                    <p className={`text-sm font-semibold transition-colors ${
                      activeStep === i ? "text-foreground" : "text-muted-foreground"
                    }`}>{s.title}</p>
                    <AnimatePresence>
                      {activeStep === i && (
                        <motion.p
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          className="mt-1 overflow-hidden text-xs text-muted-foreground"
                        >
                          {s.desc}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Browser demo */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <SafariBrowser activeFrame={activeStep} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
