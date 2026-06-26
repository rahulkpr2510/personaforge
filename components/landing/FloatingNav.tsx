"use client";
import { motion, useScroll, useMotionValueEvent } from "motion/react";
import { useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

export function FloatingNav() {
  const [hidden, setHidden] = useState(false);
  const [lastY, setLastY] = useState(0);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    if (y > lastY && y > 80) setHidden(true);
    else setHidden(false);
    setLastY(y);
  });

  return (
    <motion.div
      className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4"
      animate={{ y: hidden ? -80 : 0, opacity: hidden ? 0 : 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
    >
      <nav
        className="flex items-center gap-1 rounded-xl border border-border/60 bg-background/70 px-3 py-2 shadow-sm backdrop-blur-xl"
        style={{ maxWidth: "640px", width: "100%" }}
      >
        {/* Logo / Brand */}
        <Link
          href="#hero"
          className="mr-2 flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground"
          style={{ fontFamily: "var(--font-display)" }}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-foreground text-background text-xs font-black select-none">
            P
          </span>
          <span className="hidden sm:inline">PersonaForge</span>
        </Link>

        <div className="flex flex-1 items-center justify-center gap-1">
          <NavLink href="#how-it-works">How it works</NavLink>
          <NavLink href="#contact">Contact</NavLink>
        </div>

        <ThemeToggle />
      </nav>
    </motion.div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-foreground/6 hover:text-foreground"
    >
      {children}
    </a>
  );
}
