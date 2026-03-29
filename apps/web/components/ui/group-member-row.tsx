"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { StreakBadge } from "./streak-badge";
import { DayDotRow, type DayDotStatus } from "./day-dot";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GroupMember {
  /** Unique user identifier */
  id: string;
  /** Display name shown in the row */
  displayName: string;
  /** Full avatar URL (from Supabase Storage) */
  avatarUrl?: string | null;
  /** Current streak count */
  streakCount: number;
  /**
   * Last 7 days activity statuses, ordered oldest → newest.
   * Index 6 = today.
   */
  last7Days: DayDotStatus[];
  /** Whether this member is the currently authenticated user */
  isCurrentUser?: boolean;
}

export interface GroupMemberRowProps {
  /** The group member data to display */
  member: GroupMember;
  /** Rank position in the leaderboard (1-based, optional) */
  rank?: number;
  /** Additional CSS class names */
  className?: string;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: number;
}

function MemberAvatar({ src, name, size = 36 }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");

  if (src) {
    return (
      <img
        src={src}
        alt={`${name}'s avatar`}
        width={size}
        height={size}
        className="rounded-full object-cover ring-2 ring-white"
        style={{ width: size, height: size }}
      />
    );
  }

  // Fallback: colored initial circle
  return (
    <div
      className="flex items-center justify-center rounded-full bg-indigo-100 text-indigo-700 ring-2 ring-white font-semibold"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * GroupMemberRow — a single row in the accountability group leaderboard.
 *
 * Layout (left → right):
 *  - Optional rank number (1st, 2nd, 3rd with medal emoji)
 *  - Avatar (36px circle, initials fallback)
 *  - Display name (truncated)
 *  - DayDotRow — last 7 days activity
 *  - StreakBadge — current streak count
 *
 * The current user's row gets a subtle indigo-50 highlight tint.
 */
export function GroupMemberRow({ member, rank, className }: GroupMemberRowProps) {
  const rankEmoji = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
  const isMilestone = [3, 7, 14, 21, 30, 60, 90, 100, 365].includes(member.streakCount);

  // Build day labels: "Mon", "Tue", ... ending at today
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();
  const last7Labels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return dayNames[d.getDay()] ?? "";
  });

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl px-4 py-3 transition-colors duration-150",
        "border border-neutral-100",
        // Highlight current user
        member.isCurrentUser
          ? "bg-indigo-50 border-indigo-100"
          : "bg-white hover:bg-neutral-50",
        className
      )}
      aria-label={`${member.displayName}, ${member.streakCount} day streak`}
    >
      {/* Rank */}
      {rank !== undefined && (
        <span className="w-7 flex-shrink-0 text-center text-sm font-bold text-neutral-500">
          {rankEmoji ?? rank}
        </span>
      )}

      {/* Avatar */}
      <div className="flex-shrink-0">
        <MemberAvatar src={member.avatarUrl} name={member.displayName} />
      </div>

      {/* Name */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm font-semibold",
            member.isCurrentUser ? "text-indigo-700" : "text-neutral-800"
          )}
        >
          {member.displayName}
          {member.isCurrentUser && (
            <span className="ml-1.5 text-xs font-normal text-indigo-500">(you)</span>
          )}
        </p>
      </div>

      {/* Day dots — last 7 days */}
      <DayDotRow
        statuses={member.last7Days}
        dayLabels={last7Labels}
        className="flex-shrink-0"
      />

      {/* Streak badge */}
      <div className="flex-shrink-0">
        <StreakBadge count={member.streakCount} milestone={isMilestone} />
      </div>
    </div>
  );
}

export default GroupMemberRow;
