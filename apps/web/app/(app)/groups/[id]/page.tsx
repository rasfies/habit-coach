"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { GroupMemberRow, type GroupMember } from "@/components/ui/group-member-row";
import { InviteCodeDisplay } from "@/components/groups/invite-code-display";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GroupDetail {
  id: string;
  name: string;
  invite_code: string;
  member_count: number;
  created_by: string;
  members: GroupMember[];
}

// ---------------------------------------------------------------------------
// Mock data — TODO: replace with API calls
// ---------------------------------------------------------------------------

function makeMockMember(
  id: string,
  name: string,
  streak: number,
  isCurrentUser = false
): GroupMember {
  const statuses: GroupMember["last7Days"] = Array.from({ length: 7 }, (_, i) => {
    if (i === 6) return "today";
    return Math.random() > 0.25 ? "logged" : "missed";
  });
  return { id, displayName: name, streakCount: streak, last7Days: statuses, isCurrentUser };
}

const MOCK_GROUP: GroupDetail = {
  id: "g1",
  name: "Morning Warriors",
  invite_code: "MRN001",
  member_count: 5,
  created_by: "me",
  members: [
    makeMockMember("u1", "Alex Chen", 14, true),
    makeMockMember("u2", "Jordan Lee", 21),
    makeMockMember("u3", "Sam Rivera", 7),
    makeMockMember("u4", "Taylor Kim", 3),
    makeMockMember("u5", "Morgan Patel", 0),
  ],
};

// ---------------------------------------------------------------------------
// Leave confirmation
// ---------------------------------------------------------------------------

function LeaveModal({
  groupName,
  onConfirm,
  onCancel,
  loading,
}: {
  groupName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center px-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} aria-hidden="true" />
      <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl animate-[scale-in_200ms_ease-out]">
        <h2 className="mb-2 text-lg font-bold text-neutral-900">Leave group?</h2>
        <p className="mb-5 text-sm text-neutral-600">
          You&apos;ll be removed from <strong>{groupName}</strong> and won&apos;t appear on the leaderboard. You can rejoin later with the invite code.
        </p>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} disabled={loading} className="flex-1 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={loading} className="flex-1 rounded-xl bg-danger-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-danger-600 disabled:opacity-50">
            {loading ? "Leaving…" : "Leave group"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Group detail page
// ---------------------------------------------------------------------------

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // TODO: replace with API call — GET /api/groups/:id
        await new Promise((r) => setTimeout(r, 300));
        setGroup(MOCK_GROUP);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleLeave() {
    if (!group) return;
    setLeaveLoading(true);
    try {
      // TODO: replace with API call — DELETE /api/groups/:id/leave
      await fetch(`/api/groups/${group.id}/leave`, { method: "DELETE" });
      router.push("/groups");
    } catch {
      setLeaveLoading(false);
      setLeaveOpen(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="text-neutral-500">Group not found.</p>
      </div>
    );
  }

  // Sort members by streak descending
  const sortedMembers = [...group.members].sort(
    (a, b) => b.streakCount - a.streakCount
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-6 md:py-8">
      {/* Back */}
      <button
        type="button"
        onClick={() => router.push("/groups")}
        className="mb-5 flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        All groups
      </button>

      {/* Header */}
      <div className="mb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-2xl">
              👥
            </div>
            <div>
              <h1 className="text-xl font-bold text-neutral-900">{group.name}</h1>
              <p className="text-sm text-neutral-500">
                {group.member_count} member{group.member_count !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setLeaveOpen(true)}
            className="rounded-xl border border-danger-200 px-3.5 py-2 text-sm font-medium text-danger-600 hover:bg-danger-50"
          >
            Leave
          </button>
        </div>
      </div>

      {/* Invite code */}
      <div className="mb-6">
        <InviteCodeDisplay
          code={group.invite_code}
          groupName={group.name}
        />
      </div>

      {/* Leaderboard */}
      <div>
        <h2 className="mb-3 text-base font-semibold text-neutral-800">
          Leaderboard
          <span className="ml-2 text-xs font-normal text-neutral-400">sorted by streak</span>
        </h2>
        <div className="space-y-2">
          {sortedMembers.map((member, i) => (
            <GroupMemberRow
              key={member.id}
              member={member}
              rank={i + 1}
            />
          ))}
        </div>
      </div>

      {/* Leave confirmation */}
      {leaveOpen && (
        <LeaveModal
          groupName={group.name}
          onConfirm={handleLeave}
          onCancel={() => setLeaveOpen(false)}
          loading={leaveLoading}
        />
      )}
    </div>
  );
}
