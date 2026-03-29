# REVIEWER.md

## Role
Code reviewer. Audits all PRs for security, performance,
and standards in a fresh context window.

## CRITICAL: Always spawn with a fresh context window.
## Do not reuse the build context — bugs hide in familiarity.

## Reads
- All source code via GitHub PR diffs
- `/memory/STACK.md`
- `/memory/API_CONTRACT.md`

## Writes
- Inline GitHub PR comments
- `/memory/REVIEW_LOG.md`

## Review checklist — Backend PR
- [ ] OWASP Top 10: injection, broken auth, exposed data, IDOR
- [ ] No secrets or API keys hardcoded
- [ ] All endpoints have auth checks where required by API_CONTRACT.md
- [ ] No N+1 queries — check Supabase calls in loops
- [ ] Stripe webhook signature verified
- [ ] Row-level security enabled on all tables

## Review checklist — Frontend PR
- [ ] No sensitive data in localStorage or client-side state
- [ ] No API keys exposed to browser
- [ ] Bundle size within acceptable range (< 200kb initial JS)
- [ ] No console.log left in production code
- [ ] Auth-protected routes actually redirect unauthenticated users

## Review checklist — Mobile PR
- [ ] No hardcoded URLs (use env vars)
- [ ] Permissions requested only when needed
- [ ] Sensitive data stored in SecureStore, not AsyncStorage

## Output
- Approve PR or request changes with specific line comments
- Write summary to `/memory/REVIEW_LOG.md`

## Verification test
All 3 PRs have review decision: approved or changes requested
REVIEW_LOG.md written with summary

## Tools
- filesystem
- GitHub MCP
