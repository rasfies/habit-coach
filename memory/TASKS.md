# TASKS.md — AI Habit Coach

_Generated: 2026-03-27 | Sprint 1 = MVP (Phase 4 build) | Sprint 2 = Post-launch_

---

## EPIC 1: Infrastructure & DevOps

- [ ] TASK-001 | agent:devops | S | Initialize Turborepo monorepo with workspaces: /apps/web, /apps/mobile, /packages/ui, /packages/db, /packages/config | deps: none
- [ ] TASK-002 | agent:devops | S | Configure root package.json, tsconfig base, ESLint + Prettier shared configs in /packages/config | deps: TASK-001
- [ ] TASK-003 | agent:devops | M | Bootstrap Next.js 15 app in /apps/web (TypeScript, Tailwind, App Router, shadcn/ui init) | deps: TASK-001
- [ ] TASK-004 | agent:devops | M | Bootstrap Expo + React Native app in /apps/mobile (TypeScript, Expo Router, NativeWind) | deps: TASK-001
- [ ] TASK-005 | agent:devops | S | Create /packages/db: Supabase client factory, shared TypeScript types generated from schema | deps: TASK-001
- [ ] TASK-006 | agent:devops | S | Create /packages/ui: shared component stubs (Button, Card, Input, Avatar, Badge) consumed by web and mobile | deps: TASK-002
- [ ] TASK-007 | agent:devops | M | Configure Supabase project: enable Auth (email/password + Google OAuth), set JWT expiry, configure redirect URLs for web and mobile deep links | deps: TASK-001
- [ ] TASK-008 | agent:devops | M | Write and apply Supabase migrations: create all 9 tables (users, habits, habit_logs, streaks, groups, group_members, ai_messages, analytics_snapshots, notification_tokens) with correct types, constraints, and unique indexes | deps: TASK-007
- [ ] TASK-009 | agent:devops | M | Write Row Level Security (RLS) policies for all tables: users (own row), habits (user_id), habit_logs (user_id), streaks (user_id), groups (member via group_members), group_members (own + same-group read), ai_messages (user_id), analytics_snapshots (user_id), notification_tokens (user_id) | deps: TASK-008
- [ ] TASK-010 | agent:devops | S | Write Supabase database triggers: member_count auto-update on group_members insert/delete; updated_at auto-stamp on all tables | deps: TASK-008
- [ ] TASK-011 | agent:devops | S | Configure GitHub Actions CI: lint, type-check, Vitest unit tests on PR for all workspaces | deps: TASK-002
- [ ] TASK-012 | agent:devops | S | Configure Vercel project for /apps/web: env vars, preview deployments, production branch | deps: TASK-003
- [ ] TASK-013 | agent:devops | S | Set up Sentry error tracking in web app and mobile app (source maps, environment tagging) | deps: TASK-003, TASK-004
- [ ] TASK-014 | agent:devops | S | Set up PostHog analytics in web app and mobile app (identify on login, capture key events) | deps: TASK-003, TASK-004
- [ ] TASK-015 | agent:devops | S | Document all required environment variables in /memory/ENV_VARS.md (no values — names and descriptions only) | deps: TASK-007

---

## EPIC 2: Authentication

- [ ] TASK-016 | agent:backend | M | Implement Supabase Auth server-side helpers for Next.js: middleware to protect routes, session refresh, getUser() utility | deps: TASK-007, TASK-008
- [ ] TASK-017 | agent:backend | M | API route: POST /api/auth/signup — create Supabase auth user, insert row into users table (display_name, email, onboarding_complete: false), return session | deps: TASK-016
- [ ] TASK-018 | agent:backend | S | API route: POST /api/auth/logout — invalidate Supabase session, clear cookies | deps: TASK-016
- [ ] TASK-019 | agent:backend | S | Supabase Auth callback handler: /api/auth/callback — handles Google OAuth code exchange, upserts user record in users table | deps: TASK-016
- [ ] TASK-020 | agent:frontend | M | Web: Sign Up page (/auth/signup) — email/password form + "Continue with Google" button, validation, error display, redirect to /onboarding/habits on success | deps: TASK-017, TASK-019
- [ ] TASK-021 | agent:frontend | M | Web: Log In page (/auth/login) — email/password form + Google OAuth, error handling, redirect to /dashboard or /onboarding/habits if onboarding_complete=false | deps: TASK-016, TASK-017
- [ ] TASK-022 | agent:frontend | S | Web: Auth middleware — redirect unauthenticated users from protected routes to /auth/login; redirect authenticated users away from /auth/* | deps: TASK-016
- [ ] TASK-023 | agent:mobile | M | Mobile: Sign Up screen (Auth Stack) — email/password + Google OAuth via Expo AuthSession, same validation as web, navigate to Onboarding stack | deps: TASK-017, TASK-019
- [ ] TASK-024 | agent:mobile | M | Mobile: Log In screen (Auth Stack) — email/password + Google OAuth, session storage via SecureStore, navigate to Today tab or Onboarding | deps: TASK-016
- [ ] TASK-025 | agent:mobile | S | Mobile: Splash screen with auth check — if session exists go to Today tab, else go to Log In screen | deps: TASK-024

---

## EPIC 3: Onboarding Flow

- [ ] TASK-026 | agent:backend | S | API route: PATCH /api/users/[id] — update display_name, avatar_url, reminder_time, onboarding_complete; RLS enforced | deps: TASK-008, TASK-016
- [ ] TASK-027 | agent:frontend | M | Web: Onboarding — Habits step (/onboarding/habits) — create 1–3 habits inline (name, optional icon, optional reminder time), validation (min 1 required), save each via habits API, show progress indicator | deps: TASK-026, TASK-034
- [ ] TASK-028 | agent:frontend | M | Web: Onboarding — Groups step (/onboarding/groups) — three options: Create Group (enter name), Join Group (enter code), Skip (ghost button); call appropriate group API; on complete set onboarding_complete=true via PATCH /api/users/[id] | deps: TASK-027, TASK-055, TASK-056
- [ ] TASK-029 | agent:frontend | S | Web: Redirect logic — after onboarding_complete=true, redirect to /dashboard where Day 1 AI message is triggered | deps: TASK-028
- [ ] TASK-030 | agent:mobile | M | Mobile: Onboarding — Habits screen — same logic as web step (TASK-027), native form with emoji picker for icon | deps: TASK-026, TASK-034
- [ ] TASK-031 | agent:mobile | M | Mobile: Onboarding — Groups screen — same logic as web step (TASK-028), navigate to Today tab on completion | deps: TASK-030, TASK-055, TASK-056

---

## EPIC 4: Habits CRUD & Daily Logging

- [ ] TASK-032 | agent:backend | S | API route: GET /api/habits — return all active habits for authenticated user, ordered by sort_order | deps: TASK-008, TASK-016
- [ ] TASK-033 | agent:backend | M | API route: POST /api/habits — create habit; validate name required, max 10 active habits (422 if exceeded), set sort_order to end of list | deps: TASK-008, TASK-016
- [ ] TASK-034 | agent:backend | S | API route: PATCH /api/habits/[id] — update name, icon, reminder_time, sort_order, is_active; RLS enforced | deps: TASK-008, TASK-016
- [ ] TASK-035 | agent:backend | S | API route: DELETE /api/habits/[id] — soft delete (set is_active=false); RLS enforced | deps: TASK-008, TASK-016
- [ ] TASK-036 | agent:backend | S | API route: PATCH /api/habits/reorder — accept ordered array of habit IDs, update sort_order for each; RLS enforced | deps: TASK-008, TASK-016
- [ ] TASK-037 | agent:backend | M | API route: GET /api/habits/[id]/logs — return habit_logs for a given habit, filterable by date range; includes today's log status | deps: TASK-008, TASK-016
- [ ] TASK-038 | agent:backend | M | API route: POST /api/habits/[id]/log — insert or upsert habit_log for today (idempotent); trigger streak recalculation after insert | deps: TASK-008, TASK-016, TASK-044
- [ ] TASK-039 | agent:backend | S | API route: GET /api/habits/today — return all active habits with today's completion status (join habit_logs on today's date) | deps: TASK-037
- [ ] TASK-040 | agent:frontend | L | Web: Dashboard (/dashboard) — habit list with today's completion status, one-click check-in with optimistic UI update, AI message card at top, reorder via drag-and-drop | deps: TASK-039, TASK-038, TASK-073
- [ ] TASK-041 | agent:frontend | M | Web: Habit Detail page (/habits/[id]) — streak count, 30-day completion calendar heatmap, AI messages referencing this habit | deps: TASK-037, TASK-049
- [ ] TASK-042 | agent:frontend | M | Web: Create/Edit Habit form (/habits/new, /habits/[id]/edit) — name (required), icon picker (emoji), reminder time picker, validation, max 10 habits guard | deps: TASK-033, TASK-034
- [ ] TASK-043 | agent:mobile | L | Mobile: Today tab — habit list with tap-to-complete, optimistic update, AI message card, pull-to-refresh | deps: TASK-039, TASK-038, TASK-073
- [ ] TASK-044 | agent:mobile | M | Mobile: Habit Detail screen — streak counter, calendar heatmap (react-native-calendars or equivalent), AI message history for habit | deps: TASK-037, TASK-049
- [ ] TASK-045 | agent:mobile | M | Mobile: Create/Edit Habit modal — full-screen form with emoji picker, time picker, validation | deps: TASK-033, TASK-034

---

## EPIC 5: Streak Calculation

- [ ] TASK-046 | agent:backend | L | Streak calculation service: pure function that takes habit_id + logs, computes current_streak, longest_streak, grace_days_used_this_week, last_completed_date — applying compassion mode logic (1 grace day/week; grace day counter resets each Monday) | deps: TASK-008
- [ ] TASK-047 | agent:backend | M | Integrate streak recalculation into POST /api/habits/[id]/log — after inserting log, call streak service, upsert into streaks table | deps: TASK-038, TASK-046
- [ ] TASK-048 | agent:backend | S | API route: GET /api/habits/[id]/streak — return current streak record for a habit | deps: TASK-008, TASK-016
- [ ] TASK-049 | agent:backend | S | API route: GET /api/streaks — return all streak records for authenticated user's active habits | deps: TASK-008, TASK-016
- [ ] TASK-050 | agent:backend | M | Scheduled job (Supabase Edge Function or cron): run nightly streak audit — for any habit not logged and not grace-day eligible, reset current_streak to 0 and record last_streak_reset | deps: TASK-046
- [ ] TASK-051 | agent:backend | S | Streak milestone detection: after streak upsert, check if current_streak is exactly 3, 7, 14, or 30 — if so, enqueue AI message generation with type "streak_3", "streak_7", "streak_14", "streak_30" | deps: TASK-047, TASK-061
- [ ] TASK-052 | agent:frontend | S | Web: Display streak badge on each habit row in dashboard (current streak count + fire icon) | deps: TASK-049, TASK-040
- [ ] TASK-053 | agent:mobile | S | Mobile: Streak badge on habit rows in Today tab; milestone celebration modal at Day 3 / Day 7 (animated, dismiss on tap) | deps: TASK-049, TASK-043

---

## EPIC 6: AI Coaching Messages

- [ ] TASK-054 | agent:backend | M | AI message prompt builder: construct Claude Haiku prompt from user context (display_name, habit names, current streaks, message_type) — output deterministic prompt string for given inputs | deps: TASK-008
- [ ] TASK-055 | agent:backend | L | API route: POST /api/ai/message — check ai_messages for (user_id, today's date) cache; if exists return cached; else call Claude API (claude-haiku-4-5-20251001), store result in ai_messages with token counts, return message | deps: TASK-054, TASK-007
- [ ] TASK-056 | agent:backend | M | Day 1 welcome message trigger: called at end of onboarding (after habits created); message_type="day1_welcome"; references display_name and each habit name by name; stored in ai_messages | deps: TASK-055
- [ ] TASK-057 | agent:backend | M | Streak milestone AI message trigger: called by TASK-051 when streak hits 3, 7, 14, or 30; message_type="streak_3"|"streak_7"|"streak_14"|"streak_30"; references specific habit name; stored in ai_messages (if already have daily message for today, allow second record for milestone type) | deps: TASK-055, TASK-051
- [ ] TASK-058 | agent:backend | S | API route: GET /api/ai/messages — return paginated ai_messages for authenticated user, ordered by created_at DESC | deps: TASK-008, TASK-016
- [ ] TASK-059 | agent:backend | S | API route: GET /api/ai/messages/today — return today's ai_message(s) for authenticated user | deps: TASK-058
- [ ] TASK-060 | agent:frontend | M | Web: AI Coach page (/coach) — paginated list of all AI messages, each card shows date, message_type badge, full message content | deps: TASK-058
- [ ] TASK-061 | agent:frontend | S | Web: AI message card component — used on Dashboard and Coach page; shows message with subtle type indicator (welcome, daily, milestone) | deps: TASK-059
- [ ] TASK-062 | agent:mobile | M | Mobile: AI Coach tab — scrollable list of all AI messages, date headers, message_type badge | deps: TASK-058
- [ ] TASK-063 | agent:mobile | S | Mobile: AI message card on Today tab — prominent card at top of screen, tappable to expand full text | deps: TASK-059

---

## EPIC 7: Accountability Groups

- [ ] TASK-064 | agent:backend | M | Invite code generator utility: cryptographically random 6-character alphanumeric code, collision-checked against groups table | deps: TASK-008
- [ ] TASK-065 | agent:backend | M | API route: POST /api/groups — create group (name required), generate invite_code, insert into groups and group_members (creator as first member), return group with invite_code | deps: TASK-064, TASK-008, TASK-016
- [ ] TASK-066 | agent:backend | M | API route: POST /api/groups/join — accept invite_code, look up group (404 if not found), insert group_members (idempotent — ignore duplicate), return group | deps: TASK-008, TASK-016
- [ ] TASK-067 | agent:backend | S | API route: GET /api/groups — return all groups for authenticated user (via group_members join) | deps: TASK-008, TASK-016
- [ ] TASK-068 | agent:backend | M | API route: GET /api/groups/[id] — return group details + all members with their display_name, avatar_url, and streak data for each active habit; RLS: only group members can access | deps: TASK-008, TASK-016, TASK-049
- [ ] TASK-069 | agent:backend | S | API route: DELETE /api/groups/[id]/leave — remove authenticated user from group_members; update member_count | deps: TASK-008, TASK-016
- [ ] TASK-070 | agent:frontend | M | Web: Groups List page (/groups) — list of user's groups with member count, invite code visible, link to group detail | deps: TASK-067
- [ ] TASK-071 | agent:frontend | M | Web: Group Detail page (/groups/[id]) — member leaderboard (sorted by total streak), each member's habits and streak counts, copyable invite code, Leave Group button with confirmation | deps: TASK-068, TASK-069
- [ ] TASK-072 | agent:frontend | S | Web: Create Group page (/groups/new) — name input, submit calls POST /api/groups, redirect to group detail | deps: TASK-065
- [ ] TASK-073 | agent:frontend | S | Web: Join Group page (/groups/join) — invite code input, submit calls POST /api/groups/join, redirect to group detail | deps: TASK-066
- [ ] TASK-074 | agent:mobile | M | Mobile: Groups tab — list of user's groups; "Create Group" and "Join Group" buttons | deps: TASK-067
- [ ] TASK-075 | agent:mobile | M | Mobile: Group Detail screen — member leaderboard list, habit streak rows per member, copyable invite code via Share sheet, Leave Group | deps: TASK-068, TASK-069
- [ ] TASK-076 | agent:mobile | S | Mobile: Create Group screen — name input form, navigate to Group Detail on success | deps: TASK-065
- [ ] TASK-077 | agent:mobile | S | Mobile: Join Group screen — invite code input, navigate to Group Detail on success | deps: TASK-066

---

## EPIC 8: Analytics Dashboard

- [ ] TASK-078 | agent:backend | M | Analytics query service: compute per-habit completion_rate, days_completed, days_possible, streak_at_end for a given date range from habit_logs — no snapshot dependency, computed on demand for MVP | deps: TASK-008, TASK-016
- [ ] TASK-079 | agent:backend | S | API route: GET /api/analytics/weekly — return weekly analytics (last 7 days) per habit for authenticated user | deps: TASK-078
- [ ] TASK-080 | agent:backend | S | API route: GET /api/analytics/monthly — return monthly analytics (last 30 days) per habit for authenticated user | deps: TASK-078
- [ ] TASK-081 | agent:backend | M | Scheduled job: nightly analytics_snapshots generation — compute and upsert weekly + monthly snapshots for all active users (for historical trend data) | deps: TASK-008, TASK-078
- [ ] TASK-082 | agent:frontend | L | Web: Analytics — Weekly page (/analytics/weekly) — bar chart of completion rate per habit (last 7 days), summary stats (best habit, overall rate), powered by Recharts | deps: TASK-079
- [ ] TASK-083 | agent:frontend | L | Web: Analytics — Monthly page (/analytics/monthly) — calendar heatmap per habit, line chart showing streak over time, monthly completion rates, powered by Recharts | deps: TASK-080
- [ ] TASK-084 | agent:mobile | L | Mobile: Analytics tab — two sub-tabs (Weekly / Monthly); weekly bar chart, monthly calendar heatmap using react-native-chart-kit or Victory Native | deps: TASK-079, TASK-080

---

## EPIC 9: Push Notifications

- [ ] TASK-085 | agent:backend | S | API route: POST /api/notifications/register — accept Expo push token + platform, upsert into notification_tokens table; RLS enforced | deps: TASK-008, TASK-016
- [ ] TASK-086 | agent:backend | S | API route: PATCH /api/users/notifications — toggle notification_enabled on users table | deps: TASK-026
- [ ] TASK-087 | agent:backend | M | Scheduled job: daily reminder push sender — query users with notification_enabled=true, for each user find habits whose reminder_time is within the next 5-minute window and have not been completed today, send via Expo Push API | deps: TASK-085, TASK-039
- [ ] TASK-088 | agent:backend | M | Streak milestone push notification: triggered by TASK-051 — send congratulatory push to user's active tokens when streak hits 3, 7, 14, or 30; mark token is_active=false on delivery failure | deps: TASK-085, TASK-051
- [ ] TASK-089 | agent:mobile | M | Mobile: Request push notification permission on first launch (after auth); register Expo push token; call POST /api/notifications/register | deps: TASK-085
- [ ] TASK-090 | agent:mobile | S | Mobile: Notification preferences screen (Settings tab) — toggle notifications on/off, display reminder time; call PATCH /api/users/notifications | deps: TASK-086
- [ ] TASK-091 | agent:frontend | S | Web: Notification preferences in Settings (/settings) — toggle global notifications on/off, reminder time picker | deps: TASK-086

---

## EPIC 10: Settings & Profile

- [ ] TASK-092 | agent:backend | S | API route: POST /api/users/avatar — accept image upload, store in Supabase Storage, update avatar_url on users table | deps: TASK-008, TASK-016
- [ ] TASK-093 | agent:frontend | M | Web: Settings page (/settings) — edit display_name, upload avatar, set global reminder_time, toggle notifications, Log Out button, account deletion placeholder | deps: TASK-026, TASK-092, TASK-091
- [ ] TASK-094 | agent:mobile | M | Mobile: Settings tab — display_name edit, avatar upload (image picker), reminder_time picker, notification toggle, Log Out | deps: TASK-026, TASK-092, TASK-090

---

## EPIC 11: Web Frontend Polish

- [ ] TASK-095 | agent:frontend | M | Web: Landing / Marketing page (/) — hero section, feature highlights (AI coaching, groups, streaks), CTA to sign up; SEO meta tags; responsive | deps: TASK-020
- [ ] TASK-096 | agent:frontend | S | Web: 404 page — branded, link back to /dashboard | deps: TASK-003
- [ ] TASK-097 | agent:frontend | S | Web: Global navigation — authenticated sidebar/topnav with links to Dashboard, Coach, Groups, Analytics, Settings; highlights active route | deps: TASK-022
- [ ] TASK-098 | agent:frontend | S | Web: Loading skeleton components for Dashboard, Analytics, Groups pages — prevent layout shift during data fetch | deps: TASK-040
- [ ] TASK-099 | agent:frontend | S | Web: Toast notification system (shadcn/ui Toaster) — success/error feedback for habit log, habit create/edit, group join/create | deps: TASK-040
- [ ] TASK-100 | agent:frontend | S | Web: Responsive layout audit — verify all pages render correctly at mobile (375px), tablet (768px), and desktop (1280px) breakpoints | deps: TASK-095, TASK-040, TASK-082, TASK-071

---

## EPIC 12: Mobile App Polish

- [ ] TASK-101 | agent:mobile | S | Mobile: Tab bar navigator — 5 tabs: Today (Home), Coach, Groups, Analytics, Settings; icons via @expo/vector-icons | deps: TASK-043
- [ ] TASK-102 | agent:mobile | S | Mobile: Global loading state and error boundary components | deps: TASK-043
- [ ] TASK-103 | agent:mobile | S | Mobile: Haptic feedback on habit completion tap (Expo Haptics) | deps: TASK-043
- [ ] TASK-104 | agent:mobile | S | Mobile: App icon and splash screen assets (1024x1024 icon, 2048x2732 splash) | deps: TASK-004
- [ ] TASK-105 | agent:mobile | M | Mobile: Expo EAS Build configuration — development, preview, and production build profiles for iOS and Android | deps: TASK-004

---

## EPIC 13: Testing

- [ ] TASK-106 | agent:backend | M | Unit tests (Vitest): streak calculation service — cover consecutive completion, grace day use, grace day exhaustion, Monday reset, longest streak tracking | deps: TASK-046
- [ ] TASK-107 | agent:backend | M | Unit tests (Vitest): AI prompt builder — verify output contains display_name, habit names, correct message_type context | deps: TASK-054
- [ ] TASK-108 | agent:backend | M | Integration tests (Vitest + Supabase local): auth signup/login, habit CRUD, habit log idempotency, group create/join/leave | deps: TASK-017, TASK-033, TASK-038, TASK-065
- [ ] TASK-109 | agent:frontend | M | E2E tests (Playwright): critical paths — sign up → onboarding → dashboard habit check-in → streak display → group join flow | deps: TASK-040, TASK-028, TASK-071
- [ ] TASK-110 | agent:mobile | M | Mobile E2E tests (Detox): sign up → onboarding → today tab habit tap → AI message visible | deps: TASK-043, TASK-031

---

## EPIC 14: Production Deploy

- [ ] TASK-111 | agent:devops | S | Configure production Supabase environment (separate from dev): apply all migrations, seed invite code for test group | deps: TASK-008, TASK-009, TASK-010
- [ ] TASK-112 | agent:devops | S | Configure Vercel production deployment: set all env vars (SUPABASE_URL, SUPABASE_ANON_KEY, ANTHROPIC_API_KEY, SENTRY_DSN, POSTHOG_KEY), set domain | deps: TASK-012, TASK-015
- [ ] TASK-113 | agent:devops | M | Configure Supabase Edge Functions for scheduled jobs: deploy nightly streak audit (TASK-050), daily push notification sender (TASK-087), nightly analytics snapshot (TASK-081) with pg_cron or Supabase Scheduled Functions | deps: TASK-050, TASK-081, TASK-087
- [ ] TASK-114 | agent:devops | S | Smoke test production: verify auth, habit creation, streak update, AI message generation, group join, push token registration all return 200 in production | deps: TASK-112, TASK-113
- [ ] TASK-115 | agent:devops | S | Write DEPLOY_URLS.md with production web URL, Supabase project URL, Expo project URL, Sentry project links | deps: TASK-114
- [ ] TASK-116 | agent:mobile | M | Expo EAS Submit: build and submit iOS app to TestFlight; build and submit Android APK/AAB to Google Play internal track | deps: TASK-105, TASK-114

---

## SPRINT 2 (Post-launch)

- [ ] TASK-117 | agent:backend | M | Group admin controls: API routes for removing members, editing group name/description; role field in group_members | deps: TASK-065
- [ ] TASK-118 | agent:backend | L | Direct messaging within groups: messages table, real-time subscription via Supabase Realtime | deps: TASK-065
- [ ] TASK-119 | agent:backend | M | Habit templates library: seed table of pre-built habits by category; API to list and clone templates | deps: TASK-033
- [ ] TASK-120 | agent:backend | M | Habit pause feature: pause_until date on habits table; streak logic treats paused habits as neutral (no reset, no streak) | deps: TASK-046
- [ ] TASK-121 | agent:backend | L | Advanced AI coaching: weekly review prompt (summarizes week, identifies patterns); habit audit prompt (suggests dropping/modifying habits based on low completion rate) | deps: TASK-054
- [ ] TASK-122 | agent:backend | M | Public profile and shareable streak badges: public slug on users table; public endpoint returning streak data; OG image generation | deps: TASK-049
- [ ] TASK-123 | agent:backend | M | Multiple reminder times per habit: reminder_times array column; update push notification scheduler to handle multiple times | deps: TASK-087
- [ ] TASK-124 | agent:backend | M | Analytics export: API endpoint returning CSV of habit_logs for a user; trigger PDF report generation via Puppeteer or similar | deps: TASK-079
- [ ] TASK-125 | agent:backend | M | Opt-in global streak leaderboard across all groups: materialized view updated nightly; opt-in flag on users table | deps: TASK-049
- [ ] TASK-126 | agent:frontend | M | Web push notifications: register service worker; Web Push API integration; add "web" platform to notification_tokens | deps: TASK-085
- [ ] TASK-127 | agent:frontend | L | Web: Group admin UI — member management, group settings page, remove member confirmation | deps: TASK-117
- [ ] TASK-128 | agent:frontend | L | Web: Group direct messaging UI — real-time message thread within group detail; Supabase Realtime subscription | deps: TASK-118
- [ ] TASK-129 | agent:frontend | M | Web: Habit templates page — browse categories, one-click add template as new habit | deps: TASK-119
- [ ] TASK-130 | agent:frontend | M | Web: Public profile page (/u/[slug]) — shareable streak badges, OG meta for social sharing | deps: TASK-122
- [ ] TASK-131 | agent:mobile | M | Mobile: Apple Health / Google Fit integration — read step count / workout data via Expo Health; auto-log compatible habits | deps: TASK-038
- [ ] TASK-132 | agent:mobile | M | Mobile: Habit stacking — link habits in a sequence; UI shows habit chain; completing one nudges next | deps: TASK-034
- [ ] TASK-133 | agent:mobile | L | Mobile: Group direct messaging — real-time chat screen in Group Detail; push notification on new message | deps: TASK-118
- [ ] TASK-134 | agent:devops | M | AI-suggested habits: onboarding step asking user goals; Claude API generates 3 suggested habits based on answers; user can accept/modify | deps: TASK-054
- [ ] TASK-135 | agent:devops | S | Automated weekly metrics report: PostHog dashboard snapshot emailed to operator each Monday (D1/D7/D30 retention, DAU, habit completion rate) | deps: TASK-014

---

## Dependency Map (Critical Path — Sprint 1)

```
TASK-001 (repo)
  → TASK-002 (config) → TASK-011 (CI)
  → TASK-003 (web)    → TASK-012 (Vercel)
  → TASK-004 (mobile) → TASK-105 (EAS)
  → TASK-007 (Supabase auth)
      → TASK-008 (schema)
          → TASK-009 (RLS)
          → TASK-010 (triggers)
          → TASK-016 (auth helpers)
              → TASK-017 (signup API)
                  → TASK-020 (web signup)
                  → TASK-023 (mobile signup)
              → TASK-033 (habits API)
                  → TASK-038 (log API)
                      → TASK-046 (streak calc)
                          → TASK-047 (streak on log)
                              → TASK-051 (milestone detection)
                                  → TASK-057 (milestone AI msg)
                                  → TASK-088 (milestone push)
              → TASK-054 (AI prompt builder)
                  → TASK-055 (AI message API)
                      → TASK-056 (day1 welcome)
                      → TASK-059 (today's message)
                          → TASK-040 (web dashboard)
                          → TASK-043 (mobile today)
              → TASK-065 (create group)
              → TASK-066 (join group)
```

---

_Total Sprint 1 tasks: 116 | Sprint 2 tasks: 19 | Grand total: 135_
_Agents: devops (22) | backend (43) | frontend (31) | mobile (28) | shared (11)_
