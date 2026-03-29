import { supabase } from "./supabase";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------

async function fetchWithAuth(path: string, options: RequestInit = {}): Promise<Response> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token = session?.access_token;

  return fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
}

// ---------------------------------------------------------------------------
// Auth API (unauthenticated endpoints)
// ---------------------------------------------------------------------------

export const authApi = {
  signup: (body: { email: string; password: string; display_name: string }) =>
    fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  login: (body: { email: string; password: string }) =>
    fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  logout: () => fetchWithAuth("/api/auth/logout", { method: "POST" }),

  googleOAuth: (redirect_url: string) =>
    fetch(`${BASE_URL}/api/auth/oauth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ redirect_url }),
    }),
};

// ---------------------------------------------------------------------------
// User API
// ---------------------------------------------------------------------------

export const usersApi = {
  getMe: () => fetchWithAuth("/api/users/me"),

  updateMe: (body: {
    display_name?: string;
    reminder_time?: string | null;
    notification_enabled?: boolean;
  }) =>
    fetchWithAuth("/api/users/me", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  completeOnboarding: () =>
    fetchWithAuth("/api/users/me/onboarding", {
      method: "PATCH",
      body: JSON.stringify({ onboarding_complete: true }),
    }),

  uploadAvatar: async (uri: string): Promise<Response> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;

    const formData = new FormData();
    const filename = uri.split("/").pop() ?? "avatar.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : "image/jpeg";
    formData.append("file", { uri, name: filename, type } as unknown as Blob);

    return fetch(`${BASE_URL}/api/users/me/avatar`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        // Do NOT set Content-Type — let fetch set multipart boundary
      },
      body: formData,
    });
  },
};

// ---------------------------------------------------------------------------
// Habits API
// ---------------------------------------------------------------------------

export interface HabitPayload {
  name: string;
  icon?: string;
  reminder_time?: string;
  frequency: "daily";
}

export const habitsApi = {
  list: (activeOnly = true) =>
    fetchWithAuth(`/api/habits?active_only=${activeOnly}`),

  get: (id: string) => fetchWithAuth(`/api/habits/${id}`),

  create: (body: HabitPayload) =>
    fetchWithAuth("/api/habits", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  update: (id: string, body: Partial<HabitPayload & { sort_order: number }>) =>
    fetchWithAuth(`/api/habits/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  remove: (id: string) =>
    fetchWithAuth(`/api/habits/${id}`, { method: "DELETE" }),

  reorder: (order: Array<{ id: string; sort_order: number }>) =>
    fetchWithAuth("/api/habits/reorder", {
      method: "POST",
      body: JSON.stringify({ order }),
    }),

  logToday: (id: string, log_date?: string) =>
    fetchWithAuth(`/api/habits/${id}/log`, {
      method: "POST",
      body: JSON.stringify(log_date ? { log_date } : {}),
    }),

  getLogs: (id: string, from: string, to: string) =>
    fetchWithAuth(`/api/habits/${id}/logs?from=${from}&to=${to}`),

  getTodayStatus: (date?: string) =>
    fetchWithAuth(`/api/habits/logs/today${date ? `?date=${date}` : ""}`),
};

// ---------------------------------------------------------------------------
// Streaks API
// ---------------------------------------------------------------------------

export const streaksApi = {
  getAll: () => fetchWithAuth("/api/streaks"),

  getForHabit: (habitId: string) =>
    fetchWithAuth(`/api/habits/${habitId}/streak`),
};

// ---------------------------------------------------------------------------
// Coaching API
// ---------------------------------------------------------------------------

export const coachingApi = {
  getToday: (date?: string) =>
    fetchWithAuth(`/api/coach/message/today${date ? `?date=${date}` : ""}`),

  generate: (body: {
    message_type: "daily" | "day1_welcome" | "streak_3" | "streak_7";
    habit_id?: string;
  }) =>
    fetchWithAuth("/api/coach/message/generate", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getHistory: (page = 1, perPage = 20) =>
    fetchWithAuth(`/api/coach/messages?page=${page}&per_page=${perPage}`),
};

// ---------------------------------------------------------------------------
// Groups API
// ---------------------------------------------------------------------------

export const groupsApi = {
  list: () => fetchWithAuth("/api/groups"),

  create: (name: string) =>
    fetchWithAuth("/api/groups", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),

  getDetail: (id: string) => fetchWithAuth(`/api/groups/${id}`),

  getMembers: (id: string) => fetchWithAuth(`/api/groups/${id}/members`),

  getStreaks: (id: string) => fetchWithAuth(`/api/groups/${id}/streaks`),

  join: (invite_code: string) =>
    fetchWithAuth("/api/groups/join", {
      method: "POST",
      body: JSON.stringify({ invite_code }),
    }),

  leave: (id: string) =>
    fetchWithAuth(`/api/groups/${id}/leave`, { method: "DELETE" }),
};

// ---------------------------------------------------------------------------
// Analytics API
// ---------------------------------------------------------------------------

export const analyticsApi = {
  getWeekly: (weekStart?: string) =>
    fetchWithAuth(`/api/analytics/weekly${weekStart ? `?week_start=${weekStart}` : ""}`),

  getMonthly: (month?: string) =>
    fetchWithAuth(`/api/analytics/monthly${month ? `?month=${month}` : ""}`),

  getSummary: () => fetchWithAuth("/api/analytics/summary"),
};

// ---------------------------------------------------------------------------
// Notifications API
// ---------------------------------------------------------------------------

export const notificationsApi = {
  register: (token: string, platform: "ios" | "android" | "web") =>
    fetchWithAuth("/api/notifications/register", {
      method: "POST",
      body: JSON.stringify({ token, platform }),
    }),

  deregister: (token: string) =>
    fetchWithAuth(`/api/notifications/token/${token}`, { method: "DELETE" }),

  getPreferences: () => fetchWithAuth("/api/notifications/preferences"),

  updatePreferences: (body: {
    notification_enabled: boolean;
    reminder_time?: string | null;
  }) =>
    fetchWithAuth("/api/notifications/preferences", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
};

// ---------------------------------------------------------------------------
// Barrel export — primary API object
// ---------------------------------------------------------------------------

export const api = {
  auth: authApi,
  users: usersApi,
  habits: habitsApi,
  streaks: streaksApi,
  coaching: coachingApi,
  groups: groupsApi,
  analytics: analyticsApi,
  notifications: notificationsApi,
};

export default api;
