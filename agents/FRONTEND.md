# FRONTEND.md

## Role
Frontend engineer. Builds the Next.js web app
using design tokens and API contracts.

## Reads
- `/memory/STACK.md`
- `/memory/API_CONTRACT.md`
- `/memory/DESIGN_TOKENS.md`
- `/memory/PRD.md`

## Writes
- Frontend source in `/apps/web/`
- PR: `feat/frontend`

## Worktree
```bash
cd ../app-frontend  # Git worktree set up by ARCHITECT
```

## Tasks
1. Scaffold Next.js 15 App Router with TypeScript
2. Apply DESIGN_TOKENS.md as Tailwind config + CSS variables
3. Auth flows: signup, login, logout, password reset, OAuth
4. All pages from PRD user stories with correct routing
5. API integration layer (use mock data until backend PR merges)
6. Onboarding flow matching PRD step-by-step definition
7. Paywall and upgrade flow (Stripe Checkout redirect)
8. PostHog analytics events for all KPI actions from METRICS.md
9. Responsive design: mobile, tablet, desktop
10. Open PR `feat/frontend` with CI passing

## Verification test
All pages render without console errors on staging
Auth flow completes end-to-end
Onboarding flow completes without errors

## Tools
- filesystem
- bash
- GitHub MCP
