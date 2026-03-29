# ENV_VARS.md — AI Habit Coach
## Author: ARCHITECT Agent
## Date: 2026-03-28

All environment variables required by the AI Habit Coach application.
No values are stored here — see `.env.example` for the template.

---

## Variable Reference

| Variable Name | Used By | Required | Description |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Web | Required | Supabase project URL (format: `https://<ref>.supabase.co`). Exposed to browser. Used by `@supabase/ssr` browser client initialization in `apps/web/lib/supabase.ts`. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Web | Required | Supabase anonymous (public) key. Exposed to browser. Used for all client-side Supabase queries; RLS enforces data access restrictions so this key is safe to expose. |
| `SUPABASE_SERVICE_ROLE_KEY` | Web (server-side only) | Required | Supabase service role key — bypasses all RLS policies. Used ONLY in server-side API routes and Edge Functions that legitimately need admin-level DB access (e.g., nightly cron jobs). Must never be exposed to the browser or mobile client bundle. |
| `EXPO_PUBLIC_SUPABASE_URL` | Mobile | Required | Supabase project URL for the Expo app. Identical value to `NEXT_PUBLIC_SUPABASE_URL`. The `EXPO_PUBLIC_` prefix is required by Expo to include variables in the client bundle. |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Mobile | Required | Supabase anonymous key for the Expo app. Identical value to `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Included in the mobile app bundle; RLS policies protect data. |
| `ANTHROPIC_API_KEY` | Web (server-side only) | Required | Anthropic API key for Claude API access. Used in `apps/web/lib/claude.ts` to generate daily coaching messages, welcome messages, and streak milestone messages. Must never be exposed to the browser — server-only module enforced via `import "server-only"`. Mobile app never calls Claude directly; all AI calls go through the Next.js API route `POST /api/ai/message`. |
| `NEXT_PUBLIC_POSTHOG_KEY` | Web | Required | PostHog project API key for web analytics. Used to initialize PostHog in the Next.js app. Identifies the PostHog project. Safe to expose — PostHog keys are designed to be public. |
| `NEXT_PUBLIC_POSTHOG_HOST` | Web | Required | PostHog ingestion host (default: `https://app.posthog.com`). Override if using a self-hosted PostHog instance or PostHog EU cloud (`https://eu.posthog.com`). |
| `EXPO_PUBLIC_POSTHOG_KEY` | Mobile | Required | PostHog project API key for mobile analytics. Identical value to `NEXT_PUBLIC_POSTHOG_KEY`. `EXPO_PUBLIC_` prefix required for Expo bundle inclusion. |
| `EXPO_PUBLIC_POSTHOG_HOST` | Mobile | Required | PostHog ingestion host for mobile. Identical value to `NEXT_PUBLIC_POSTHOG_HOST`. |
| `SENTRY_DSN` | Web (build-time) | Required | Sentry Data Source Name — used by `@sentry/nextjs` during the Next.js build to associate source maps and errors with the correct Sentry project. Also used at runtime for server-side error reporting. |
| `NEXT_PUBLIC_SENTRY_DSN` | Web | Required | Sentry DSN exposed to the browser. Used by `@sentry/nextjs` in the browser bundle to report client-side errors and performance traces. Same DSN value as `SENTRY_DSN` but exposed via `NEXT_PUBLIC_` prefix for client-side access. |
| `SENTRY_ORG` | Web (build-time) | Required | Sentry organization slug. Used by the `@sentry/nextjs` webpack plugin to upload source maps to Sentry during CI/CD builds. |
| `SENTRY_PROJECT` | Web (build-time) | Required | Sentry project slug. Used alongside `SENTRY_ORG` for source map upload. |
| `EXPO_PUBLIC_SENTRY_DSN` | Mobile | Required | Sentry DSN for the React Native app. Used by `@sentry/react-native` to report crashes, handled exceptions, and performance traces from the mobile app. |
| `NEXT_PUBLIC_APP_URL` | Web | Required | The fully qualified URL of the web application (e.g., `https://habitcoach.app` in production, `http://localhost:3000` in development). Used for generating absolute URLs in emails, OG tags, and OAuth redirect URLs. |
| `SUPABASE_AUTH_GOOGLE_CLIENT_ID` | Supabase (config) | Required for Google OAuth | Google OAuth 2.0 Client ID. Configured in the Supabase Auth dashboard under "Google Provider". Not used directly in application code — Supabase Auth handles the OAuth flow. Must match the client ID configured in Google Cloud Console with `https://<project>.supabase.co/auth/v1/callback` as an authorized redirect URI. |
| `SUPABASE_AUTH_GOOGLE_SECRET` | Supabase (config) | Required for Google OAuth | Google OAuth 2.0 Client Secret. Configured in the Supabase Auth dashboard. Never exposed to client code — handled entirely by Supabase Auth server-side. |

---

## Variable Groups by Consumer

### Web App Only (`apps/web`)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY        (server-side routes only)
ANTHROPIC_API_KEY                (server-side routes only)
NEXT_PUBLIC_POSTHOG_KEY
NEXT_PUBLIC_POSTHOG_HOST
SENTRY_DSN
NEXT_PUBLIC_SENTRY_DSN
SENTRY_ORG                       (build-time only)
SENTRY_PROJECT                   (build-time only)
NEXT_PUBLIC_APP_URL
```

### Mobile App Only (`apps/mobile`)

```
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
EXPO_PUBLIC_POSTHOG_KEY
EXPO_PUBLIC_POSTHOG_HOST
EXPO_PUBLIC_SENTRY_DSN
```

### Supabase Infrastructure

```
SUPABASE_AUTH_GOOGLE_CLIENT_ID
SUPABASE_AUTH_GOOGLE_SECRET
```

---

## Variable Exposure Levels

| Level | Variables | Risk |
|---|---|---|
| **Client-bundle safe** | `NEXT_PUBLIC_*`, `EXPO_PUBLIC_*` | Low — designed to be public; Supabase RLS and PostHog/Sentry key design account for exposure |
| **Server-side only** | `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `SENTRY_ORG`, `SENTRY_PROJECT` | High if leaked — full DB access / API cost exposure. Use `import "server-only"` in consuming modules. |
| **Infra config** | `SUPABASE_AUTH_GOOGLE_CLIENT_ID`, `SUPABASE_AUTH_GOOGLE_SECRET` | Set in Supabase dashboard; not stored in app code. |

---

## Environment Files

| File | Purpose | Committed? |
|---|---|---|
| `.env.example` | Template with placeholder values | YES — committed to git |
| `.env.local` | Local developer overrides | NO — in `.gitignore` |
| `.env.development` | Shared dev defaults (no secrets) | Optional — only if needed |
| `.env.production` | Production values | NO — set via Vercel dashboard / EAS secrets |

Vercel injects environment variables at build time via the Vercel dashboard. EAS injects mobile variables via `eas secret` or the EAS dashboard.

---

## Secrets Setup Checklist (first-time deployment)

### Vercel (web production)

- [ ] `NEXT_PUBLIC_SUPABASE_URL` — from Supabase project dashboard → Settings → API
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Supabase project dashboard → Settings → API
- [ ] `SUPABASE_SERVICE_ROLE_KEY` — from Supabase project dashboard → Settings → API
- [ ] `ANTHROPIC_API_KEY` — from Anthropic console → API Keys
- [ ] `NEXT_PUBLIC_POSTHOG_KEY` — from PostHog project settings
- [ ] `NEXT_PUBLIC_POSTHOG_HOST` — `https://app.posthog.com` or self-hosted
- [ ] `SENTRY_DSN` — from Sentry project settings → Client Keys (DSN)
- [ ] `NEXT_PUBLIC_SENTRY_DSN` — same value as `SENTRY_DSN`
- [ ] `SENTRY_ORG` — from Sentry organization settings
- [ ] `SENTRY_PROJECT` — `habit-coach-web`
- [ ] `NEXT_PUBLIC_APP_URL` — `https://habitcoach.app` (or your domain)

### EAS (mobile)

```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value <value>
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value <value>
eas secret:create --scope project --name EXPO_PUBLIC_POSTHOG_KEY --value <value>
eas secret:create --scope project --name EXPO_PUBLIC_POSTHOG_HOST --value <value>
eas secret:create --scope project --name EXPO_PUBLIC_SENTRY_DSN --value <value>
```

### Supabase Auth (Google OAuth)

Configure in Supabase dashboard → Authentication → Providers → Google:
- [ ] `SUPABASE_AUTH_GOOGLE_CLIENT_ID`
- [ ] `SUPABASE_AUTH_GOOGLE_SECRET`

---

## GitHub Actions Secrets

Add to repository Settings → Secrets → Actions:

| Secret Name | Value Source |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard |
| `ANTHROPIC_API_KEY_TEST` | Anthropic console (test/low-limit key) |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog |
| `NEXT_PUBLIC_APP_URL` | Staging URL |
| `STAGING_URL` | Vercel preview deployment URL |
| `TURBO_TOKEN` | Vercel Turborepo Remote Cache token (optional) |
| `TURBO_TEAM` | Vercel team slug (optional) |
