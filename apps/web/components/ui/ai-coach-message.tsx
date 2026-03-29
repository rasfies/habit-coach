"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AIMessageType = "daily" | "milestone" | "encouragement";

export interface AICoachMessageProps {
  /** The coaching message text */
  message: string;
  /** When this message was generated */
  timestamp: Date;
  /** Message type controls visual treatment and gradient */
  type: AIMessageType;
  /** Optional coach display name (defaults to "HabitAI Coach") */
  coachName?: string;
  /** Additional CSS class names */
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(date: Date): string {
  const today = new Date();
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  if (isToday) return `Today at ${formatTimestamp(date)}`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" }) +
    ` at ${formatTimestamp(date)}`;
}

/** Returns Tailwind gradient classes per message type */
function getGradient(type: AIMessageType): string {
  switch (type) {
    case "daily":
      // Indigo → purple — calm, professional daily check-in
      return "bg-gradient-to-br from-indigo-600 to-purple-700";
    case "milestone":
      // Amber → orange — celebratory milestone message
      return "bg-gradient-to-br from-amber-400 to-orange-500";
    case "encouragement":
      // Indigo → emerald — warm, motivating nudge
      return "bg-gradient-to-br from-indigo-500 to-emerald-600";
  }
}

/** Returns type pill label */
function getTypeLabel(type: AIMessageType): string {
  switch (type) {
    case "daily":        return "Daily Coach";
    case "milestone":    return "Milestone";
    case "encouragement": return "Coach";
  }
}

/** Returns the AI coach icon based on type */
function CoachIcon({ type }: { type: AIMessageType }) {
  if (type === "milestone") {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-5 w-5"
        aria-hidden="true"
      >
        {/* Sparkles icon */}
        <path
          fillRule="evenodd"
          d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5Z"
          clipRule="evenodd"
        />
      </svg>
    );
  }
  // Robot / CPU icon for daily and encouragement
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-5 w-5"
      aria-hidden="true"
    >
      {/* CPU chip — represents AI coach */}
      <path d="M16.5 7.5h-9v9h9v-9Z" />
      <path
        fillRule="evenodd"
        d="M8.25 2.25A.75.75 0 0 1 9 3v.75h2.25V3a.75.75 0 0 1 1.5 0v.75H15V3a.75.75 0 0 1 1.5 0v.75h.75a3 3 0 0 1 3 3v.75H21A.75.75 0 0 1 21 9h-.75v2.25H21a.75.75 0 0 1 0 1.5h-.75V15H21a.75.75 0 0 1 0 1.5h-.75v.75a3 3 0 0 1-3 3h-.75V21a.75.75 0 0 1-1.5 0v-.75h-2.25V21a.75.75 0 0 1-1.5 0v-.75H9V21a.75.75 0 0 1-1.5 0v-.75h-.75a3 3 0 0 1-3-3v-.75H3A.75.75 0 0 1 3 15h.75v-2.25H3a.75.75 0 0 1 0-1.5h.75V9H3a.75.75 0 0 1 0-1.5h.75v-.75a3 3 0 0 1 3-3h.75V3a.75.75 0 0 1 .75-.75ZM6 6.75A.75.75 0 0 1 6.75 6h10.5a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75H6.75a.75.75 0 0 1-.75-.75V6.75Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * AICoachMessage — a chat-bubble style message from the AI coach.
 *
 * Features:
 *  - Left-aligned layout with coach avatar
 *  - Gradient background that varies by message type:
 *      daily        → indigo → purple (calm, professional)
 *      milestone    → amber → orange (celebratory)
 *      encouragement → indigo → emerald (warm, motivating)
 *  - Subtle type pill badge in top-right corner
 *  - Timestamp in bottom-right, white/70 opacity
 *  - Fade-up entrance animation
 */
export function AICoachMessage({
  message,
  timestamp,
  type,
  coachName = "HabitAI Coach",
  className,
}: AICoachMessageProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 animate-[fade-up_300ms_ease-out]",
        className
      )}
      role="article"
      aria-label={`${coachName} ${getTypeLabel(type)} message`}
    >
      {/* Coach avatar */}
      <div
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white shadow-md text-indigo-600"
        aria-hidden="true"
      >
        <CoachIcon type={type} />
      </div>

      {/* Bubble */}
      <div className={cn("relative max-w-sm rounded-2xl px-4 py-3", getGradient(type))}>
        {/* Type label pill */}
        <span className="absolute right-3 top-2.5 rounded-full bg-white/20 px-2 py-0.5 text-xs font-semibold text-white/90">
          {getTypeLabel(type)}
        </span>

        {/* Coach name */}
        <p className="mb-1 text-xs font-semibold text-white/80 pr-20">{coachName}</p>

        {/* Message body */}
        <p className="text-sm leading-relaxed text-white">{message}</p>

        {/* Timestamp */}
        <p className="mt-2 text-right text-xs text-white/60">
          <time dateTime={timestamp.toISOString()}>{formatDate(timestamp)}</time>
        </p>
      </div>
    </div>
  );
}

export default AICoachMessage;
