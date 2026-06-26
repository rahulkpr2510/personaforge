"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "motion/react";

/**
 * TextHoverEffect — Aceternity UI–inspired SVG text with animated
 * gradient stroke that follows the cursor via a radial-gradient mask.
 */
export function TextHoverEffect({
  text,
  automatic = false,
}: {
  text: string;
  automatic?: boolean;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [maskPos, setMaskPos] = useState({ cx: "50%", cy: "50%" });

  useEffect(() => {
    if (svgRef.current && hovered) {
      const rect = svgRef.current.getBoundingClientRect();
      const cx = ((cursor.x - rect.left) / rect.width) * 100;
      const cy = ((cursor.y - rect.top) / rect.height) * 100;
      setMaskPos({ cx: `${cx}%`, cy: `${cy}%` });
    }
  }, [cursor, hovered]);

  // Automatic idle animation for non-interactive usage
  useEffect(() => {
    if (!automatic) return;
    let frame: number;
    let t = 0;
    const tick = () => {
      t += 0.005;
      const cx = 50 + 30 * Math.cos(t);
      const cy = 50 + 20 * Math.sin(t * 0.7);
      setMaskPos({ cx: `${cx}%`, cy: `${cy}%` });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [automatic]);

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      viewBox="0 0 900 100"
      xmlns="http://www.w3.org/2000/svg"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={(e) => setCursor({ x: e.clientX, y: e.clientY })}
      className="select-none cursor-default"
    >
      <defs>
        {/* Gradient for the stroke reveal */}
        <linearGradient id="textGradient" gradientUnits="userSpaceOnUse" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--pf-accent)" />
          <stop offset="25%" stopColor="oklch(0.65 0.18 300)" />
          <stop offset="50%" stopColor="var(--pf-accent)" />
          <stop offset="75%" stopColor="oklch(0.65 0.14 180)" />
          <stop offset="100%" stopColor="var(--pf-accent)" />
        </linearGradient>

        {/* Radial mask that follows cursor */}
        <radialGradient
          id="revealMask"
          gradientUnits="userSpaceOnUse"
          r="20%"
          cx={maskPos.cx}
          cy={maskPos.cy}
        >
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="black" />
        </radialGradient>
        <mask id="textMask">
          <rect x="0" y="0" width="100%" height="100%" fill="url(#revealMask)" />
        </mask>
      </defs>

      {/* Base text — muted outline always visible */}
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        strokeWidth="0.5"
        className="fill-transparent font-heading font-black"
        style={{
          fontSize: "80px",
          letterSpacing: "0.15em",
          stroke: "var(--border)",
        }}
      >
        {text}
      </text>

      {/* Revealed text — gradient stroke with mask */}
      <motion.text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        strokeWidth="0.5"
        className="fill-transparent font-heading font-black"
        style={{
          fontSize: "80px",
          letterSpacing: "0.15em",
          stroke: "url(#textGradient)",
        }}
        mask="url(#textMask)"
        initial={{ strokeDashoffset: 1000, strokeDasharray: 1000 }}
        animate={{
          strokeDashoffset: 0,
          strokeDasharray: 1000,
        }}
        transition={{ duration: 4, ease: "easeInOut" }}
      >
        {text}
      </motion.text>
    </svg>
  );
}
