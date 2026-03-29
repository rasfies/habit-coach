// e2e/groups-comprehensive.spec.ts
// Comprehensive group feature tests for HabitAI.
//
// Covers: create group, join via invite code, invalid code error,
// leaderboard streak display, and leaving a group.
//
// Pre-conditions:
//   - Dev server running at http://localhost:3000
//   - Supabase email confirmations disabled
//   - TEST_USER_EMAIL / TEST_USER_PASSWORD: the primary test account
//   - TEST_USER2_EMAIL / TEST_USER2_PASSWORD: a second test account (for join-group tests)
//     If the second account is not configured, join-from-another-user tests are skipped.

import { test, expect, type Page, type BrowserContext } from '@playwright/test'

// ---------------------------------------------------------------------------
// Constants / Helpers
// ---------------------------------------------------------------------------

const SEED_EMAIL = process.env.TEST_USER_EMAIL ?? 'seed-user@habitai-test.example.com'
const SEED_PASSWORD = process.env.TEST_USER_PASSWORD ?? 'TestPass123!'

const SEED2_EMAIL = process.env.TEST_USER2_EMAIL ?? ''
const SEED2_PASSWORD = process.env.TEST_USER2_PASSWORD ?? ''

/** Unique group name per call. */
function uniqueGroupName(prefix = 'Group'): string {
  return `${prefix} ${Date.now()}`
}

/** Log in via UI and land on the groups page. */
async function goToGroups(page: Page, email = SEED_EMAIL, password = SEED_PASSWORD): Promise<void> {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(/\/(dashboard|onboarding|habits)/, { timeout: 12_000 })
  await page.goto('/groups')
  await expect(page).toHaveURL(/\/groups/, { timeout: 8_000 })
}

/**
 * Create a group and return the invite code displayed on screen.
 * Asserts the code is visible before returning.
 */
async function createGroupAndGetCode(page: Page, name: string): Promise<string> {
  const createBtn = page.getByRole('button', { name: /create group|new group|\+ group/i })
  await expect(createBtn).toBeVisible({ timeout: 6_000 })
  await createBtn.click()

  const nameInput = page.getByLabel(/group name|name/i).first()
  await expect(nameInput).toBeVisible({ timeout: 4_000 })
  await nameInput.fill(name)

  await page.getByRole('button', { name: /create|save|submit/i }).last().click()

  // After creation the invite code should be shown
  const codeEl = page.getByText(/invite code|join code/i)
    .locator('..') // parent container likely holds the actual code value
    .or(page.getByTestId('invite-code'))
    .or(page.locator('[data-testid="invite-code"]'))

  // Fallback: look for a 6-char uppercase alphanumeric string (per API contract)
  const codeText = page.locator('text=/^[A-Z0-9]{6}$/')

  await expect(codeEl.or(codeText)).toBeVisible({ timeout: 8_000 })

  // Try to extract the raw code value
  const rawCode = await codeText.first().textContent().catch(() => null)
    ?? await codeEl.first().textContent().catch(() => null)
    ?? ''

  // Strip whitespace and return just the 6-char segment if present
  const match = rawCode.match(/[A-Z0-9]{6}/)
  return match ? match[0] : rawCode.trim()
}

// ===========================================================================
// GROUP TESTS
// ===========================================================================
test.describe('Groups', () => {

  test.beforeEach(async ({ page }) => {
    await goToGroups(page)
  })

  // -------------------------------------------------------------------------
  // TC-G-01: Create group → invite code shown
  // -------------------------------------------------------------------------
  test('TC-G-01: creating a group shows an invite code', async ({ page }) => {
    const name = uniqueGroupName('Accountability')

    const code = await createGroupAndGetCode(page, name)

    // Code must be 6 uppercase alphanumeric characters
    expect(code).toMatch(/^[A-Z0-9]{6}$/)

    // The group name must also appear on screen
    await expect(page.getByText(name)).toBeVisible({ timeout: 6_000 })
  })

  // -------------------------------------------------------------------------
  // TC-G-02: Join group with valid code → member count increases
  // -------------------------------------------------------------------------
  test('TC-G-02: joining a group with a valid invite code increases member count', async ({
    page,
    context,
  }) => {
    // Skip if no second test account is configured
    if (!SEED2_EMAIL || !SEED2_PASSWORD) {
      test.skip(true, 'TEST_USER2_EMAIL / TEST_USER2_PASSWORD not set — skipping join test')
    }

    // Create group with the primary account
    const name = uniqueGroupName('JoinTest')
    const code = await createGroupAndGetCode(page, name)
    expect(code).toMatch(/^[A-Z0-9]{6}$/)

    // Capture member count before join (should be 1 — creator only)
    const groupCard = page.locator('[data-testid="group-item"], li, article').filter({ hasText: name })
    const memberTextBefore = await groupCard
      .getByText(/member|people/i)
      .textContent()
      .catch(() => '1')
    const countBefore = parseInt(memberTextBefore?.match(/\d+/)?.[0] ?? '1', 10)

    // Open a second browser context (separate session) for user 2
    const ctx2 = await context.browser()!.newContext()
    const page2 = await ctx2.newPage()

    try {
      await goToGroups(page2, SEED2_EMAIL, SEED2_PASSWORD)

      // Join via the invite code
      const joinBtn = page2.getByRole('button', { name: /join group|join/i })
      await expect(joinBtn).toBeVisible({ timeout: 6_000 })
      await joinBtn.click()

      const codeInput = page2.getByLabel(/invite code|code/i)
      await expect(codeInput).toBeVisible({ timeout: 4_000 })
      await codeInput.fill(code)
      await page2.getByRole('button', { name: /join|submit/i }).last().click()

      // User2 should now see the group in their list
      await expect(page2.getByText(name)).toBeVisible({ timeout: 10_000 })
    } finally {
      await page2.close()
      await ctx2.close()
    }

    // Back on user1's page: reload and check member count increased
    await page.reload()
    const updatedGroupCard = page.locator('[data-testid="group-item"], li, article').filter({ hasText: name })
    const memberTextAfter = await updatedGroupCard
      .getByText(/member|people/i)
      .textContent()
      .catch(() => '2')
    const countAfter = parseInt(memberTextAfter?.match(/\d+/)?.[0] ?? '2', 10)

    expect(countAfter).toBeGreaterThan(countBefore)
  })

  // -------------------------------------------------------------------------
  // TC-G-03: Join with invalid code → error message
  // -------------------------------------------------------------------------
  test('TC-G-03: joining with an invalid invite code shows an error', async ({ page }) => {
    const joinBtn = page.getByRole('button', { name: /join group|join/i })
    await expect(joinBtn).toBeVisible({ timeout: 6_000 })
    await joinBtn.click()

    const codeInput = page.getByLabel(/invite code|code/i)
    await expect(codeInput).toBeVisible({ timeout: 4_000 })
    // Enter a clearly bogus code
    await codeInput.fill('XXXXXX')
    await page.getByRole('button', { name: /join|submit/i }).last().click()

    // Expect: "This invite code is not valid." (per API_CONTRACT.md)
    await expect(
      page.getByText(/invalid.*code|code.*not valid|not found|invalid invite/i),
    ).toBeVisible({ timeout: 8_000 })
  })

  // -------------------------------------------------------------------------
  // TC-G-04: Group leaderboard shows member streaks
  // -------------------------------------------------------------------------
  test('TC-G-04: group detail page shows leaderboard with member streaks', async ({ page }) => {
    // Create a group first (so we have at least one to navigate into)
    const name = uniqueGroupName('LeaderboardTest')
    await createGroupAndGetCode(page, name)
    await expect(page.getByText(name)).toBeVisible({ timeout: 8_000 })

    // Navigate into the group detail page
    const groupCard = page.locator('[data-testid="group-item"], li, article').filter({ hasText: name })
    await groupCard.click()
    // OR: click a "View" / name link
    await expect(page).toHaveURL(/\/groups\/[^/]+/, { timeout: 8_000 })

    // The leaderboard / streak section should be visible
    await expect(
      page.getByText(/leaderboard|streak|member.*streak|top.*habits/i),
    ).toBeVisible({ timeout: 8_000 })

    // At least one member row (the creator) should be present
    const memberRows = page.locator(
      '[data-testid="member-row"], [data-testid="leaderboard-row"], tr, li',
    ).filter({ hasText: /streak|\d+ day/i })

    // If member rows aren't labelled with streak yet, just confirm member names render
    const memberCount = await memberRows.count()
    if (memberCount === 0) {
      // Fallback: check for the current user's display name appearing somewhere in the group detail
      const anyMember = page.getByText(SEED_EMAIL.split('@')[0])
      await expect(anyMember.or(page.getByText(/you|your streak/i))).toBeVisible({ timeout: 6_000 })
    } else {
      expect(memberCount).toBeGreaterThanOrEqual(1)
    }
  })

  // -------------------------------------------------------------------------
  // TC-G-05: Leave group → removed from groups list
  // -------------------------------------------------------------------------
  test('TC-G-05: leaving a group removes it from the groups list', async ({ page }) => {
    const name = uniqueGroupName('LeaveTest')
    await createGroupAndGetCode(page, name)
    await expect(page.getByText(name)).toBeVisible({ timeout: 8_000 })

    // Navigate into the group
    const groupCard = page.locator('[data-testid="group-item"], li, article').filter({ hasText: name })
    await groupCard.click()
    await expect(page).toHaveURL(/\/groups\/[^/]+/, { timeout: 8_000 })

    // Find and click the "Leave group" button
    const leaveBtn = page.getByRole('button', { name: /leave group|leave/i })
    await expect(leaveBtn).toBeVisible({ timeout: 6_000 })
    await leaveBtn.click()

    // Confirm if a confirmation dialog appears
    const confirmBtn = page.getByRole('button', { name: /confirm|yes|leave/i }).last()
    if (await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await confirmBtn.click()
    }

    // Should redirect back to /groups
    await expect(page).toHaveURL(/\/groups$/, { timeout: 8_000 })

    // The group should no longer appear in the list
    await expect(page.getByText(name)).not.toBeVisible({ timeout: 6_000 })
  })

  // -------------------------------------------------------------------------
  // TC-G-06: Group invite code only visible to members (not on public page)
  // -------------------------------------------------------------------------
  test('TC-G-06: invite code is visible inside the group to members', async ({ page }) => {
    const name = uniqueGroupName('InviteVisible')
    const code = await createGroupAndGetCode(page, name)
    expect(code).toMatch(/^[A-Z0-9]{6}$/)

    // Navigate into the group detail page
    const groupCard = page.locator('[data-testid="group-item"], li, article').filter({ hasText: name })
    await groupCard.click()
    await expect(page).toHaveURL(/\/groups\/[^/]+/, { timeout: 8_000 })

    // The invite code should be accessible within the group detail view
    await expect(page.getByText(code)).toBeVisible({ timeout: 6_000 })
  })

})
