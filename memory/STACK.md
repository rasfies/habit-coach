# STACK.md — AI Habit Coach
## Author: ARCHITECT Agent
## Date: 2026-03-28
## Status: APPROVED for Phase 3

---

## 1. Final Tech Stack

### Web Application

| Technology | Version | Rationale |
|---|---|---|
| **Next.js** | 15.1.6 | App Router + React Server Components reduce client bundle size and simplify server-side data fetching. Turbopack in dev cuts hot-reload latency. Vercel-native — zero deploy config. |
| **React** | 19.0 | Required by Next.js 15. `useOptimistic` hook enables the habit check-in optimistic UI without an external state manager. |
| **TypeScript** | 5.7 | Full strict mode across all workspaces. `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess` catch the category of runtime bugs that habit log date handling is prone to. |
| **Tailwind CSS** | 3.4 | Utility-first eliminates naming friction and keeps the design consistent without a separate CSS architecture decision. Works well with shadcn/ui's class-based theming. |
| **shadcn/ui** | Latest | Copy-paste component library built on Radix UI primitives. Not a dependency — code lives in the repo, so no library lock-in. Accessibility (ARIA) comes free from Radix. |
| **Recharts** | 2.x | React-native charting for the analytics dashboards. Simpler API than Victory/D3 for the bar + line + heatmap chart types required. Actively maintained. |

### Mobile Application

| Technology | Version | Rationale |
|---|---|---|
| **Expo** | SDK 52 | Managed workflow eliminates native build complexity in Phase 4. EAS Build/Submit handles the iOS/Android delivery pipeline. New Architecture enabled by default in SDK 52. |
| **React Native** | 0.76.5 | Bundled with Expo SDK 52. New Architecture (Fabric + JSI) is stable in this version — enables the haptic feedback and animated milestone celebrations required in the PRD. |
| **Expo Router** | 4.x | File-system routing for React Native — mirrors Next.js conventions so the same mental model applies on both platforms. Deep link handling for group invite codes is built-in. |
| **NativeWind** | 4.x | Tailwind-style styling for React Native. Keeps styling syntax consistent between web and mobile teams. Compiles at build time, so no runtime overhead. |
| **Expo SecureStore** | 13.x | Secure session token persistence on device. Required for Supabase Auth on React Native (replaces localStorage). |
| **Expo Notifications** | 0.29.x | Expo-managed push notification registration. Generates Expo Push Tokens for both iOS (APNs) and Android (FCM), simplifying the multi-platform push sending logic. |

### Database & Backend

| Technology | Version | Rationale |
|---|---|---|
| **Supabase** | Latest | Postgres + Auth + Storage + Edge Functions + Realtime in a single managed platform. RLS at the database layer means authorization is enforced even if API logic has a bug — this is the key security primitive for this app. |
| **Supabase Auth** | — | Email/password + Google OAuth out of the box. JWT tokens auto-refresh. `@supabase/ssr` package handles cookie-based sessions for Next.js App Router correctly. |
| **Supabase Storage** | — | Avatar image uploads. Signed URLs for private content. Public bucket for avatars is appropriate since they are display photos. |
| **Supabase Edge Functions** | — | Deno-based serverless functions for scheduled jobs: nightly streak audit, daily push sender, nightly analytics snapshots. Runs in the same Supabase project — same DB connection, no cold-start latency concern for cron jobs. |
| **pg_cron** | — | Postgres-native cron scheduler. Used inside Supabase to trigger Edge Functions on schedule. Avoids needing an external cron service (Railway, etc.). |

### AI

| Technology | Model | Rationale |
|---|---|---|
| **Anthropic Claude API** | claude-haiku-4-5-20251001 | **Why Haiku, not Sonnet or Opus:** Daily coaching messages are 200–400 word personalized summaries — well within Haiku's quality bar. At ~25x lower cost than Opus and ~5x lower than Sonnet, Haiku is viable at scale without monetization. Latency target is <2s for the dashboard AI card — Haiku meets this consistently. Sonnet/Opus reserved for Phase 2 advanced coaching modes. |

### Observability

| Technology | Purpose | Rationale |
|---|---|---|
| **Sentry** | Error tracking | Source-map upload in CI. Environment tagging (dev/staging/prod). Both `@sentry/nextjs` and `@sentry/react-native` SDKs. Alerts on unhandled exceptions and API route errors. |
| **PostHog** | Product analytics | Self-hostable option available if needed later. Captures key retention events: sign_up, habit_created, habit_completed, streak_milestone, group_joined, ai_message_viewed. User identification on login for cohort analysis. |

### Infrastructure & Deployment

| Technology | Purpose | Rationale |
|---|---|---|
| **Vercel** | Web deployment | Next.js-native. Zero-config preview deployments on every PR branch. Edge Middleware for auth route protection runs at CDN layer. |
| **EAS (Expo Application Services)** | Mobile build + submit | OTA updates via `expo-updates` for minor changes without app store review. 3 build profiles: development (dev client), preview (internal TestFlight/APK), production. |
| **GitHub Actions** | CI/CD | Lint + typecheck + Vitest + Playwright on every PR. Turbo cache reduces repeat build time. |
| **Turborepo** | Monorepo task runner | Incremental builds — only rebuilds affected workspaces. Remote cache (TURBO_TOKEN) for CI speed. Parallel task execution (`dev` runs web + mobile simultaneously). |

---

## 2. Monorepo Structure

```
habit-coach/                     Root — Turborepo workspace
├── apps/
│   ├── web/                     Next.js 15 web application
│   │   ├── app/                 App Router: routes, layouts, pages
│   │   │   ├── (auth)/          Route group: login, signup (no auth required)
│   │   │   └── (app)/           Route group: protected app pages
│   │   ├── components/          Web-specific React components
│   │   ├── lib/                 Supabase client, Claude client, utilities
│   │   └── public/              Static assets
│   └── mobile/                  Expo + React Native application
│       ├── app/                 Expo Router: screens and layouts
│       │   ├── (auth)/          Auth screens (no tab bar)
│       │   └── (tabs)/          Tab navigator screens
│       ├── components/          Mobile-specific components
│       └── lib/                 Mobile Supabase client (SecureStore)
├── packages/
│   ├── ui/                      Shared React component library
│   │   └── src/                 Button, Card, Input, Avatar, Badge, Skeleton
│   ├── db/                      Supabase client factory + TypeScript types
│   │   └── src/
│   │       ├── index.ts         Database interface + barrel exports
│   │       └── types.ts         Manual type stubs (replaced by gen in TASK-005)
│   └── config/
│       ├── eslint/              Shared ESLint config (extends recommended + TS)
│       └── typescript/          base.json — strict TypeScript settings
├── supabase/
│   ├── migrations/              SQL migration files (numbered, sequential)
│   ├── seed.sql                 Local development seed data
│   └── config.toml              Supabase local dev configuration
└── .github/
    └── workflows/
        └── ci.yml               Lint + typecheck + test + build + E2E pipeline
```

---

## 3. Key Architectural Decisions

### 3.1 Why Supabase RLS (not application-layer authorization)

RLS policies are defined at the Postgres layer. This means:

1. Even if an API route has a bug and passes the wrong user_id, the query returns no rows — the DB enforces isolation.
2. Service-role calls (Edge Functions, server-side scripts) can bypass RLS intentionally using the service key — all other callers cannot.
3. The `group_members` cross-table join pattern in RLS enables group streak visibility without a separate authorization service.

Critical policies:
- `users`: read own row + read display info for group co-members
- `habits` / `streaks`: own rows only + read by group co-members (for leaderboard)
- `habit_logs` / `ai_messages` / `analytics_snapshots`: own rows only — strict private data
- `groups`: readable only if membership exists in `group_members`
- `group_members`: self-insert (join) + self-delete (leave) + same-group read

### 3.2 Why Edge Functions for scheduled jobs (not external cron)

Three nightly jobs are required: streak audit, analytics snapshot, push notification sender.

Options considered:

| Option | Problem |
|---|---|
| Vercel Cron | Works for web app routes, but push sender and streak audit need direct DB access |
| External cron (EasyCron, etc.) | Extra service, extra auth, extra latency, can fail silently |
| Supabase Edge Functions + pg_cron | Co-located with DB, same connection pool, zero network hop, observable in Supabase dashboard |

Supabase Edge Functions triggered by pg_cron is the right choice: the cron schedule is in the database, the function runs in Deno adjacent to Postgres, and failures surface in the Supabase logs.

### 3.3 Why claude-haiku not claude-sonnet/opus for AI coaching

The daily coaching messages are personalized summaries of 200–400 words. Quality requirements:
- Must reference user's specific habit names by name (easy for Haiku)
- Must vary meaningfully based on streak length (prompt-driven, not model-driven)
- Must not sound generic (achieved via prompt engineering in TASK-054)

Cost analysis at scale (10,000 DAU):
- Haiku: ~$0.25 input / $1.25 output per MTok → ~$15/month at 10k DAU
- Sonnet: ~$3 input / $15 output per MTok → ~$180/month at 10k DAU
- Opus: ~$15 input / $75 output per MTok → ~$900/month at 10k DAU

Since this app is free with no monetization, Haiku is the only viable choice at any meaningful scale. The prompt builder (TASK-054) does the heavy lifting to make Haiku output feel high-quality.

### 3.4 Why Turborepo (not Nx)

Both are valid. Turborepo was chosen because:
- Simpler configuration (turbo.json vs. nx.json + project.json per workspace)
- Native npm workspace support without a wrapper CLI
- Vercel-owned — good alignment with the deployment platform
- TURBO_TOKEN remote cache integrates directly with Vercel's build infrastructure

### 3.5 Streak grace day — database vs. application logic

The streak calculation service (TASK-046) is a **pure function** that runs in application code, not a stored procedure. Reasons:
- Easier to unit-test (TASK-106) — pure input/output, no DB dependency
- Easier to iterate on compassion-mode logic in Phase 2 (pause feature, etc.)
- The nightly audit Edge Function calls the same service logic, ensuring consistency

`grace_days_used_this_week` is reset to 0 every Monday via the nightly streak audit, not via a DB trigger, to avoid silent state mutation.

### 3.6 AI message caching strategy

The `UNIQUE (user_id, message_date, message_type)` constraint in `ai_messages` provides idempotency: a second call to `POST /api/ai/message` for the same user on the same day returns the cached row without calling Claude. This is implemented at the API route level (TASK-055) with an `ON CONFLICT DO NOTHING` + re-query pattern.

Milestone messages (streak_3, streak_7, etc.) use a different `message_type` so they can coexist with the daily message on the same date.

### 3.7 Why denormalized user_id on habit_logs and streaks

Both tables have `user_id` even though it's derivable via the parent `habit`. Reasons:
- RLS policies use `user_id` directly — avoids a join on every query
- The nightly streak audit scans all streaks by user — direct index on `user_id` is required for performance
- PostHog event capture needs `user_id` immediately, not via a join

The tradeoff (data redundancy) is acceptable given the predictable write pattern (habits are created once, rarely deleted).

---

## 4. Shared Packages

### `@habit-coach/ui`

Shared React components used by both `apps/web` and potentially a future web-only storybook.

**Not used by `apps/mobile` directly** — React Native requires different rendering primitives. Mobile-specific components live in `apps/mobile/components/`. If significant component logic sharing is needed in Phase 2, introduce `packages/ui/native/` with RN equivalents.

Current exports: Button, Card, Input, Avatar, Badge, Skeleton — all built on Radix UI primitives with shadcn/ui styling.

### `@habit-coach/db`

Two responsibilities:
1. **TypeScript types** — `Database` interface mirrors the Supabase schema. Until `supabase gen types` is run (TASK-005), manual type stubs in `types.ts` allow the web and mobile apps to type-check.
2. **Type exports** — re-exports `User`, `Habit`, `HabitLog`, etc. as named types consumed across all workspaces.

The client instantiation itself lives in `apps/web/lib/supabase.ts` and `apps/mobile/lib/supabase.ts` — not in `@habit-coach/db` — because the initialization options differ significantly between SSR (cookie-based) and React Native (SecureStore).

### `@habit-coach/config`

- `eslint/index.js` — shared config extending `@typescript-eslint/recommended` + prettier. All workspaces `extend` this.
- `typescript/base.json` — strict TypeScript settings. All workspace `tsconfig.json` files `extend` this.

Centralizing these eliminates configuration drift between the web and mobile workspaces.

---

## 5. Branch Strategy

```
main        Production branch — auto-deploys to Vercel production + EAS production
develop     Staging branch — auto-deploys to Vercel preview URL
feat/*      Feature branches — open PRs targeting develop
fix/*       Bug fix branches — open PRs targeting develop
```

Rules:
- Direct pushes to `main` are blocked; only merges via PR from `develop` (after Phase 5 approval)
- `develop` requires passing CI (lint + typecheck + unit tests)
- `main` additionally requires E2E tests to pass on staging URL
- Hotfixes go to `fix/hotfix-*` branched from `main`, then merged to both `main` and `develop`

---

## 6. Commit Format (Conventional Commits)

```
<type>(<scope>): <description>

[optional body]

[optional footer: BREAKING CHANGE or issue reference]
```

Types:

| Type | When to use |
|---|---|
| `feat` | New feature (new route, new API endpoint, new component) |
| `fix` | Bug fix |
| `chore` | Build, config, dependency updates |
| `test` | Adding or modifying tests |
| `docs` | Documentation changes |
| `refactor` | Code changes that are neither a fix nor a feature |
| `perf` | Performance improvements |
| `ci` | CI/CD workflow changes |

Scope examples: `web`, `mobile`, `db`, `ui`, `api`, `streak`, `ai`, `groups`

Example commits:
```
feat(api): add POST /api/ai/message with caching
fix(streak): grace day not resetting on Monday correctly
chore(deps): upgrade Expo SDK to 52.0.18
test(streak): add grace day exhaustion edge case
```

---

## 7. Environment Variables

Full documentation with descriptions in `/memory/ENV_VARS.md`.

Names:

```
# Supabase (web)
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# Supabase (mobile)
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY

# Anthropic
ANTHROPIC_API_KEY

# PostHog (web)
NEXT_PUBLIC_POSTHOG_KEY
NEXT_PUBLIC_POSTHOG_HOST

# PostHog (mobile)
EXPO_PUBLIC_POSTHOG_KEY
EXPO_PUBLIC_POSTHOG_HOST

# Sentry
SENTRY_DSN
SENTRY_ORG
SENTRY_PROJECT
NEXT_PUBLIC_SENTRY_DSN
EXPO_PUBLIC_SENTRY_DSN

# App
NEXT_PUBLIC_APP_URL

# Google OAuth (Supabase-managed)
SUPABASE_AUTH_GOOGLE_CLIENT_ID
SUPABASE_AUTH_GOOGLE_SECRET
```

---

## 8. Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USERS                                    │
│                                                                 │
│    Browser (web)          iOS/Android (mobile)                  │
└────────────┬──────────────────────┬────────────────────────────┘
             │                      │
             ▼                      ▼
┌────────────────────┐   ┌──────────────────────────────────────┐
│   Vercel CDN       │   │   Expo EAS / App Store / Play Store  │
│   (Next.js 15)     │   │   (React Native 0.76 / Expo SDK 52)  │
│                    │   │                                       │
│  ┌──────────────┐  │   │  ┌───────────────────────────────┐   │
│  │ Edge Middleware│ │   │  │  SecureStore (JWT session)    │   │
│  │ (auth check)  │ │   │  └───────────────┬───────────────┘   │
│  └──────┬───────┘  │   │                  │                    │
│         │          │   └──────────────────┼────────────────────┘
│  ┌──────▼───────┐  │                      │
│  │ RSC + Route  │  │                      │
│  │ Handlers     │  │                      │
│  │ (API routes) │  │                      │
│  └──────┬───────┘  │                      │
└─────────┼──────────┘                      │
          │                                 │
          └─────────────┬───────────────────┘
                        │  HTTPS + JWT (anon key)
                        ▼
          ┌─────────────────────────────────┐
          │         SUPABASE                │
          │                                 │
          │  ┌──────────┐  ┌─────────────┐  │
          │  │ Auth     │  │  PostgREST  │  │
          │  │ (JWT)    │  │  (REST API) │  │
          │  └──────────┘  └──────┬──────┘  │
          │                       │          │
          │  ┌────────────────────▼───────┐  │
          │  │   Postgres 15 (RLS active) │  │
          │  │   9 tables, triggers,      │  │
          │  │   pg_cron schedules        │  │
          │  └────────────────────────────┘  │
          │                                 │
          │  ┌──────────────────────────┐   │
          │  │  Edge Functions (Deno)   │   │
          │  │  - nightly streak audit  │   │
          │  │  - daily push sender     │   │
          │  │  - analytics snapshots   │   │
          │  └─────────────┬────────────┘   │
          │                │                │
          │  ┌─────────────▼────────────┐   │
          │  │   Storage                │   │
          │  │   (avatar images)        │   │
          │  └──────────────────────────┘   │
          └─────────────────────────────────┘
                        │
                        │  HTTPS (server-side only)
                        ▼
          ┌─────────────────────────────────┐
          │      ANTHROPIC CLAUDE API       │
          │      claude-haiku-4-5-20251001  │
          │      (daily coaching messages)  │
          └─────────────────────────────────┘

          ┌─────────────────────────────────┐
          │      EXPO PUSH SERVICE          │
          │      → APNs (iOS)               │
          │      → FCM (Android)            │
          └─────────────────────────────────┘

          ┌─────────────────────────────────┐
          │ POSTHOG (analytics)             │
          │ SENTRY  (error tracking)        │
          └─────────────────────────────────┘
```

---

## 9. Scaling Notes

### Current architecture ceilings (before changes needed)

| Component | Ceiling | Why |
|---|---|---|
| Supabase Postgres | ~10k DAU / 100k habits | Supabase Pro tier connection pooler (PgBouncer) handles ~200 concurrent connections; upgrade to Business tier for more |
| Claude API (Haiku) | Rate limits apply | Default tier: 1000 req/min. At 10k DAU sending 1 message/day, peak load is ~700 req/min in a 15-minute morning window — below default limits. May need rate limit increase for >15k DAU. |
| Supabase Edge Functions | ~1M invocations/month on Pro | Nightly jobs at 10k users = well within limits |
| Vercel | No hard ceiling | Edge functions auto-scale |
| Expo Push | No hard ceiling | Expo handles APNs/FCM batching |

### When to act

- **>5k DAU**: Add `analytics_snapshots` read path to avoid live query on large `habit_logs` tables — TASK-081 handles this.
- **>10k DAU**: Evaluate Supabase connection pooler config; add read replica for analytics queries.
- **>50k DAU**: Consider migrating Claude message generation to a queue (e.g., Supabase Queue when available, or BullMQ on Railway) to smooth the morning spike.
- **>100k DAU**: Evaluate self-hosted Supabase on dedicated infrastructure; consider Claude Haiku batch API for cost reduction.

### Data growth

`habit_logs` grows at ~(active_users × avg_habits × 365) rows/year. At 10k DAU × 3 habits:
- Year 1: ~11M rows
- Year 3: ~33M rows

Postgres handles this well with the existing indexes. Partition `habit_logs` by `log_date` range in Year 2 if query patterns require it.

`ai_messages` grows at ~(active_users × 365) rows/year. At 10k DAU:
- Year 1: ~3.6M rows — trivial for Postgres.

---

*STACK.md v1.0 — written by ARCHITECT agent — approved for Phase 3*
