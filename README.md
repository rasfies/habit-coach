# AI Habit Coach

An AI-powered habit coaching web and mobile app with social accountability groups.

## What it does

- **Daily habit tracking** with one-tap check-ins and streak counting
- **Compassion mode** — one grace day per week per habit so a missed day doesn't kill your streak
- **Adaptive AI coaching** — personalized daily messages from Claude that reference your specific habits and streak data
- **Accountability groups** — join groups and see each other's streaks in real time
- **Weekly and monthly analytics** — completion rates, trends, streak history

## Tech Stack

| Layer | Technology |
|---|---|
| Web | Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui |
| Mobile | React Native + Expo SDK 52 + Expo Router |
| Database | Supabase (Postgres + Auth + Storage + Edge Functions) |
| AI | Anthropic Claude (claude-haiku-4-5-20251001) |
| Monorepo | Turborepo |
| Analytics | PostHog |
| Errors | Sentry |
| Deploy (web) | Vercel |
| Deploy (mobile) | EAS (Expo Application Services) |
| CI/CD | GitHub Actions |
| Testing | Vitest + Playwright + Detox |

See `/memory/STACK.md` for full rationale.

## Monorepo Structure

```
apps/
  web/        Next.js 15 web app
  mobile/     Expo + React Native mobile app
packages/
  ui/         Shared React component library
  db/         Supabase client factory + TypeScript types
  config/     Shared ESLint + TypeScript configs
supabase/
  migrations/ Database schema SQL files
  seed.sql    Local development seed data
```

## Getting Started

### Prerequisites

- Node.js >= 20
- npm >= 10
- [Supabase CLI](https://supabase.com/docs/guides/cli) installed globally
- [Expo CLI](https://docs.expo.dev/get-started/installation/) for mobile development

### 1. Clone and install

```bash
git clone <repo-url>
cd TEST2_Habit
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
# Fill in values — see /memory/ENV_VARS.md for descriptions
```

### 3. Start Supabase locally

```bash
npm run supabase:start
# Applies migrations and seed data automatically
```

### 4. Run the web app

```bash
npm run dev --filter=@habit-coach/web
# Opens at http://localhost:3000
```

### 5. Run the mobile app

```bash
npm run dev --filter=@habit-coach/mobile
# Then press i (iOS simulator) or a (Android emulator)
```

## Development Workflow

### Branch strategy

| Branch | Purpose |
|---|---|
| `main` | Production — auto-deploys to Vercel + EAS production |
| `develop` | Staging — auto-deploys to Vercel preview |
| `feat/*` | Feature branches — PRs target `develop` |
| `fix/*` | Bug fixes — PRs target `develop` |

### Commit format (Conventional Commits)

```
feat: add compassion mode grace day UI
fix: streak not resetting on Monday
chore: update Expo SDK to 52.1
test: add streak calculation edge cases
```

### Running tests

```bash
npm run test              # All unit tests (Vitest)
npm run test:e2e          # Playwright E2E (web)
```

### Database type generation

After modifying the schema:

```bash
npm run supabase:gen-types
# Writes generated types to packages/db/src/database.generated.ts
```

## Environment Variables

All required environment variables are documented in `/memory/ENV_VARS.md`.
Template with placeholder values: `.env.example`

## Architecture

See `/memory/STACK.md` for the full architectural decision record.

## License

Private — all rights reserved.
