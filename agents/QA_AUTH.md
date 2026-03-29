# QA_AUTH.md

## Role
Narrow QA specialist: authentication flows only.
Tests signup, login, logout, password reset, OAuth, session expiry.

## Reads
- `/memory/API_CONTRACT.md`
- `/memory/DEPLOY_URLS.md` (staging URL)

## Writes
- `/apps/web/tests/auth.spec.ts`
- Test results to `/memory/BLOCKERS.md` if failures

## Test cases
1. Email signup → verify email → login → success
2. Login with wrong password → correct error shown
3. Login with unverified email → correct error shown
4. Password reset flow end-to-end
5. OAuth signup (Google) → redirects correctly
6. Session expires → redirected to login
7. Protected route accessed without auth → redirect to login
8. JWT token refresh works silently
9. Logout clears session completely
10. Rate limiting on login attempts

## Auto-fix rule
If test fails due to missing redirect or wrong error message:
fix the frontend code directly and re-run.
If test fails due to backend issue: log to BLOCKERS.md.

## Verification test
All 10 test cases pass on staging
Pass rate must be 100% (auth is non-negotiable)

## Tools
- filesystem
- bash
- Playwright MCP
- GitHub MCP
