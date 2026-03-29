"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StreakBadgeProps {
  /** Current consecutive day streak count */
  count: number;
  /** Whether this count is a notable milestone (3, 7, 14, 30+ days) */
  milestone?: boolean;
  /** Additional CSS class names */
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Maps a streak count to a descriptive label shown on milestone badges.
 */
function getMilestoneLabel(count: number): string | null {
  if (count >= 365) return "1 year!";
  if (count >= 100) return "100 days!";
  if (count >= 30)  return "30 days!";
  if (count >= 14)  return "2 weeks!";
  if (count >= 7)   return "1 week!";
  if (count >= 3)   return "3 days!";
  return null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * StreakBadge — displays a flame emoji and the streak count.
 *
 * Styling tiers:
 *  - count === 0:  Neutral gray — no active streak
 *  - count > 0:   Amber/yellow — active streak
 *  - milestone:   Amber-400 solid fill with white text + subtle glow
 *
 * Uses JetBrains Mono for the number to feel data-precise.
 */
export function StreakBadge({ count, milestone = false, className }: StreakBadgeProps) {
  const milestoneLabel = milestone ? getMilestoneLabel(count) : null;
  const isActive = count > 0;

  return (
    <span
      className={cn(
        // Base shape
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-bold transition-all duration-300",
        // Inactive streak
        !isActive && "bg-neutral-100 text-neutral-500",
        // Active streak (non-milestone)
        isActive && !milestone && "bg-amber-100 text-amber-700",
        // Milestone: solid amber fill, white text, glow
        milestone && [
          "bg-amber-400 text-white",
          "shadow-[0_0_12px_rgba(251,191,36,0.5)]",
          "animate-[streak-pop_400ms_cubic-bezier(0.34,1.56,0.64,1)]",
        ],
        className
      )}
      aria-label={`${count} day streak${milestone ? " — milestone!" : ""}`}
    >
      {/* Flame icon */}
      <span
        className={cn(
          "text-base leading-none",
          !isActive && "opacity-40",
          isActive && !milestone && "text-amber-500",
          milestone && "text-white"
        )}
        aria-hidden="true"
      >
        🔥
      </span>

      {/* Streak number — JetBrains Mono */}
      <span className="font-mono tabular-nums tracking-tight">{count}</span>

      {/* Milestone label */}
      {milestoneLabel && (
        <span className="ml-0.5 text-xs font-semibold opacity-90">{milestoneLabel}</span>
      )}
    </span>
  );
}

export default StreakBadge;
