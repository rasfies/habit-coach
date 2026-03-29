"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DayDotStatus = "logged" | "missed" | "grace" | "today" | "future";

export interface DayDotProps {
  /** Visual status of this calendar day */
  status: DayDotStatus;
  /** Optional date label for accessibility (e.g. "Mon", "Mar 25") */
  dateLabel?: string;
  /** Optional tooltip text */
  title?: string;
  /** Additional CSS class names */
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const statusConfig: Record<
  DayDotStatus,
  { bg: string; ring?: string; pulse?: boolean; label: string }
> = {
  logged:  { bg: "bg-success-500",  label: "Logged"       },
  missed:  { bg: "bg-neutral-300",  label: "Missed"       },
  grace:   { bg: "bg-amber-400",    label: "Grace day"    },
  today:   {
    bg: "bg-info-500",
    ring: "ring-2 ring-info-300 ring-offset-1",
    pulse: true,
    label: "Today",
  },
  future:  { bg: "bg-neutral-200",  label: "Upcoming"     },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * DayDot — a 12px colored circle representing a single calendar day's status.
 *
 * Color key:
 *  - logged  → green   (#22C55E) — habit was checked in
 *  - missed  → gray    (#D1D5DB) — habit was not completed
 *  - grace   → yellow  (#FBBF24) — grace day was used
 *  - today   → blue    (#3B82F6) + pulsing ring — current day
 *  - future  → light gray (#E5E7EB) — not yet reachable
 *
 * Used in GroupMemberRow to show the last 7 days at a glance.
 */
export function DayDot({ status, dateLabel, title, className }: DayDotProps) {
  const config = statusConfig[status];
  const ariaLabel = dateLabel ? `${dateLabel}: ${config.label}` : config.label;

  return (
    <span
      role="img"
      aria-label={ariaLabel}
      title={title ?? ariaLabel}
      className={cn(
        // Base: 12px circle
        "inline-block h-3 w-3 rounded-full flex-shrink-0",
        config.bg,
        config.ring,
        // Pulse animation for today
        config.pulse && "animate-[dot-pulse_2s_ease-in-out_infinite]",
        className
      )}
    />
  );
}

// ---------------------------------------------------------------------------
// DayDotRow — convenience component for a row of 7 day dots
// ---------------------------------------------------------------------------

export interface DayDotRowProps {
  /**
   * Array of 7 statuses ordered oldest → newest (left → right).
   * Index 6 should be today.
   */
  statuses: DayDotStatus[];
  /** Optional day labels for accessibility (e.g. ["Mon","Tue",...]) */
  dayLabels?: string[];
  /** Additional CSS class names */
  className?: string;
}

export function DayDotRow({ statuses, dayLabels, className }: DayDotRowProps) {
  return (
    <div
      className={cn("flex items-center gap-1", className)}
      role="list"
      aria-label="Last 7 days activity"
    >
      {statuses.map((status, i) => (
        <div key={i} role="listitem">
          <DayDot
            status={status}
            dateLabel={dayLabels?.[i]}
          />
        </div>
      ))}
    </div>
  );
}

export default DayDot;
