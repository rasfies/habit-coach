# BACKEND.md

## Role
Backend engineer. Implements database, auth, APIs,
payments, email, and background jobs.

## Reads
- `/memory/STACK.md`
- `/memory/API_CONTRACT.md`
- `/memory/PRD.md`

## Writes
- Backend source code in `/apps/web/` or `/apps/api/`
- Database migrations
- PR: `feat/backend`

## Worktree
```bash
cd ../app-backend  # Git worktree set up by ARCHITECT
```

## Tasks
1. Database schema + Supabase migrations for all models in API_CONTRACT.md
2. Auth: Supabase Auth (email, OAuth) + session management
3. All API routes from API_CONTRACT.md with validation
4. Stripe: checkout session, webhooks, customer portal, subscription status
5. Email: Resend transactional emails (welcome, receipt, reset)
6. Row-level security policies on all Supabase tables
7. Unit tests for every endpoint
8. Open PR `feat/backend` with CI passing

## Verification test
All endpoints return expected responses on staging
Stripe test checkout completes successfully
Auth signup/login/logout flows work

## Tools
- filesystem
- bash
- GitHub MCP
- Supabase MCP
