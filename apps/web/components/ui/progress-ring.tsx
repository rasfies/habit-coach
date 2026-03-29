"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProgressRingProps {
  /** Number of habits completed today */
  completed: number;
  /** Total number of habits for today */
  total: number;
  /** Diameter of the SVG ring in pixels (default: 120) */
  size?: number;
  /** Stroke width of the progress arc (default: 8) */
  strokeWidth?: number;
  /** Additional CSS class names */
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * ProgressRing — circular SVG progress indicator for today's habit completion.
 *
 * Features:
 *  - Neutral-200 track ring underneath
 *  - Primary-600 (indigo) progress arc, animates on mount via CSS animation
 *  - At 100%: arc turns amber/accent-400, center shows checkmark instead of number
 *  - Center: large % number in JetBrains Mono + small "today" label
 *  - Fully accessible: role="img" with aria-label
 *
 * Animation: uses a CSS custom property `--ring-offset` on the SVG circle to
 * drive stroke-dashoffset. The keyframe is defined in tailwind.config.ts.
 */
export function ProgressRing({
  completed,
  total,
  size = 120,
  strokeWidth = 8,
  className,
}: ProgressRingProps) {
  const safeTotal = Math.max(total, 1); // avoid division by zero
  const pct = Math.min(Math.round((completed / safeTotal) * 100), 100);
  const isComplete = pct === 100;

  // SVG geometry
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  // Animate on mount: start at full offset (empty), animate to target offset
  const [animated, setAnimated] = React.useState(false);
  React.useEffect(() => {
    // Small delay lets the browser paint before triggering transition
    const raf = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const progressColor = isComplete ? "#FBBF24" : "#4F46E5"; // accent-400 or primary-600
  const trackColor = "#E5E7EB"; // neutral-200

  const cx = size / 2;
  const cy = size / 2;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={`${completed} of ${total} habits completed today — ${pct}%`}
      >
        {/* Track circle */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress arc */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animated ? offset : circumference}
          // Rotate so arc starts at 12 o'clock
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{
            transition: "stroke-dashoffset 600ms ease-out, stroke 300ms ease",
          }}
        />
      </svg>

      {/* Center content */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        aria-hidden="true"
      >
        {isComplete ? (
          // Checkmark at 100%
          <span className="text-2xl">✓</span>
        ) : (
          <>
            <span
              className="font-mono text-2xl font-bold leading-none text-neutral-800 tabular-nums"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {pct}%
            </span>
            <span className="mt-0.5 text-xs font-medium text-neutral-500">today</span>
          </>
        )}
        {/* Fraction below (e.g. "3 / 5") */}
        <span className="mt-1 text-xs text-neutral-400">
          {completed}/{total}
        </span>
      </div>
    </div>
  );
}

export default ProgressRing;
