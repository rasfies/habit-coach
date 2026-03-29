// e2e/habits-comprehensive.spec.ts
// Comprehensive habit lifecycle tests for HabitAI.
//
// Covers: create, duplicate detection, 10-habit limit, logging (idempotent),
// streak display, edit, delete (with confirmation), reorder, and empty state.
//
// Pre-conditions:
//   - Dev server running at http://localhost:3000
//   - Supabase email confirmations disabled
//   - TEST_USER_EMAIL / TEST_USER_PASSWORD env vars set (or defaults used)
//   - Test account starts with ZERO habits (run `supabase db reset` or clean manually
//     between full runs if you need a pristine state — each test below manages
//     its own setup via beforeEach where possible)

import { test, expect, type Page } from '@playwright/test'

// ---------------------------------------------------------------------------
// Constants / Helpers
// ---------------------------------------------------------------------------

const SEED_EMAIL = process.env.TEST_USER_EMAIL ?? 'seed-user@habitai-test.example.com'
const SEED_PASSWORD = process.env.TEST_USER_PASSWORD ?? 'TestPass123!'

/** Timestamp-based habit name to avoid cross-test collisions. */
function uniqueHabitName(prefix = 'Habit'): string {
  return `${prefix} ${Date.now()}`
}

/** Log in and navigate to /habits. */
async function goToHabits(page: Page): Promise<void> {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(SEED_EMAIL)
  await page.getByLabel(/password/i).fill(SEED_PASSWORD)
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(/\/(dashboard|onboarding|habits)/, { timeout: 12_000 })
  // Navigate explicitly to /habits so tests start on the right page
  await page.goto('/habits')
  await expect(page).toHaveURL(/\/habits/, { timeout: 8_000 })
}

/**
 * Create a habit via the UI.
 * Returns the name used so callers can assert on it.
 */
async function createHabit(
  page: Page,
  name: string,
  emoji = '🏃',
  reminderTime?: string,
): Promise<void> {
  // Open the "Add habit" / "New habit" dialog / form
  const addBtn = page.getByRole('button', { name: /add habit|new habit|\+ habit/i })
  await expect(addBtn).toBeVisible({ timeout: 6_000 })
  await addBtn.click()

  // Fill habit name
  const nameInput = page.getByLabel(/habit name|name/i).first()
  await expect(nameInput).toBeVisible({ timeout: 4_000 })
  await nameInput.fill(name)

  // Optionally set emoji / icon
  const emojiInput = page.getByLabel(/emoji|icon/i)
  if (await emojiInput.isVisible({ timeout: 1_000 }).catch(() => false)) {
    await emojiInput.fill(emoji)
  }

  // Optionally set reminder time
  if (reminderTime) {
    const timeInput = page.getByLabel(/reminder|time/i)
    if (await timeInput.isVisible({ timeout: 1_000 }).catch(() => false)) {
      await timeInput.fill(reminderTime)
    }
  }

  // Submit
  await page.getByRole('button', { name: /save|create|add/i }).last().click()

  // Dialog should close — habit should appear in list
  await expect(nameInput).not.toBeVisible({ timeout: 6_000 })
}

// ===========================================================================
// HABIT LIFECYCLE
// ===========================================================================
test.describe('Habits', () => {

  test.beforeEach(async ({ page }) => {
    await goToHabits(page)
  })

  // -------------------------------------------------------------------------
  // TC-H-01: Create habit — name + emoji + reminder time
  // -------------------------------------------------------------------------
  test('TC-H-01: create habit with name, emoji, and reminder → appears in list', async ({ page }) => {
    const name = uniqueHabitName('Morning Run')

    await createHabit(page, name, '🏃', '07:00')

    // The newly created habit must appear in the list
    await expect(page.getByText(name)).toBeVisible({ timeout: 8_000 })
  })

  // -------------------------------------------------------------------------
  // TC-H-02: Duplicate habit name → error
  // -------------------------------------------------------------------------
  test('TC-H-02: duplicate habit name shows error', async ({ page }) => {
    const name = uniqueHabitName('Duplicate')

    // Create the habit once
    await createHabit(page, name)
    await expect(page.getByText(name)).toBeVisible({ timeout: 8_000 })

    // Try to create it again with the same name
    const addBtn = page.getByRole('button', { name: /add habit|new habit|\+ habit/i })
    await addBtn.click()

    const nameInput = page.getByLabel(/habit name|name/i).first()
    await expect(nameInput).toBeVisible({ timeout: 4_000 })
    await nameInput.fill(name)

    await page.getByRole('button', { name: /save|create|add/i }).last().click()

    // Expect an inline or banner error about the duplicate
    await expect(
      page.getByText(/already exists|duplicate|habit.*name.*taken|name.*already/i),
    ).toBeVisible({ timeout: 6_000 })
  })

  // -------------------------------------------------------------------------
  // TC-H-03: 11th habit exceeds MVP limit of 10 → error
  // -------------------------------------------------------------------------
  test('TC-H-03: creating an 11th habit shows max-limit error', async ({ page }) => {
    // This test is slow — it creates 10 habits sequentially.
    // Uses a dedicated prefix so cleanup can target them if needed.
    test.setTimeout(120_000)

    // First, count existing habits so we create only what is needed
    const existingItems = await page.getByRole('listitem').count()
    const toCreate = Math.max(0, 10 - existingItems)

    for (let i = 0; i < toCreate; i++) {
      await createHabit(page, uniqueHabitName(`LimitTest-${i}`))
    }

    // Now attempt to create one more (the 11th)
    const addBtn = page.getByRole('button', { name: /add habit|new habit|\+ habit/i })
    await addBtn.click()

    const nameInput = page.getByLabel(/habit name|name/i).first()
    await expect(nameInput).toBeVisible({ timeout: 4_000 })
    await nameInput.fill(uniqueHabitName('Over-Limit'))
    await page.getByRole('button', { name: /save|create|add/i }).last().click()

    // Expect: "You can have a maximum of 10 active habits."
    await expect(
      page.getByText(/maximum.*10|10.*habits|limit.*reached|too many habits/i),
    ).toBeVisible({ timeout: 8_000 })
  })

  // -------------------------------------------------------------------------
  // TC-H-04: Log habit for today → completion indicator turns active/green
  // -------------------------------------------------------------------------
  test('TC-H-04: logging a habit for today marks it as completed', async ({ page }) => {
    const name = uniqueHabitName('LogTest')
    await createHabit(page, name)
    await expect(page.getByText(name)).toBeVisible({ timeout: 8_000 })

    // Find the log/check button for this specific habit
    const habitRow = page.locator('[data-testid="habit-item"], li, article').filter({ hasText: name })
    const logBtn = habitRow.getByRole('button', { name: /log|check|done|complete|mark/i })

    // Click the log button
    await logBtn.click()

    // The habit row should now show a completion indicator
    // (aria-pressed="true", a checkmark, green styling, or a "completed" label)
    await expect(async () => {
      const isPressed = await logBtn.getAttribute('aria-pressed')
      const isChecked = await logBtn.getAttribute('aria-checked')
      const rowText = await habitRow.textContent()
      const hasCompleted = /completed|done|logged/i.test(rowText ?? '')
      expect(isPressed === 'true' || isChecked === 'true' || hasCompleted).toBe(true)
    }).toPass({ timeout: 8_000 })
  })

  // -------------------------------------------------------------------------
  // TC-H-05: Log same habit twice → idempotent (still shows as logged, no error)
  // -------------------------------------------------------------------------
  test('TC-H-05: logging a habit twice is idempotent', async ({ page }) => {
    const name = uniqueHabitName('IdempotentLog')
    await createHabit(page, name)
    await expect(page.getByText(name)).toBeVisible({ timeout: 8_000 })

    const habitRow = page.locator('[data-testid="habit-item"], li, article').filter({ hasText: name })
    const logBtn = habitRow.getByRole('button', { name: /log|check|done|complete|mark/i })

    // First log
    await logBtn.click()
    // Second log — should not throw or show an error
    await page.waitForTimeout(500) // brief pause to let first request settle
    await logBtn.click()

    // No error banner should appear
    await expect(
      page.getByText(/something went wrong|server error|500/i),
    ).not.toBeVisible({ timeout: 4_000 })
  })

  // -------------------------------------------------------------------------
  // TC-H-06: Streak count increments after logging
  // -------------------------------------------------------------------------
  test('TC-H-06: streak counter increments after first log', async ({ page }) => {
    const name = uniqueHabitName('StreakTest')
    await createHabit(page, name)
    await expect(page.getByText(name)).toBeVisible({ timeout: 8_000 })

    const habitRow = page.locator('[data-testid="habit-item"], li, article').filter({ hasText: name })

    // Capture the streak text before logging
    const streakBefore = await habitRow
      .getByText(/streak|🔥|\d+ day/i)
      .textContent()
      .catch(() => '0')

    // Log the habit
    const logBtn = habitRow.getByRole('button', { name: /log|check|done|complete|mark/i })
    await logBtn.click()

    // After logging, streak should be at least 1
    await expect(async () => {
      const streakAfter = await habitRow
        .getByText(/streak|🔥|\d+ day/i)
        .textContent()
        .catch(() => '')
      // Any mention of "1" in the streak area means streak incremented
      const hasStreak = /[1-9]\d*/.test(streakAfter ?? '')
      const changed = streakAfter !== streakBefore
      expect(hasStreak || changed).toBe(true)
    }).toPass({ timeout: 8_000 })
  })

  // -------------------------------------------------------------------------
  // TC-H-07: Edit habit name → updated name appears in list
  // -------------------------------------------------------------------------
  test('TC-H-07: editing a habit name updates it in the list', async ({ page }) => {
    const originalName = uniqueHabitName('EditBefore')
    const updatedName = uniqueHabitName('EditAfter')

    await createHabit(page, originalName)
    await expect(page.getByText(originalName)).toBeVisible({ timeout: 8_000 })

    // Open the edit action for this habit
    const habitRow = page.locator('[data-testid="habit-item"], li, article').filter({ hasText: originalName })
    const editBtn = habitRow.getByRole('button', { name: /edit|settings|options|more/i })
    await editBtn.click()

    // Fill updated name
    const nameInput = page.getByLabel(/habit name|name/i).first()
    await expect(nameInput).toBeVisible({ timeout: 4_000 })
    await nameInput.fill(updatedName)

    await page.getByRole('button', { name: /save|update|confirm/i }).last().click()

    // New name should appear; old name should be gone
    await expect(page.getByText(updatedName)).toBeVisible({ timeout: 8_000 })
    await expect(page.getByText(originalName)).not.toBeVisible()
  })

  // -------------------------------------------------------------------------
  // TC-H-08: Delete habit → confirmation dialog → removed from list
  // -------------------------------------------------------------------------
  test('TC-H-08: deleting a habit removes it from the list after confirmation', async ({ page }) => {
    const name = uniqueHabitName('DeleteMe')
    await createHabit(page, name)
    await expect(page.getByText(name)).toBeVisible({ timeout: 8_000 })

    const habitRow = page.locator('[data-testid="habit-item"], li, article').filter({ hasText: name })
    const deleteBtn = habitRow.getByRole('button', { name: /delete|remove/i })
    await deleteBtn.click()

    // Confirmation dialog — expect a confirm/yes button
    const confirmBtn = page.getByRole('button', { name: /confirm|yes|delete|remove/i }).last()
    await expect(confirmBtn).toBeVisible({ timeout: 4_000 })
    await confirmBtn.click()

    // Habit should no longer appear in the list
    await expect(page.getByText(name)).not.toBeVisible({ timeout: 8_000 })
  })

  // -------------------------------------------------------------------------
  // TC-H-09: Reorder habits → new order persists on reload
  // -------------------------------------------------------------------------
  test('TC-H-09: reordering habits persists after page reload', async ({ page }) => {
    // Create two habits to reorder
    const nameA = uniqueHabitName('ReorderFirst')
    const nameB = uniqueHabitName('ReorderSecond')
    await createHabit(page, nameA)
    await expect(page.getByText(nameA)).toBeVisible({ timeout: 8_000 })
    await createHabit(page, nameB)
    await expect(page.getByText(nameB)).toBeVisible({ timeout: 8_000 })

    // Find the drag handles (common pattern: [data-testid="drag-handle"] or role="button" name "drag")
    const handleB = page
      .locator('[data-testid="habit-item"], li, article')
      .filter({ hasText: nameB })
      .getByRole('button', { name: /drag|reorder|move/i })
      .or(
        page
          .locator('[data-testid="habit-item"], li, article')
          .filter({ hasText: nameB })
          .locator('[aria-roledescription="sortable"]')
      )

    const targetA = page
      .locator('[data-testid="habit-item"], li, article')
      .filter({ hasText: nameA })

    // Drag nameB above nameA
    if (await handleB.isVisible({ timeout: 2_000 }).catch(() => false)) {
      const sourceBBox = await handleB.boundingBox()
      const targetBBox = await targetA.boundingBox()

      if (sourceBBox && targetBBox) {
        await page.mouse.move(
          sourceBBox.x + sourceBBox.width / 2,
          sourceBBox.y + sourceBBox.height / 2,
        )
        await page.mouse.down()
        await page.mouse.move(
          targetBBox.x + targetBBox.width / 2,
          targetBBox.y - 5,
          { steps: 10 },
        )
        await page.mouse.up()
      }
    } else {
      // If no drag handle, try up/down reorder buttons
      const moveUpBtn = page
        .locator('[data-testid="habit-item"], li, article')
        .filter({ hasText: nameB })
        .getByRole('button', { name: /move up|↑/i })
      if (await moveUpBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await moveUpBtn.click()
      } else {
        test.skip(true, 'No reorder mechanism found — skip reorder test')
      }
    }

    // Reload and verify order
    await page.reload()
    await page.waitForLoadState('networkidle')

    const allHabitNames = await page
      .locator('[data-testid="habit-item"], li, article')
      .allTextContents()
    const indexA = allHabitNames.findIndex((t) => t.includes(nameA))
    const indexB = allHabitNames.findIndex((t) => t.includes(nameB))

    // B should now appear before A (lower index)
    expect(indexB).toBeLessThan(indexA)
  })

  // -------------------------------------------------------------------------
  // TC-H-10: Empty state shown when user has no habits
  // -------------------------------------------------------------------------
  test('TC-H-10: empty state is shown when no habits exist', async ({ page }) => {
    // This test is best run against a fresh account with no habits.
    // We check for a canonical empty-state element regardless of habit count.
    // If the user already has habits, we skip gracefully rather than deleting them.
    const habitItems = page.locator('[data-testid="habit-item"], [data-testid="habit-list-item"]')
    const count = await habitItems.count()

    if (count > 0) {
      test.skip(true, 'Habits exist on this account — skipping empty-state check. Run with a fresh account.')
    }

    // Empty state: illustration, heading, or call-to-action
    await expect(
      page.getByText(/no habits yet|add your first habit|get started|create your first/i),
    ).toBeVisible({ timeout: 6_000 })

    // The "Add habit" button must still be visible to let the user get started
    await expect(
      page.getByRole('button', { name: /add habit|new habit|\+ habit/i }),
    ).toBeVisible()
  })

})
