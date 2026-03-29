"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100 md:p-6">
      <h2 className="mb-4 text-base font-semibold text-neutral-800">{title}</h2>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Avatar upload
// ---------------------------------------------------------------------------

function AvatarUpload({
  currentUrl,
  name,
  onUpload,
}: {
  currentUrl: string | null;
  name: string;
  onUpload: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const initials = name
    .split(" ")
    .map((p) => p[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPEG, PNG, and WebP images are supported.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Avatar must be under 2MB.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // TODO: replace with API call — POST /api/users/me/avatar
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/users/me/avatar", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed.");
      const { avatar_url } = await res.json();
      onUpload(avatar_url);
    } catch {
      // Fallback: show local preview
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) onUpload(ev.target.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-5">
      {/* Avatar */}
      <div className="relative">
        {currentUrl ? (
          <img src={currentUrl} alt={name} className="h-16 w-16 rounded-full object-cover ring-2 ring-neutral-200" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-xl font-bold text-brand-700 ring-2 ring-neutral-200">
            {initials}
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-white/70">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-300 border-t-brand-600" />
          </div>
        )}
      </div>

      {/* Upload button */}
      <div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
        >
          {uploading ? "Uploading…" : "Change photo"}
        </button>
        <p className="mt-1 text-xs text-neutral-400">JPEG or PNG, max 2MB</p>
        {error && <p className="mt-1 text-xs text-danger-600">{error}</p>}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFile}
          className="hidden"
          aria-label="Upload avatar"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Settings page
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const router = useRouter();

  // Profile state
  const [displayName, setDisplayName] = useState("Alex Chen");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);

  // Notifications state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState("08:00");
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifSaved, setNotifSaved] = useState(false);

  // Delete state
  const [deleteInput, setDeleteInput] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // -- Save profile
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim() || displayName.trim().length < 2) {
      setProfileError("Display name must be at least 2 characters.");
      return;
    }
    setProfileLoading(true);
    setProfileError(null);
    try {
      // TODO: replace with API call — PATCH /api/users/me
      await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: displayName.trim() }),
      });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch {
      setProfileError("Failed to save profile.");
    } finally {
      setProfileLoading(false);
    }
  }

  // -- Save notifications
  async function handleSaveNotifications(e: React.FormEvent) {
    e.preventDefault();
    setNotifLoading(true);
    try {
      // TODO: replace with API call — PATCH /api/notifications/preferences
      await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notification_enabled: notificationsEnabled,
          reminder_time: notificationsEnabled ? reminderTime : null,
        }),
      });
      setNotifSaved(true);
      setTimeout(() => setNotifSaved(false), 2500);
    } finally {
      setNotifLoading(false);
    }
  }

  // -- Delete account
  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault();
    if (deleteInput !== "DELETE") {
      setDeleteError('Type "DELETE" to confirm.');
      return;
    }
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      // TODO: replace with API call — DELETE /api/users/me
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
    } catch {
      setDeleteError("Failed to delete account. Please try again.");
      setDeleteLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6 md:px-6 md:py-8">
      <h1 className="mb-6 text-2xl font-bold text-neutral-900">Settings</h1>

      <div className="space-y-5">
        {/* Profile */}
        <Section title="Profile">
          <AvatarUpload
            currentUrl={avatarUrl}
            name={displayName}
            onUpload={(url) => setAvatarUrl(url)}
          />
          <form onSubmit={handleSaveProfile} className="mt-5 space-y-4">
            <div>
              <label htmlFor="display-name" className="mb-1.5 block text-sm font-medium text-neutral-700">
                Display name
              </label>
              <input
                id="display-name"
                type="text"
                required
                minLength={2}
                maxLength={50}
                value={displayName}
                onChange={(e) => { setDisplayName(e.target.value); setProfileError(null); }}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-shadow focus:ring-2 focus:ring-brand-400/20 ${profileError ? "border-danger-400" : "border-neutral-200 focus:border-brand-400"}`}
              />
              {profileError && <p className="mt-1 text-xs text-danger-600">{profileError}</p>}
            </div>
            <button
              type="submit"
              disabled={profileLoading}
              className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {profileSaved ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Saved!
                </>
              ) : profileLoading ? "Saving…" : "Save changes"}
            </button>
          </form>
        </Section>

        {/* Notifications */}
        <Section title="Notifications">
          <form onSubmit={handleSaveNotifications} className="space-y-4">
            {/* Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-800">Daily reminders</p>
                <p className="text-xs text-neutral-500">Get notified at your reminder time each day</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={notificationsEnabled}
                onClick={() => setNotificationsEnabled((v) => !v)}
                className={`relative h-6 w-11 rounded-full transition-colors ${notificationsEnabled ? "bg-brand-600" : "bg-neutral-200"}`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${notificationsEnabled ? "translate-x-5" : "translate-x-0.5"}`}
                />
              </button>
            </div>

            {/* Time picker */}
            {notificationsEnabled && (
              <div>
                <label htmlFor="reminder-time" className="mb-1.5 block text-sm font-medium text-neutral-700">
                  Reminder time
                </label>
                <input
                  id="reminder-time"
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="rounded-xl border border-neutral-200 px-3.5 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={notifLoading}
              className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {notifSaved ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-4 w-4" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Saved!
                </>
              ) : notifLoading ? "Saving…" : "Save preferences"}
            </button>
          </form>
        </Section>

        {/* Danger zone */}
        <Section title="Danger zone">
          <div className="rounded-xl bg-danger-50 p-4 ring-1 ring-danger-200">
            <h3 className="mb-1 text-sm font-semibold text-danger-700">Delete account</h3>
            <p className="mb-4 text-xs text-danger-600">
              This permanently deletes your account, habits, and streak history. This action cannot be undone.
            </p>
            <form onSubmit={handleDeleteAccount} className="space-y-3">
              <div>
                <label htmlFor="delete-confirm" className="mb-1.5 block text-xs font-medium text-danger-700">
                  Type DELETE to confirm
                </label>
                <input
                  id="delete-confirm"
                  type="text"
                  value={deleteInput}
                  onChange={(e) => { setDeleteInput(e.target.value); setDeleteError(null); }}
                  className="w-full rounded-xl border border-danger-200 bg-white px-3.5 py-2.5 text-sm font-mono outline-none focus:border-danger-400 focus:ring-2 focus:ring-danger-400/20"
                  placeholder="DELETE"
                  autoComplete="off"
                />
                {deleteError && <p className="mt-1 text-xs text-danger-600">{deleteError}</p>}
              </div>
              <button
                type="submit"
                disabled={deleteLoading || deleteInput !== "DELETE"}
                className="rounded-xl bg-danger-500 px-4 py-2 text-sm font-semibold text-white hover:bg-danger-600 disabled:opacity-40"
              >
                {deleteLoading ? "Deleting…" : "Delete my account"}
              </button>
            </form>
          </div>
        </Section>
      </div>
    </div>
  );
}
