# BLOCKERS.md — Issues and Blockers Log

## Phase 5 QA

### Status: TESTS WRITTEN — PENDING LIVE RUN
Tests require a running Next.js dev server with real Supabase credentials.

---

### Pre-conditions for running E2E tests

1. `.env.local` filled with real Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
   ```

2. Supabase migrations applied:
   ```bash
   supabase db push
   ```

3. Supabase email confirmations **disabled** (required for signup tests to complete without checking email):
   - Supabase Dashboard → Authentication → Settings → Disable "Enable email confirmations"

4. Seed a test user account and export credentials:
   ```bash
   export TEST_USER_EMAIL=seed-user@habitai-test.example.com
   export TEST_USER_PASSWORD=TestPass123!
   ```
   For group join tests (TC-G-02), also set:
   ```bash
   export TEST_USER2_EMAIL=seed-user2@habitai-test.example.com
   export TEST_USER2_PASSWORD=TestPass123!
   ```

5. Dev server running:
   ```bash
   cd apps/web
   npm run dev
   ```

6. Run tests:
   ```bash
   npx playwright test
   # Run a specific suite:
   npx playwright test e2e/auth-comprehensive.spec.ts
   npx playwright test e2e/habits-comprehensive.spec.ts
   npx playwright test e2e/groups-comprehensive.spec.ts
   # With visible browser:
   npx playwright test --headed
   # With Playwright UI mode:
   npx playwright test --ui
   ```

---

### Known limitations (test environment)

| Limitation | Impact | Mitigation |
|---|---|---|
| Google OAuth requires real browser OAuth flow | TC-Google skipped entirely | Not tested in E2E; covered by Supabase SDK unit tests |
| Email confirmation | Signup tests fail if confirmations are on | Disable in Supabase Dashboard (see pre-condition 3) |
| Auth rate limit (10 req/min per IP) | Rapid test runs may hit 429 | Run tests sequentially in CI (`workers: 1`); add delays between auth-heavy suites |
| TC-H-03 (10-habit limit) needs 10 habits | Slow test (~2 min) | Uses `test.setTimeout(120_000)`; run with `--timeout=120000` if needed |
| TC-H-09 (reorder) requires drag-and-drop | Depends on UI implementation | Test falls back to up/down buttons; skips gracefully if neither found |
| TC-G-02 (join group) requires two accounts | Needs `TEST_USER2_*` env vars | Test skips cleanly if not configured |
| TC-H-10 (empty state) requires zero habits | Skips if test account has habits | Use a dedicated clean account or wipe habits before running |
| Session persistence tests (TC-26, TC-27) | Depend on cookies being set correctly | Ensure Supabase cookie-based auth is used (not localStorage-only) |

---

### Open Blockers

None at time of writing (2026-03-27). Tests are authored and ready for live execution.
Update this section when blockers are discovered during the live run.

---

### Blocker Template (for future use)

```
### BLOCKER-[N]: [Short title]
Date: YYYY-MM-DD
Phase: [phase number]
Severity: CRITICAL | HIGH | MEDIUM | LOW
Test(s) affected: [TC-XX, ...]
Description:
  [What went wrong]
Error output:
  [Paste exact error or stack trace]
Attempted fixes:
  1. [What was tried]
Root cause:
  [Known or suspected]
Resolution:
  [How it was fixed, or UNRESOLVED]
```
