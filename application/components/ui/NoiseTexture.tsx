"use client";

import { useId } from "react";

/**
 * NoiseTexture — Magic UI–inspired SVG feTurbulence noise overlay.
 * Drop this as a child of any positioned container and it renders a
 * subtle grain texture that sits on top of the background.
 *
 * Each instance gets a unique filter ID to avoid SVG ID collisions.
 */
export function NoiseTexture({ className }: { className?: string }) {
  const id = useId();
  const filterId = `pf-noise-${id}`;

  return (
    <svg
      className={`pointer-events-none absolute inset-0 h-full w-full ${className ?? "opacity-[0.035] dark:opacity-[0.06]"}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <filter id={filterId}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.80"
          numOctaves="4"
          stitchTiles="stitch"
        />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${filterId})`} />
    </svg>
  );
}
