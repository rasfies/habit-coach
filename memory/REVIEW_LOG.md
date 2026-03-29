# REVIEW_LOG.md — Architecture Review

## Reviewer: ARCHITECT (self-review pass)
## Date: 2026-03-28
## Scope: STACK.md + monorepo scaffold + SQL migration

---

### Findings

| # | Severity | Area | Finding | Recommendation |
|---|---|---|---|---|
| 1 | HIGH | Security | `ANTHROPIC_API_KEY` is server-side only, but the current Next.js scaffold has no explicit server-only guard. A developer adding `"use client"` to a file that imports `lib/claude.ts` would silently bundle the key into the browser. | Add `import "server-only"` at the top of `apps/web/lib/claude.ts`. This causes a build-time error if the module is imported in a Client Component. Implement in TASK-016 / TASK-055. |
| 2 | HIGH | Security | The `users` RLS policy "group members can read display info" references `public.group_members` in a subquery before that table is created in the migration. If migrations run in order this is fine, but the policy is defined in the `users` block before `group_members` is created. | Reorder: create all tables first (no policies), then add all RLS policies in a second pass at the end of the migration file. This is the safer migration pattern. |
| 3 | HIGH | Security | `SUPABASE_SERVICE_ROLE_KEY` bypasses all RLS. Any Next.js API route that uses the service client instead of the user's session client would expose all user data without restriction. | Establish a convention: Next.js API routes always use `createServerClient` with the user's cookie-based session (anon key). Service key is used **only** in Edge Functions and server-side scripts that legitimately need to bypass RLS (e.g., nightly streak audit). Document this in a `SECURITY.md` in TASK-015. |
| 4 | MEDIUM | Data Integrity | The `ai_messages` UNIQUE constraint is `(user_id, message_date, message_type)`. This correctly allows one `daily` + one `streak_3` on the same day. However, the PRD says "one AI message per user per day" for the daily type — but the API could technically insert multiple `streak_3` messages if a user hits streak 3 on two different habits on the same day. | The unique constraint prevents this correctly for the same message_type on the same date. However, the prompt builder (TASK-054) and milestone trigger (TASK-057) must handle the case where a user achieves streak_3 on two habits simultaneously — combine them into a single message referencing both habits. Add this edge case to TASK-057 acceptance criteria. |
| 5 | MEDIUM | Schema | `streaks.grace_days_used_this_week` has `CHECK (grace_days_used_this_week <= 1)`. This correctly enforces max 1 grace day per week per habit. However, there is no DB-level enforcement that grace days reset on Monday — the nightly audit function must do this. If the audit job fails or is skipped, the grace day counter will not reset, causing incorrect streak behavior. | Add a `grace_day_reset_date` column to `streaks` that records when the counter was last reset. The streak calculation service checks this date against the current Monday. If the audit hasn't run, the service can self-heal by computing the reset from `grace_day_reset_date`. |
| 6 | MEDIUM | Missing Dependency | `apps/web/package.json` is missing `@supabase/ssr` as a direct listed dependency — it's used in `lib/supabase.ts` but not listed. `@supabase/supabase-js` is listed, but `@supabase/ssr` is a separate package required for Next.js cookie-based auth. | Add `"@supabase/ssr": "^0.5.2"` to `apps/web/package.json` dependencies. It is already noted in `lib/supabase.ts` but the package.json omits it. |
| 7 | MEDIUM | Missing Dependency | `apps/web/package.json` has no `globals.css` import mechanism for Tailwind's `@tailwind base; @tailwind components; @tailwind utilities` directives. The `app/layout.tsx` imports `./globals.css` but that file is not created in the scaffold. | Create `apps/web/app/globals.css` with the three Tailwind directives and shadcn/ui CSS variable declarations in TASK-003. Flag for the FRONTEND agent. |
| 8 | MEDIUM | Mobile | `apps/mobile/package.json` lists `react-native-chart-kit` but this library has known SVG rendering issues on Android with the current React Native New Architecture. The PRD requires analytics charts on mobile (TASK-084). | Evaluate Victory Native XL (maintained by Formidable) or Recharts with react-native-svg wrapper during TASK-084. Keep `react-native-chart-kit` as a fallback. Add a TASK note: "verify chart library renders correctly on RN New Architecture before committing." |
| 9 | MEDIUM | CI/CD | The `ci.yml` E2E job runs against `secrets.STAGING_URL` which won't exist until TASK-012 (Vercel deploy). If E2E is required on PRs before Vercel is configured, the job will fail with a missing secret and block all PRs. | Gate the E2E job with `if: github.base_ref == 'main' && secrets.STAGING_URL != ''` or use `continue-on-error: true` during the initial development phase. Update the condition once Vercel is provisioned. |
| 10 | MEDIUM | Architecture | The `@habit-coach/ui` package `src/index.ts` references component files (`./components/button`, etc.) that do not exist in the scaffold. TypeScript will fail to compile `@habit-coach/ui` until these are created. | Either create stub component files in TASK-006 before any workspace that imports `@habit-coach/ui` attempts to build, or change the `src/index.ts` barrel to export nothing until components exist. Recommend: add a `// TODO: TASK-006` comment and use empty exports for now. |
| 11 | LOW | Schema | `groups.member_count` is a denormalized counter maintained by a trigger. If the trigger fails (e.g., due to a permissions issue after a migration), `member_count` will drift from the actual count. | Add a reconciliation query in the seed file and in the nightly maintenance job to `UPDATE groups SET member_count = (SELECT COUNT(*) FROM group_members WHERE group_id = groups.id)`. |
| 12 | LOW | Schema | `habit_logs.completed` defaults to `TRUE`. The design says absence of a row = not completed. A row with `completed = FALSE` is semantically ambiguous. | Confirm with the PM whether `completed = FALSE` rows should ever be inserted (they currently should not be — grace day rows have `is_grace_day = TRUE` but still `completed = TRUE`). Add a `CHECK (completed = TRUE OR is_grace_day = TRUE)` constraint or document the invariant clearly. |
| 13 | LOW | Scalability | The group streak visibility RLS policy uses a correlated subquery with two JOINs on every query to `habits` and `streaks`. At large group sizes (100+ members), this subquery runs for every row in every SELECT. | This is acceptable for MVP (groups are small). For Phase 2, consider a materialized `user_group_ids` lookup or a Postgres policy function that caches membership per session. |
| 14 | LOW | Mobile | `apps/mobile/app.json` has `"projectId": "REPLACE_WITH_EAS_PROJECT_ID"`. This will cause `eas build` to fail until replaced. | Document as a required first-time setup step in README and in TASK-105. Consider an automated check in CI that fails if the placeholder string is still present. |
| 15 | LOW | Dev Experience | `supabase/config.toml` enables `pg_cron` via `CREATE EXTENSION IF NOT EXISTS "pg_cron"` in the migration, but pg_cron is not enabled by default on Supabase local dev. The extension must be enabled in `config.toml` under `[db.extensions]` or it silently fails. | Add to `supabase/config.toml`: `[db] extensions = ["pg_cron", "pgcrypto", "uuid-ossp"]`. Alternatively, use Supabase Scheduled Functions (the Supabase-hosted cron alternative) which doesn't require pg_cron. |
| 16 | LOW | Testing | `ci.yml` runs `npx turbo run test` but `apps/mobile/package.json` uses Jest (via `jest-expo`), not Vitest. Turbo will run the `test` script for all workspaces, which means `jest` runs for mobile and `vitest` for web — both are valid, but the CI job installs neither Jest nor Detox globally. | Add `jest-expo` and its dependencies to the mobile workspace devDependencies (already listed) and ensure the `test` script in `apps/mobile/package.json` uses `jest`. Detox E2E (`test:e2e`) should be a separate CI job requiring a macOS runner. |

---

### Summary

| Severity | Count |
|---|---|
| HIGH | 3 |
| MEDIUM | 7 |
| LOW | 6 |
| **Total** | **16** |

---

### Required Actions Before Phase 3 (Design)

These HIGH and MEDIUM items must be resolved before the FRONTEND and MOBILE agents begin building:

1. **[HIGH-1]** Add `import "server-only"` to `apps/web/lib/claude.ts`
2. **[HIGH-2]** Reorder SQL migration: define all tables, then all RLS policies
3. **[HIGH-3]** Document service key vs. session key usage convention
4. **[MEDIUM-6]** Add `@supabase/ssr` to `apps/web/package.json`
5. **[MEDIUM-7]** Create `apps/web/app/globals.css` stub
6. **[MEDIUM-10]** Fix `@habit-coach/ui` barrel exports to not reference non-existent files

LOW-severity items can be addressed during Phase 4 (Build) in the relevant task.

---

### Approved for Phase 3

**YES** — with conditions.

The scaffold is structurally sound. The SQL schema is complete and correct. All 9 tables are present with appropriate types, foreign keys, indexes, RLS policies, and triggers. The turbo pipeline, CI workflow, and package dependency graph are coherent.

The 3 HIGH findings are **not blockers for design** (Phase 3 does not build auth or API routes) but must be addressed before Phase 4 begins coding. The 6 MEDIUM findings are non-blocking for Phase 3 but are assigned to specific tasks.

**Condition:** BACKEND agent must apply HIGH-2 (RLS policy ordering) before executing TASK-008. FRONTEND agent must apply MEDIUM-6 and MEDIUM-7 before TASK-003 can complete. DEVOPS agent must apply MEDIUM-10 before TASK-006 is started.

---

## Phase 5 Code Review
## Reviewer: REVIEWER Agent (fresh context)
## Date: 2026-03-27

---

### Backend Review
`C:\AI_Factory_v2\habit-backend\apps\web\`

| # | Severity | File | Issue | Fix Required |
|---|----------|------|-------|-------------|
| B-1 | HIGH | `lib/supabase-server.ts` | `createServiceRoleClient()` passes cookies and uses `createSSRServerClient` — the service-role client should not need cookie management at all. While `autoRefreshToken: false` and `persistSession: false` are correctly set, using `createSSRServerClient` with service key still reads cookies unnecessarily and introduces coupling. The standard pattern for a service-role client is bare `createClient(url, serviceKey)` from `@supabase/supabase-js`. | Replace with `import { createClient } from "@supabase/supabase-js"` for the service-role variant. Low-exploitation risk since it works, but architecturally incorrect. |
| B-2 | MEDIUM | `app/api/groups/join/route.ts` (line 90) | `member_count` is incremented by reading the current value from the select result then adding 1: `member_count: group.member_count + 1`. This is a read-modify-write pattern vulnerable to race conditions. If two users join the same group simultaneously, both read `member_count = 5`, both write `6`, and the final count is `6` instead of `7`. A DB trigger already handles this (from the migration), but the API route also does it, meaning the trigger and route code will double-increment. | Remove the manual `member_count` update from the join route entirely — the `group_members_count` trigger in the migration already handles it correctly. Also verify the `POST /api/groups` create route which sets `member_count: 1` on insert, bypassing the trigger for the initial insert. |
| B-3 | MEDIUM | `app/api/coaching/generate/route.ts` | The rate-limit check counts `ai_messages` rows for today (line 61–66), but the idempotency check immediately above it (line 42–58) returns 409 if a message already exists for the same `message_type`. A user can generate a `daily` + a `streak_3` + a `streak_7` message in one day — three total inserts — and only hit the rate limit after the second message of any type. The check `count >= 2` fires too late when milestone messages co-exist with daily messages. This is consistent with the API contract ("max 2 manual triggers/user/day") but the intent may have been to count only manual `generate` calls, not total messages. Clarify and document. | Low risk for now. Add a comment clarifying the intent. If the intent is "max 2 API calls to /generate per day regardless of type", the current logic is correct. If it's "max 2 non-daily messages per day", the logic needs a filter on `message_type`. |
| B-4 | MEDIUM | `app/api/habits/[id]/log/route.ts` | `GET` (logs range) validates date format by parsing with `new Date(...)` but does not validate that `from` and `to` are valid YYYY-MM-DD strings before computing `diffMs`. An attacker sending `from=invalid&to=2026-03-27` causes `NaN` milliseconds, and `diffDays` = `NaN`. The `NaN > 31` check is `false`, so the query proceeds with an invalid `gte` filter on `log_date`. Supabase will return an error or empty result, which is safe but not explicitly handled. | Add Zod date-pattern validation on `from` and `to` query params before parsing. |
| B-5 | MEDIUM | `app/api/groups/[id]/route.ts` | The groups detail endpoint does NOT filter `habit_logs` fetched in the member habits join by date. It fetches ALL `habit_logs` for all members ever recorded (line 74–84). For a group member with years of habit history, this returns potentially thousands of rows per member, all just to check `completed_today`. This is a latency and cost issue, not a security issue. | Add `.filter("log_date", "eq", today)` on the `habit_logs` join in the select, or fetch `habit_logs` in a separate query filtered to today's date only. |
| B-6 | LOW | `app/api/groups/[id]/streaks/route.ts` | Same issue as B-5: fetches all `habit_logs` for all group members with no date filter (line 59–69). | Same fix: filter `habit_logs` to today's date only. |
| B-7 | LOW | `app/api/auth/signup/route.ts` (line 66) | On profile insert error, the code checks `!profileError.code?.includes("23505")` to detect unique constraint violations. The `code` field from Supabase is the PostgreSQL error code (e.g., `"23505"`), which is an exact string, not a substring match. This works correctly, but `includes` is unnecessary — use strict equality `=== "23505"`. | Minor: use `profileError.code !== "23505"`. |
| B-8 | LOW | Multiple route files | Several `console.error` calls log the raw Supabase/DB error object (e.g., `groups/route.ts` line 52, `habits/route.ts` line 47). These errors may include table names, column names, and internal Postgres error details. In production, these should route to Sentry rather than raw console output. | Wrap with `Sentry.captureException(error)` or use a structured logger. Raw console.error is acceptable for MVP but flag for pre-production hardening. |
| B-9 | LOW | `app/api/coaching/generate/route.ts` | The route fetches ALL `habit_logs` for a habit via the nested select on `habits` (line 91–99) with no date filter. This returns the complete history of habit logs. For users with months of history, this is unnecessarily large. | Add a date filter to the nested `habit_logs` select, limiting to the last 7 days. |

**Backend findings verified CORRECT (no issues):**
- `server-only` import present on `lib/claude.ts` — HIGH-1 from Phase 3 review was resolved.
- No hardcoded API keys or secrets in any source file. All secrets via `process.env`.
- Every `GET`, `POST`, `PATCH`, `DELETE` route checked: all call `supabase.auth.getUser()` and return 401 if `!user`, before any DB operation.
- No raw SQL strings anywhere — exclusively Supabase query builder (no SQL injection vectors).
- Zod validation applied on every POST/PATCH body (`SignUpSchema`, `LoginSchema`, `CreateHabitSchema`, `UpdateHabitSchema`, `ReorderHabitsSchema`, `LogHabitSchema`, `CreateGroupSchema`, `JoinGroupSchema`, `GenerateMessageSchema`, `RegisterTokenSchema`, `UpdateNotificationPrefsSchema`).
- `ai_messages` inserts use service-role client (`createServiceRoleClient()`), not the user session client.
- IDOR protection: habit ownership verified via `.eq("user_id", user.id)` before any habit-specific operation; group membership verified before exposing group data; reorder validates all IDs belong to the authenticated user.
- Rate limiting on generate endpoint: 2/day check implemented at lines 61–76 of `coaching/generate/route.ts`.
- `generateInviteCode()` uses `Math.random()` (not cryptographically random) — acceptable for 6-char invite codes, not security-sensitive. DB has a `gen_random_bytes`-based function available as alternative.

---

### Frontend Review
`C:\AI_Factory_v2\habit-frontend\apps\web\`

| # | Severity | File | Issue | Fix Required |
|---|----------|------|-------|-------------|
| F-1 | HIGH | `lib/claude.ts` | The frontend worktree contains a full copy of `lib/claude.ts` (identical to the backend's file, including `import "server-only"` and `ANTHROPIC_API_KEY`). Although `server-only` is present, this file should not exist in the frontend worktree at all — the frontend should not have Claude client code; it calls API routes. The file is NOT imported by any other frontend file (confirmed by search), so it does not leak into the bundle. However, its presence is a maintainability hazard: if someone removes the `server-only` guard or imports it in a client component, the API key would bundle. | Delete `apps/web/lib/claude.ts` from the frontend worktree. The frontend should call `/api/coach/message/generate` over HTTP, never instantiate the Claude client directly. |
| F-2 | MEDIUM | `middleware.ts` | The middleware protects routes via `pathname.startsWith("/dashboard")` etc. The route group in the App Router is `(app)/dashboard`, which Next.js renders at `/dashboard` — so the path check is correct for the URL. However, the middleware matcher excludes `/api/*` routes (`api/` in the negative lookahead). This means `/api/*` routes have NO middleware-level auth check. Auth is handled at the route handler level (all routes call `getUser()`), so this is not a vulnerability, but it is a defense-in-depth gap. | Document intentionally: add a comment to `middleware.ts` explaining that `/api/*` routes self-enforce auth via `supabase.auth.getUser()` in each handler, and that the middleware's exclusion is intentional to avoid double session overhead. |
| F-3 | MEDIUM | `app/(app)/dashboard/page.tsx` | The dashboard page uses hardcoded mock data (`MOCK_HABITS`, `MOCK_COACH`, `MOCK_STATS`) and hardcoded `userName = "Alex"`. All API fetch calls are commented out with `// TODO: replace with API call`. This means the dashboard does not function with real data. The frontend is scaffolded but not wired. | Wire real API calls for all dashboard data before merge. This is a feature completeness issue rather than a security issue, but blocks functional testing. |
| F-4 | MEDIUM | `app/(app)/settings/page.tsx` | Same issue: all settings data is hardcoded (`displayName = "Alex Chen"`, `avatarUrl = null`, etc.). The `handleSaveProfile` and `handleSaveNotifications` functions do call the correct API endpoints (`PATCH /api/users/me`, `PATCH /api/notifications/preferences`), but the `handleDeleteAccount` function only calls `supabase.auth.signOut()` — it does not call any actual delete API. User data is not deleted. | Implement a `DELETE /api/users/me` backend endpoint and call it in the delete flow before signing out. |
| F-5 | LOW | `app/(app)/layout.tsx` | The app layout directly queries `supabase.from("users")` with a TODO comment: "TODO: replace with API call — GET /api/users/me". This means the layout bypasses the API layer and queries Supabase directly from the server component. Not a security issue (it uses the user's session), but inconsistent with the API-first architecture. | Replace with `fetch("/api/users/me")` in a server component context, or keep as a server component Supabase call with a clear architectural comment. The current approach works correctly. |
| F-6 | LOW | `providers.tsx` | PostHog `capture_pageview: false` with manual pageview capture in `PostHogPageview`. The URL passed is `window.origin + pathname + searchParams`. Search params are captured as part of the URL. If any sensitive data is passed as query parameters (e.g., a token in an OAuth callback URL like `/auth/callback?code=...`), PostHog would capture it. The auth callback is at `/auth/callback` which is excluded from the middleware but not from PostHog capture. | Add a filter to exclude `/auth/callback` from PostHog pageview capture, or strip query params from the captured URL for auth-related paths. |

**Frontend findings verified CORRECT (no issues):**
- No API keys or secrets in any client component.
- No `dangerouslySetInnerHTML` usage anywhere in the codebase (confirmed by search).
- No `localStorage` usage anywhere (confirmed by search).
- No `console.log` statements in production code (confirmed by search — zero matches).
- Auth-protected routes redirect unauthenticated users: both middleware (`middleware.ts`) and layout (`app/(app)/layout.tsx`) implement the guard — double protection.
- PostHog does not capture password fields (no form capture configured; only explicit `posthog.capture()` calls with controlled event names and non-sensitive properties).
- Forms are standard HTML forms submitted via React `onSubmit` handlers; CSRF protection provided by Supabase JWT in cookies (httpOnly, SameSite).

---

### Mobile Review
`C:\AI_Factory_v2\habit-mobile\apps\mobile\`

| # | Severity | File | Issue | Fix Required |
|---|----------|------|-------|-------------|
| M-1 | HIGH | `app/_layout.tsx` | The root layout does NOT implement auth gating. There is no session check, no redirect to login for unauthenticated users, and no protection of the `(tabs)` routes. The comment "Auth check and session restoration will be implemented in TASK-025" confirms this is a known gap, but it means the mobile app's tab screens are accessible without authentication. | Implement TASK-025: add session check in `_layout.tsx` using `supabase.auth.getSession()` and redirect to `(auth)/login` if no session. |
| M-2 | MEDIUM | `app/(auth)/login.tsx` and all tab screens | All screens are placeholder stubs ("to be built in TASK-XXX"). The mobile app has zero functional implementation beyond the Supabase client setup and the layout shell. This is a completeness concern — the mobile branch delivers a scaffold, not a working app. | Complete the screen implementations per the task list before merge. |
| M-3 | LOW | `app.json` | `"projectId": "REPLACE_WITH_EAS_PROJECT_ID"` is still a placeholder. EAS Build will fail if this is not replaced before running `eas build`. | Replace with the actual EAS project ID before any build job. (Previously flagged as LOW-14 in Phase 3 review.) |

**Mobile findings verified CORRECT (no issues):**
- `lib/supabase.ts` correctly uses `expo-secure-store` via `ExpoSecureStoreAdapter` for session persistence — NOT AsyncStorage. The `storage` option is set correctly.
- `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are used (safe to expose).
- No `ANTHROPIC_API_KEY` or any other server-side secret in `EXPO_PUBLIC_*` variables. Confirmed by search — zero matches.
- No hardcoded URLs. API URL uses `EXPO_PUBLIC_API_URL` env var (set in CI workflow).
- Camera/photo permissions: not present in `app.json` — no camera permission declared. Avatar upload would need to be implemented via the web API route rather than on-device camera for MVP. Acceptable since mobile avatar upload is not in the MVP scope.
- `app.json` `plugins` array correctly includes `expo-secure-store` and `expo-notifications`.

---

### DevOps Review
`C:\AI_Factory_v2\habit-devops\`

| # | Severity | File | Issue | Fix Required |
|---|----------|------|-------|-------------|
| D-1 | MEDIUM | `.env.example` | The `ANTHROPIC_API_KEY` line reads `sk-ant-your-anthropic-api-key`. While this is clearly a placeholder, the `sk-ant-` prefix matches real Anthropic key format. Secret scanning tools (e.g., GitHub's default secret scanner) might flag this as a potential leak. | Change to a clearly non-key format: `ANTHROPIC_API_KEY=your-anthropic-api-key-here` (remove the `sk-ant-` prefix from the example value). |
| D-2 | MEDIUM | `supabase/functions/daily-coach/index.ts` | The Edge Function loops over all users sequentially (`for...of userIds`) calling the Anthropic API for each user. At 1,000 users this takes potentially 1,000 × ~1.5s = ~25 minutes, far exceeding Edge Function timeouts (10 minutes for Supabase). There is no batching, parallelism, or pagination. | Process users in parallel batches (e.g., `Promise.allSettled` with chunks of 10-20 users). Add a response header or log counting processed users so partial runs can be detected. Consider splitting into per-user invocations triggered by pg_cron. |
| D-3 | MEDIUM | `supabase/functions/daily-coach/index.ts` | The function queries `habits.archived` (line 170: `.eq("archived", false)`) but the schema migration uses `habits.is_active` (boolean). There is no `archived` column in the schema. The query will silently return all habits (Supabase PostgREST ignores unknown filter columns) or return an error, causing all users to be skipped. | Change `.eq("archived", false)` to `.eq("is_active", true)` to match the schema. Same fix applies to the inner habits query at line 192. |
| D-4 | MEDIUM | `supabase/functions/daily-coach/index.ts` | The function queries `users.full_name` (lines 185, 188) but the schema has `users.display_name`. The `full_name` field does not exist in the `users` table. The prompt builder would receive `user.full_name = null` for all users and fall back to "there" as the name. | Change `.select("id, email, full_name")` to `.select("id, email, display_name")` and update the `User` interface and prompt builder references accordingly. |
| D-5 | LOW | `.github/workflows/ci.yml` | The `test` job sets `ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY_TEST }}`. If the secret is not configured in the repository, this resolves to an empty string, which the `generateMessage` function in `ai-coach.ts` explicitly checks and throws `"ANTHROPIC_API_KEY is not set"`. Unit tests that test the generate path would fail in a fresh CI environment without this secret configured. The test file mocks `fetch` globally so the SDK's actual HTTP call is never made — the mock-based tests should not need a real key. | The tests mock `fetch` and set `process.env.ANTHROPIC_API_KEY = "test-key-sk-ant"` in `beforeEach`. This means a real key is not needed at test time. The CI job's `ANTHROPIC_API_KEY` can be an arbitrary non-empty placeholder string. Change to `ANTHROPIC_API_KEY: placeholder-no-real-key-needed`. |
| D-6 | LOW | `apps/web/src/lib/streak.ts` vs `apps/web/lib/streak.ts` (backend) | The DevOps worktree contains a different implementation of `calculateStreak` (at `apps/web/src/lib/streak.ts`) than the backend worktree (at `apps/web/lib/streak.ts`). The DevOps version takes `(logDates: string[], today: string, graceUsed: number, prevLongest: number)` while the backend version takes `(logs: HabitLog[], today: Date)`. The test suite tests the DevOps version's API. The Edge Function (`streak-audit`) would need to use one of these — they are not interchangeable. There is a risk of divergence between the tested implementation and the production implementation. | Resolve to a single canonical streak implementation shared across backend and Edge Functions. The DevOps tests cover a clean `string[]`-based API which is easier to test — consider adopting this signature in the backend as well. |

**DevOps findings verified CORRECT (no issues):**
- CI does NOT print secrets in logs. All secrets are referenced via `${{ secrets.XXX }}` and GitHub Actions masks secret values in logs automatically.
- `.env.example` has no real secret values — all are clearly labeled placeholders (with one caveat noted in D-1 above).
- `.gitignore` correctly covers `.env`, `.env.local`, `.env.*.local`, `.env.development.local`, `.env.test.local`, `.env.production.local`. Full coverage.
- Test files (`streak.test.ts`, `ai-coach.test.ts`) have substantive, real assertions — not empty describe blocks. The streak test suite has 19 test cases covering consecutive streaks, grace day logic, streak breaks, longest streak tracking, milestone detection, and lastLoggedDate tracking. The ai-coach test suite has 15 test cases covering prompt content, milestone detection, and mocked API call behavior.
- SQL migration (`001_initial_schema.sql`) correctly reorders table creation before RLS policy definitions — HIGH-2 from Phase 3 was resolved.
- `supabase/functions/daily-coach` correctly verifies authorization via the service role key in the `Authorization: Bearer` header.
- `turbo.json`, `vercel.json`, and `dependabot.yml` are present and correctly configured.
- Playwright E2E tests (`e2e/auth.spec.ts`, `e2e/habits.spec.ts`) have real assertions and proper test structure.

---

### Summary

- **Total issues: 18 (HIGH: 2, MEDIUM: 9, LOW: 7)**
- **Issues resolved from Phase 3 review:** HIGH-1 (`server-only` on claude.ts), HIGH-2 (RLS ordering in migration) — both verified resolved.

**Blocking issues (must fix before merge to develop):**

1. **B-1 (HIGH)** — `createServiceRoleClient` uses wrong Supabase client type; refactor to bare `createClient`.
2. **F-1 (HIGH)** — `lib/claude.ts` exists in frontend worktree with no legitimate purpose; delete it.
3. **M-1 (HIGH)** — Mobile `_layout.tsx` has no auth gate; unauthenticated users can access all tab screens.
4. **D-3 (MEDIUM)** — Edge Function queries `habits.archived` but schema column is `is_active`; function will fail silently for all users.
5. **D-4 (MEDIUM)** — Edge Function queries `users.full_name` but schema column is `display_name`; all coaching messages will be addressed to "there" instead of the user's name.
6. **B-2 (MEDIUM)** — `groups/join` route manually increments `member_count` while a DB trigger already does it; this causes double-increment on every join.
7. **F-3 (MEDIUM)** — Dashboard uses entirely mock/hardcoded data; real API integration is absent.

**Non-blocking (fix in follow-up PR):**

- **B-3** — Rate limit counting clarification (comment-level fix)
- **B-4** — Date param validation on logs range endpoint
- **B-5, B-6** — Unbounded `habit_logs` fetch in group endpoints (performance, not security)
- **B-7** — Use strict equality instead of `includes` for Postgres error code
- **B-8** — Route Sentry error capture before production
- **B-9** — Filter `habit_logs` to recent 7 days in coaching generate route
- **F-2** — Document intentional middleware exclusion of `/api/*`
- **F-4** — Account deletion does not actually delete server-side data
- **F-5** — Layout queries Supabase directly instead of going through API
- **F-6** — PostHog may capture OAuth callback query params (tokens)
- **M-2** — Mobile screens are placeholders (known, tracked in task list)
- **M-3** — EAS project ID placeholder not replaced
- **D-1** — `.env.example` Anthropic key format may trigger secret scanners
- **D-2** — Edge Function sequential processing will timeout at scale
- **D-5** — CI test job requests real `ANTHROPIC_API_KEY` when mock is sufficient
- **D-6** — Two divergent `calculateStreak` implementations; risk of logic drift

---

### Verdict

**CHANGES_REQUESTED**

**Conditions:**
1. Delete `lib/claude.ts` from `feat/frontend` worktree (F-1)
2. Fix `createServiceRoleClient` to use bare `createClient` not `createSSRServerClient` (B-1)
3. Implement auth gate in mobile `_layout.tsx` — TASK-025 (M-1)
4. Fix Edge Function column names: `is_active` not `archived`; `display_name` not `full_name` (D-3, D-4)
5. Remove manual `member_count` increment from `groups/join` route — let the trigger handle it (B-2)
6. Wire real API calls to dashboard page before merge — mock data is not acceptable in a merged branch (F-3)

Items 1–6 are the gate conditions. All other findings are non-blocking and may be addressed in follow-up PRs after merge to `develop`.
