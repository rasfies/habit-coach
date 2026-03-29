"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { CheckButton } from "./check-button";
import { StreakBadge } from "./streak-badge";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HabitCardProps {
  /** Unique habit identifier */
  id: string;
  /** Display name of the habit */
  name: string;
  /** Emoji or icon character representing this habit */
  icon: string;
  /** Short description / cue (optional) */
  description?: string;
  /** Number of consecutive days logged */
  streakCount: number;
  /** Whether the user has already checked in today */
  checkedToday: boolean;
  /** Callback fired when the check button is toggled */
  onToggleCheck: (id: string) => void;
  /** Whether the check button should be disabled (e.g. loading state) */
  disabled?: boolean;
  /** Additional CSS class names */
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns true when the streak count is a milestone worth celebrating.
 * Milestones: 3, 7, 14, 21, 30, 60, 90, 100, 365, ...
 */
function isMilestone(count: number): boolean {
  const milestones = new Set([3, 7, 14, 21, 30, 60, 90, 100, 150, 180, 365]);
  return milestones.has(count) || (count > 0 && count % 100 === 0);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * HabitCard — the primary unit of the habits dashboard.
 *
 * Shows:
 *  - Habit icon + name + optional description
 *  - Current streak count (StreakBadge with amber/yellow milestone styling)
 *  - CheckButton (large 56px tap target, green when checked)
 *  - Milestone fire emoji overlay at milestone streak counts
 *
 * Built on top of shadcn <Card> for consistent elevation and theming.
 */
export function HabitCard({
  id,
  name,
  icon,
  description,
  streakCount,
  checkedToday,
  onToggleCheck,
  disabled = false,
  className,
}: HabitCardProps) {
  const milestone = isMilestone(streakCount);

  return (
    <Card
      className={cn(
        // Base card styles
        "relative flex items-center gap-4 px-5 py-4 transition-all duration-200",
        "border border-neutral-200 shadow-[var(--shadow-habit-card,0_4px_6px_-1px_rgba(0,0,0,0.07))]",
        "hover:shadow-[var(--shadow-habit-card-hover,0_10px_15px_-3px_rgba(0,0,0,0.1))] hover:scale-[1.01]",
        // Checked today — success tint + left border
        checkedToday && "bg-success-50 border-l-4 border-l-success-500",
        // Milestone — amber tint + left border
        milestone && !checkedToday && "bg-amber-50 border-l-4 border-l-amber-400",
        // Default
        !checkedToday && !milestone && "bg-white",
        className
      )}
      role="listitem"
      aria-label={`${name}, ${streakCount} day streak${checkedToday ? ", checked today" : ""}`}
    >
      {/* Icon circle */}
      <div
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xl"
        aria-hidden="true"
      >
        {icon}
      </div>

      {/* Name + description */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-base font-semibold text-neutral-800 leading-tight">
            {name}
          </h3>
          {/* Fire emoji at milestone */}
          {milestone && streakCount > 0 && (
            <span
              aria-label="Milestone streak"
              className="text-base animate-[streak-pop_400ms_cubic-bezier(0.34,1.56,0.64,1)]"
            >
              🔥
            </span>
          )}
        </div>
        {description && (
          <p className="mt-0.5 truncate text-sm text-neutral-500">{description}</p>
        )}
        {/* Streak badge row */}
        <div className="mt-1.5">
          <StreakBadge count={streakCount} milestone={milestone} />
        </div>
      </div>

      {/* Check button */}
      <div className="flex-shrink-0">
        <CheckButton
          checked={checkedToday}
          onToggle={() => onToggleCheck(id)}
          disabled={disabled}
          aria-label={checkedToday ? `Uncheck ${name}` : `Check in for ${name}`}
        />
      </div>
    </Card>
  );
}

export default HabitCard;
