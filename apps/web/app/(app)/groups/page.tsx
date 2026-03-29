"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import posthog from "posthog-js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Group {
  id: string;
  name: string;
  invite_code: string;
  member_count: number;
  created_by: string;
  joined_at: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Mock data — TODO: replace with API calls
// ---------------------------------------------------------------------------

const MOCK_GROUPS: Group[] = [
  {
    id: "g1",
    name: "Morning Warriors",
    invite_code: "MRN001",
    member_count: 5,
    created_by: "me",
    joined_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: "g2",
    name: "Study Buddies",
    invite_code: "STD999",
    member_count: 3,
    created_by: "other",
    joined_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
];

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md rounded-t-3xl bg-white px-6 pt-5 pb-8 shadow-xl sm:rounded-2xl sm:m-4 animate-[fade-up_300ms_ease-out]">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Group card
// ---------------------------------------------------------------------------

function GroupCard({ group }: { group: Group }) {
  return (
    <Link
      href={`/groups/${group.id}`}
      className="block rounded-2xl bg-white p-5 shadow-habit-card ring-1 ring-neutral-100 transition-shadow hover:shadow-habit-card-hover"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-2xl">
            👥
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900">{group.name}</h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              {group.member_count} member{group.member_count !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5 flex-shrink-0 text-neutral-300 mt-0.5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-mono text-xs font-semibold text-neutral-500">
          {group.invite_code}
        </span>
        <span className="text-xs text-neutral-400">
          Joined {new Date(group.joined_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Groups page
// ---------------------------------------------------------------------------

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>(MOCK_GROUPS);

  // Create group modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createdGroup, setCreatedGroup] = useState<Group | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Join group modal
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Load groups
  useEffect(() => {
    async function load() {
      try {
        // TODO: replace with API call — GET /api/groups
        setGroups(MOCK_GROUPS);
      } catch {
        // use mock
      }
    }
    load();
  }, []);

  // Create group
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!createName.trim()) return;
    setCreateLoading(true);
    setCreateError(null);
    try {
      // TODO: replace with API call — POST /api/groups
      const mockNew: Group = {
        id: `g${Date.now()}`,
        name: createName.trim(),
        invite_code: Math.random().toString(36).toUpperCase().slice(2, 8),
        member_count: 1,
        created_by: "me",
        joined_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      setGroups((prev) => [...prev, mockNew]);
      setCreatedGroup(mockNew);
      setCreateName("");
      posthog.capture("group_created", { group_name: createName.trim() });
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create group.");
    } finally {
      setCreateLoading(false);
    }
  }

  // Join group
  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (joinCode.trim().length !== 6) return;
    setJoinLoading(true);
    setJoinError(null);
    try {
      // TODO: replace with API call — POST /api/groups/join
      const res = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invite_code: joinCode.trim().toUpperCase() }),
      });
      if (!res.ok) {
        throw new Error("This invite code is not valid.");
      }
      const data = await res.json();
      const joined: Group = {
        id: data.group_id,
        name: data.group_name,
        invite_code: joinCode.toUpperCase(),
        member_count: data.member_count,
        created_by: "other",
        joined_at: data.joined_at ?? new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      setGroups((prev) => {
        if (prev.find((g) => g.id === joined.id)) return prev;
        return [...prev, joined];
      });
      posthog.capture("group_joined", { code: joinCode });
      setJoinOpen(false);
      setJoinCode("");
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "Invalid invite code.");
    } finally {
      setJoinLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-6 md:py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Groups</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            {groups.length} group{groups.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setJoinError(null); setJoinOpen(true); }}
            className="rounded-xl border border-neutral-200 px-3.5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Join
          </button>
          <button
            type="button"
            onClick={() => { setCreateError(null); setCreatedGroup(null); setCreateOpen(true); }}
            className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create
          </button>
        </div>
      </div>

      {/* Groups list */}
      {groups.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-neutral-200 px-6 py-14 text-center">
          <div className="text-5xl">👥</div>
          <p className="font-semibold text-neutral-700">No groups yet</p>
          <p className="max-w-xs text-sm text-neutral-500">
            Create a group and invite friends, or join an existing group with an invite code.
          </p>
          <div className="flex gap-3">
            <button type="button" onClick={() => setJoinOpen(true)} className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
              Join with code
            </button>
            <button type="button" onClick={() => setCreateOpen(true)} className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
              Create group
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => (
            <GroupCard key={g.id} group={g} />
          ))}
        </div>
      )}

      {/* Create group modal */}
      <Modal open={createOpen} onClose={() => { setCreateOpen(false); setCreatedGroup(null); }} title="Create a group">
        {createdGroup ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="text-4xl">🎉</div>
            <p className="font-semibold text-neutral-900">
              &ldquo;{createdGroup.name}&rdquo; created!
            </p>
            <p className="text-sm text-neutral-500">Share this invite code with friends:</p>
            <div className="w-full rounded-xl bg-brand-50 px-5 py-4 text-center ring-1 ring-brand-200">
              <p className="font-mono text-3xl font-bold tracking-[0.3em] text-brand-700">
                {createdGroup.invite_code}
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setCreateOpen(false); setCreatedGroup(null); }}
              className="w-full rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-4">
            {createError && (
              <div className="rounded-lg bg-danger-50 px-4 py-3 text-sm text-danger-600 ring-1 ring-danger-400/30">
                {createError}
              </div>
            )}
            <div>
              <label htmlFor="group-name" className="mb-1.5 block text-sm font-medium text-neutral-700">
                Group name
              </label>
              <input
                id="group-name"
                type="text"
                required
                maxLength={60}
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
                placeholder="e.g. Morning Warriors"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setCreateOpen(false)} className="flex-1 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
                Cancel
              </button>
              <button type="submit" disabled={createLoading || !createName.trim()} className="flex-1 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
                {createLoading ? "Creating…" : "Create group"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Join group modal */}
      <Modal open={joinOpen} onClose={() => setJoinOpen(false)} title="Join a group">
        <form onSubmit={handleJoin} className="space-y-4">
          {joinError && (
            <div className="rounded-lg bg-danger-50 px-4 py-3 text-sm text-danger-600 ring-1 ring-danger-400/30">
              {joinError}
            </div>
          )}
          <div>
            <label htmlFor="join-code" className="mb-1.5 block text-sm font-medium text-neutral-700">
              Invite code
            </label>
            <input
              id="join-code"
              type="text"
              required
              maxLength={6}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-center font-mono text-2xl font-bold tracking-widest uppercase outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
              placeholder="ABC123"
              autoFocus
            />
            <p className="mt-1 text-xs text-neutral-400">
              Ask the group creator for their 6-character invite code.
            </p>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setJoinOpen(false)} className="flex-1 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
              Cancel
            </button>
            <button type="submit" disabled={joinLoading || joinCode.length !== 6} className="flex-1 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
              {joinLoading ? "Joining…" : "Join group"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
