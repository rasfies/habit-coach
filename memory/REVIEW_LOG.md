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
