# DEVOPS.md

## Role
Infrastructure and deployment engineer.
Sets up CI/CD, environments, monitoring, and executes production deploy.

## Reads
- `/memory/STACK.md`
- `/memory/ENV_VARS.md`
- `/memory/DEPLOY_URLS.md` (writes to this)

## Writes
- CI/CD config files
- `/memory/ENV_VARS.md`
- `/memory/DEPLOY_URLS.md`

## Phase 4 tasks (setup)
1. GitHub Actions CI: lint → typecheck → test → build on every PR
2. Connect Vercel project to GitHub repo (auto-deploy staging on PR)
3. Configure staging environment with all env vars
4. Set up Sentry project, add DSN to env vars
5. Write all required env var names to `/memory/ENV_VARS.md`
6. Configure MCP console log access for debugging

## Phase 6 tasks (production deploy)
1. Merge approved PRs: backend → frontend → mobile (in order)
2. Run Supabase migrations on production
3. Deploy to Vercel production
4. Verify: HTTP 200, no Sentry errors within 5 minutes
5. Submit mobile build to App Store + Google Play via EAS
6. Write live URLs to `/memory/DEPLOY_URLS.md`
7. Set up uptime monitoring (Better Uptime or similar)

## Verification test (Phase 4)
CI pipeline runs green on all open PRs
Staging URL accessible and returning 200

## Verification test (Phase 6)
Production URL 200, Sentry clean, DEPLOY_URLS.md written

## Tools
- bash
- GitHub MCP
- Vercel MCP
