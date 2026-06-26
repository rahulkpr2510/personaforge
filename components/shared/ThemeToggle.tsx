"use client";
import { motion, useSpring, useTransform } from "motion/react";
import { useTheme } from "./ThemeProvider";

// Sun path points
const SUN = "M12 3v1m0 16v1M4.22 4.22l.71.71m12.73 12.73.71.71M3 12h1m16 0h1M4.22 19.78l.71-.71M18.36 5.64l.71-.71M12 7a5 5 0 1 0 0 10A5 5 0 0 0 12 7z";
// Moon path
const MOON = "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79zM12 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 12 12.79z";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      className={`relative flex h-8 w-8 items-center justify-center rounded-md text-foreground/70 transition-colors hover:bg-foreground/8 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
    >
      <motion.svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={{ rotate: isDark ? 0 : 30 }}
        transition={{ type: "spring", stiffness: 200, damping: 18 }}
      >
        <motion.path
          animate={{ d: isDark ? MOON : SUN }}
          transition={{ type: "spring", stiffness: 120, damping: 16 }}
        />
      </motion.svg>
    </button>
  );
}
