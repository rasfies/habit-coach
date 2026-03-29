"use client";

import React, { useState, useEffect } from "react";
import posthog from "posthog-js";
import { HabitList, type HabitListItem } from "@/components/habits/habit-list";
import { HabitForm, type HabitFormData } from "@/components/habits/habit-form";
import type { DayDotStatus } from "@/components/ui/day-dot";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Habit extends HabitListItem {
  reminderTime?: string;
}

// ---------------------------------------------------------------------------
// Mock data — TODO: replace with API calls
// ---------------------------------------------------------------------------

function makeLast14Days(): DayDotStatus[] {
  const statuses: DayDotStatus[] = [];
  for (let i = 13; i >= 0; i--) {
    if (i === 0) statuses.push("today");
    else if (i <= 3) statuses.push(Math.random() > 0.2 ? "logged" : "missed");
    else statuses.push(Math.random() > 0.35 ? "logged" : "missed");
  }
  return statuses;
}

const MOCK_HABITS: Habit[] = [
  { id: "1", name: "Morning Run", icon: "🏃", streakCount: 7, checkedToday: false, last14Days: makeLast14Days() },
  { id: "2", name: "Read 20 pages", icon: "📚", streakCount: 3, checkedToday: true, last14Days: makeLast14Days() },
  { id: "3", name: "Meditate 10 min", icon: "🧘", streakCount: 14, checkedToday: false, last14Days: makeLast14Days() },
];

// ---------------------------------------------------------------------------
// Modal wrapper
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
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div className="relative w-full max-w-lg rounded-t-3xl bg-white px-6 pt-5 pb-8 shadow-xl sm:rounded-2xl sm:m-4 animate-[fade-up_300ms_ease-out]">
        <div className="mb-5 flex items-center justify-between">
          <h2 id="modal-title" className="text-lg font-semibold text-neutral-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
            aria-label="Close"
          >
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
// Delete confirmation
// ---------------------------------------------------------------------------

function DeleteConfirmModal({
  habitName,
  onConfirm,
  onCancel,
}: {
  habitName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal open title="Delete habit?" onClose={onCancel}>
      <p className="mb-5 text-sm text-neutral-600">
        Are you sure you want to delete <strong>{habitName}</strong>?
        Your streak history will be preserved, but the habit will no longer appear on your dashboard.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 rounded-xl bg-danger-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-danger-600"
        >
          Delete
        </button>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Habits page
// ---------------------------------------------------------------------------

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>(MOCK_HABITS);
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Modals
  const [addOpen, setAddOpen] = useState(false);
  const [editHabit, setEditHabit] = useState<Habit | null>(null);
  const [deleteHabit, setDeleteHabit] = useState<Habit | null>(null);

  // Load habits
  useEffect(() => {
    async function load() {
      try {
        // TODO: replace with API call — GET /api/habits
        setHabits(MOCK_HABITS);
      } catch {
        // use mock
      }
    }
    load();
  }, []);

  // Toggle check
  async function handleToggleCheck(id: string) {
    const habit = habits.find((h) => h.id === id);
    if (!habit || habit.checkedToday) return;

    setLoadingIds((prev) => new Set(prev).add(id));
    setHabits((prev) =>
      prev.map((h) =>
        h.id === id
          ? { ...h, checkedToday: true, streakCount: h.streakCount + 1 }
          : h
      )
    );

    try {
      // TODO: replace with API call — POST /api/habits/:id/log
      posthog.capture("habit_logged", { habit_id: id });
      await new Promise((r) => setTimeout(r, 300));
    } catch {
      setHabits((prev) =>
        prev.map((h) =>
          h.id === id
            ? { ...h, checkedToday: false, streakCount: h.streakCount - 1 }
            : h
        )
      );
    } finally {
      setLoadingIds((prev) => {
        const s = new Set(prev);
        s.delete(id);
        return s;
      });
    }
  }

  // Add habit
  async function handleAdd(data: HabitFormData) {
    setFormLoading(true);
    setFormError(null);
    try {
      // TODO: replace with API call — POST /api/habits
      const newHabit: Habit = {
        id: `temp-${Date.now()}`,
        name: data.name,
        icon: data.icon,
        streakCount: 0,
        checkedToday: false,
        last14Days: Array(13).fill("future" as DayDotStatus).concat(["today" as DayDotStatus]),
        reminderTime: data.reminderTime,
      };
      setHabits((prev) => [...prev, newHabit]);
      posthog.capture("habit_created", { habit_name: data.name });
      setAddOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create habit.");
    } finally {
      setFormLoading(false);
    }
  }

  // Edit habit
  async function handleEdit(data: HabitFormData) {
    if (!editHabit) return;
    setFormLoading(true);
    setFormError(null);
    try {
      // TODO: replace with API call — PATCH /api/habits/:id
      setHabits((prev) =>
        prev.map((h) =>
          h.id === editHabit.id
            ? { ...h, name: data.name, icon: data.icon, reminderTime: data.reminderTime }
            : h
        )
      );
      setEditHabit(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to update habit.");
    } finally {
      setFormLoading(false);
    }
  }

  // Delete habit
  async function handleDelete() {
    if (!deleteHabit) return;
    try {
      // TODO: replace with API call — DELETE /api/habits/:id
      setHabits((prev) => prev.filter((h) => h.id !== deleteHabit.id));
      setDeleteHabit(null);
    } catch {
      // silent fail
    }
  }

  // Reorder
  async function handleReorder(orderedIds: string[]) {
    try {
      // TODO: replace with API call — POST /api/habits/reorder
      const body = orderedIds.map((id, i) => ({ id, sort_order: i + 1 }));
      await fetch("/api/habits/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: body }),
      });
    } catch {
      // silent fail — local order still updated via HabitList state
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-6 md:py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">My Habits</h1>
          <p className="mt-0.5 text-sm text-neutral-500">
            {habits.length} of 10 habits · drag to reorder
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setFormError(null);
            setAddOpen(true);
          }}
          disabled={habits.length >= 10}
          className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:opacity-50"
          title={habits.length >= 10 ? "Maximum 10 habits reached" : undefined}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add habit
        </button>
      </div>

      {/* List */}
      {habits.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-neutral-200 px-6 py-14 text-center">
          <div className="text-5xl">🌱</div>
          <p className="font-semibold text-neutral-700">No habits yet</p>
          <p className="text-sm text-neutral-500">
            Add your first habit and start building your streak.
          </p>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Add first habit
          </button>
        </div>
      ) : (
        <HabitList
          habits={habits}
          onToggleCheck={handleToggleCheck}
          onReorder={handleReorder}
          onEdit={(id) => {
            const h = habits.find((h) => h.id === id);
            if (h) {
              setFormError(null);
              setEditHabit(h);
            }
          }}
          onDelete={(id) => {
            const h = habits.find((h) => h.id === id);
            if (h) setDeleteHabit(h);
          }}
          loading={loadingIds}
          showDayDots
        />
      )}

      {/* Hint text */}
      {habits.length > 0 && (
        <p className="mt-4 text-center text-xs text-neutral-400">
          Drag the handle on the left to reorder · Click the pencil to edit
        </p>
      )}

      {/* Add modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add new habit">
        <HabitForm
          onSubmit={handleAdd}
          onCancel={() => setAddOpen(false)}
          submitLabel="Add habit"
          loading={formLoading}
          error={formError}
        />
      </Modal>

      {/* Edit modal */}
      <Modal
        open={!!editHabit}
        onClose={() => setEditHabit(null)}
        title="Edit habit"
      >
        {editHabit && (
          <HabitForm
            initialData={{
              name: editHabit.name,
              icon: editHabit.icon,
              reminderTime: editHabit.reminderTime ?? "",
            }}
            onSubmit={handleEdit}
            onCancel={() => setEditHabit(null)}
            submitLabel="Save changes"
            loading={formLoading}
            error={formError}
          />
        )}
      </Modal>

      {/* Delete confirmation */}
      {deleteHabit && (
        <DeleteConfirmModal
          habitName={deleteHabit.name}
          onConfirm={handleDelete}
          onCancel={() => setDeleteHabit(null)}
        />
      )}
    </div>
  );
}
