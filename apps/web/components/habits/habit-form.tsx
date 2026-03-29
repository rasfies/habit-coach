"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HabitFormData {
  name: string;
  icon: string;
  reminderTime: string; // "HH:MM" or ""
}

export interface HabitFormProps {
  /** Initial values (for editing) */
  initialData?: Partial<HabitFormData>;
  /** Called on valid submit */
  onSubmit: (data: HabitFormData) => Promise<void> | void;
  /** Called on cancel */
  onCancel?: () => void;
  /** Submit button label */
  submitLabel?: string;
  /** Whether the form is in a loading state */
  loading?: boolean;
  /** Error message to display */
  error?: string | null;
}

// ---------------------------------------------------------------------------
// Emoji options
// ---------------------------------------------------------------------------

const EMOJI_OPTIONS = [
  "🏃", "💪", "🧘", "🚴", "🏊", "🤸",
  "📚", "✍️", "🎨", "🎸", "🎹", "🧑‍💻",
  "🥗", "💧", "🍎", "☕", "🥦", "🍳",
  "😴", "🧹", "🪴", "🐕", "💊", "🧘‍♀️",
  "🌅", "🌙", "⭐", "🔥", "✅", "💡",
];

// ---------------------------------------------------------------------------
// HabitForm component
// ---------------------------------------------------------------------------

export function HabitForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Save habit",
  loading = false,
  error,
}: HabitFormProps) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [icon, setIcon] = useState(initialData?.icon ?? "🏃");
  const [reminderTime, setReminderTime] = useState(initialData?.reminderTime ?? "");
  const [nameError, setNameError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNameError(null);

    if (!name.trim()) {
      setNameError("Habit name is required.");
      return;
    }
    if (name.trim().length > 100) {
      setNameError("Habit name must be under 100 characters.");
      return;
    }

    await onSubmit({
      name: name.trim(),
      icon,
      reminderTime,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Server error */}
      {error && (
        <div className="rounded-lg bg-danger-50 px-4 py-3 text-sm text-danger-600 ring-1 ring-danger-400/30">
          {error}
        </div>
      )}

      {/* Habit name */}
      <div>
        <label htmlFor="habit-name" className="mb-1.5 block text-sm font-medium text-neutral-700">
          Habit name <span className="text-danger-500">*</span>
        </label>
        <input
          id="habit-name"
          type="text"
          required
          maxLength={100}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setNameError(null);
          }}
          className={cn(
            "w-full rounded-xl border px-3.5 py-2.5 text-sm placeholder-neutral-400 shadow-sm outline-none transition-shadow focus:ring-2 focus:ring-brand-400/20",
            nameError
              ? "border-danger-400"
              : "border-neutral-200 focus:border-brand-400"
          )}
          placeholder="e.g. Morning Run, Read 20 pages…"
          autoFocus
        />
        {nameError && (
          <p className="mt-1 text-xs text-danger-600">{nameError}</p>
        )}
      </div>

      {/* Icon picker */}
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700">
          Icon
        </label>
        <div className="grid grid-cols-10 gap-1.5 sm:grid-cols-12" role="radiogroup" aria-label="Habit icon">
          {EMOJI_OPTIONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              role="radio"
              aria-checked={icon === emoji}
              onClick={() => setIcon(emoji)}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl text-xl transition-all",
                icon === emoji
                  ? "bg-brand-100 ring-2 ring-brand-500 scale-110"
                  : "hover:bg-neutral-100 hover:scale-105"
              )}
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-neutral-500">
          Selected: <span className="text-base">{icon}</span>
        </p>
      </div>

      {/* Reminder time */}
      <div>
        <label htmlFor="reminder-time" className="mb-1.5 block text-sm font-medium text-neutral-700">
          Daily reminder{" "}
          <span className="text-xs font-normal text-neutral-400">(optional)</span>
        </label>
        <input
          id="reminder-time"
          type="time"
          value={reminderTime}
          onChange={(e) => setReminderTime(e.target.value)}
          className="w-full rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm shadow-sm outline-none transition-shadow focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
        />
        <p className="mt-1 text-xs text-neutral-400">
          Leave blank to skip reminders for this habit.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

export default HabitForm;
