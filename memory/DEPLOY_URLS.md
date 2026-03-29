# DEPLOY_URLS.md — Deployment URLs
## Author: DEVOPS Agent
## Date: 2026-03-27
## Status: Not yet deployed (Phase 6)

---

## Planned URLs

| Environment | URL | Status |
|---|---|---|
| Web (production) | https://habitai.vercel.app | Pending Phase 6 |
| Web (staging / develop branch) | https://habitai-git-develop.vercel.app | Pending Phase 6 |
| Web (PR previews) | https://habitai-git-<branch>.vercel.app | Auto-created by Vercel |
| Supabase API | https://[project-id].supabase.co | Pending project creation |
| Supabase Studio | https://app.supabase.com/project/[project-id] | Pending project creation |
| Mobile (iOS) | App Store (pending review) | Phase 6+ |
| Mobile (Android) | Google Play (pending review) | Phase 6+ |
| Mobile (TestFlight preview) | EAS preview build | Phase 6+ |

---

## Vercel Project Settings

- **Framework**: Next.js
- **Root directory**: `/` (monorepo root)
- **Build command**: `turbo run build --filter=@habit-coach/web`
- **Output directory**: `apps/web/.next`
- **Install command**: `npm install`
- **Production branch**: `main`
- **Preview branches**: all other branches

---

## Supabase Project Settings

- **Region**: us-east-1 (iad1) — matches Vercel region for lowest latency
- **Postgres version**: 15
- **Edge Functions deployed**:
  - `daily-coach` — 23:00 UTC daily (generate coaching messages)
  - `streak-audit` — 00:05 UTC daily (recalculate streaks)

---

## EAS Build Profiles

| Profile | Purpose | Distribution |
|---|---|---|
| `development` | Dev client build (Expo Go replacement) | Internal |
| `preview` | Staging build for QA | TestFlight / internal APK |
| `production` | App Store / Play Store submission | Public |

---

*Update this file with live URLs after Phase 6 deployment completes.*
*Gate: Production 200 status + no Sentry errors + this file updated = Phase 6 DONE.*
