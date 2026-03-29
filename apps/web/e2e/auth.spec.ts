// e2e/auth.spec.ts
// End-to-end tests for authentication flows: sign up, log in, log out.

import { test, expect } from '@playwright/test'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Generate a unique test email to avoid conflicts between test runs.
 */
function testEmail(): string {
  const timestamp = Date.now()
  return `e2e-test-${timestamp}@habitai-test.example.com`
}

const TEST_PASSWORD = 'TestPass123!'

// ─── Sign Up ──────────────────────────────────────────────────────────────────
test.describe('Sign Up', () => {
  test('new user can sign up with email and password', async ({ page }) => {
    const email = testEmail()

    await page.goto('/signup')
    await expect(page).toHaveTitle(/sign up|create account|habit/i)

    // Fill in the sign-up form
    await page.getByLabel(/email/i).fill(email)
    await page.getByLabel(/^password$/i).fill(TEST_PASSWORD)

    // Some forms have a confirm password field
    const confirmField = page.getByLabel(/confirm password|repeat password/i)
    if (await confirmField.isVisible()) {
      await confirmField.fill(TEST_PASSWORD)
    }

    const nameField = page.getByLabel(/full name|name/i).first()
    if (await nameField.isVisible()) {
      await nameField.fill('Test User')
    }

    await page.getByRole('button', { name: /sign up|create account|register/i }).click()

    // After successful sign-up: redirect to onboarding or dashboard
    await expect(page).toHaveURL(/\/(onboarding|dashboard|app)/, { timeout: 10_000 })
  })

  test('sign up shows error for invalid email format', async ({ page }) => {
    await page.goto('/signup')

    await page.getByLabel(/email/i).fill('not-an-email')
    await page.getByLabel(/^password$/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /sign up|create account|register/i }).click()

    // Either browser validation or app-level error
    const emailInput = page.getByLabel(/email/i)
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid)
    const hasError = await page.getByText(/invalid email|valid email|email format/i).isVisible()

    expect(isInvalid || hasError).toBe(true)
  })

  test('sign up shows error for weak password', async ({ page }) => {
    await page.goto('/signup')

    await page.getByLabel(/email/i).fill(testEmail())
    await page.getByLabel(/^password$/i).fill('123') // too short

    await page.getByRole('button', { name: /sign up|create account|register/i }).click()

    const hasError = await page
      .getByText(/password.*short|at least|minimum|characters/i)
      .isVisible()
    const passwordInput = page.getByLabel(/^password$/i)
    const isInvalid = await passwordInput
      .evaluate((el: HTMLInputElement) => !el.validity.valid)
      .catch(() => false)

    expect(hasError || isInvalid).toBe(true)
  })

  test('sign up link is present on login page', async ({ page }) => {
    await page.goto('/login')
    const signUpLink = page.getByRole('link', { name: /sign up|create account|register/i })
    await expect(signUpLink).toBeVisible()
  })
})

// ─── Log In ───────────────────────────────────────────────────────────────────
test.describe('Log In', () => {
  test('existing user can log in with correct credentials', async ({ page }) => {
    // Note: this test requires a seeded test user in the test environment.
    // In CI, set TEST_USER_EMAIL and TEST_USER_PASSWORD env vars.
    const email = process.env.TEST_USER_EMAIL ?? 'seed-user@habitai-test.example.com'
    const password = process.env.TEST_USER_PASSWORD ?? TEST_PASSWORD

    await page.goto('/login')
    await expect(page).toHaveTitle(/log in|sign in|habit/i)

    await page.getByLabel(/email/i).fill(email)
    await page.getByLabel(/password/i).fill(password)
    await page.getByRole('button', { name: /log in|sign in/i }).click()

    // Redirect to the protected app
    await expect(page).toHaveURL(/\/(dashboard|app|habits)/, { timeout: 10_000 })
  })

  test('wrong password shows error message', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel(/email/i).fill('wrong@example.com')
    await page.getByLabel(/password/i).fill('WrongPassword999!')
    await page.getByRole('button', { name: /log in|sign in/i }).click()

    await expect(
      page.getByText(/invalid credentials|incorrect|wrong password|not found/i),
    ).toBeVisible({ timeout: 8_000 })
  })

  test('empty form shows validation errors', async ({ page }) => {
    await page.goto('/login')

    await page.getByRole('button', { name: /log in|sign in/i }).click()

    // At minimum, email field should be required
    const emailInput = page.getByLabel(/email/i)
    const isRequired = await emailInput.getAttribute('required')
    const hasError = await page.getByText(/required|email.*required/i).isVisible()

    expect(isRequired !== null || hasError).toBe(true)
  })

  test('login page has link to sign up', async ({ page }) => {
    await page.goto('/login')
    const signUpLink = page.getByRole('link', { name: /sign up|create account/i })
    await expect(signUpLink).toBeVisible()
  })

  test('unauthenticated user is redirected to login from protected page', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 })
  })
})

// ─── Log Out ──────────────────────────────────────────────────────────────────
test.describe('Log Out', () => {
  test.beforeEach(async ({ page }) => {
    // Log in before testing logout
    const email = process.env.TEST_USER_EMAIL ?? 'seed-user@habitai-test.example.com'
    const password = process.env.TEST_USER_PASSWORD ?? TEST_PASSWORD

    await page.goto('/login')
    await page.getByLabel(/email/i).fill(email)
    await page.getByLabel(/password/i).fill(password)
    await page.getByRole('button', { name: /log in|sign in/i }).click()
    await expect(page).toHaveURL(/\/(dashboard|app|habits)/, { timeout: 10_000 })
  })

  test('user can log out and is redirected to login or home', async ({ page }) => {
    // Logout button is typically in a user menu / dropdown
    const userMenu = page.getByRole('button', { name: /account|profile|menu|user/i })
    if (await userMenu.isVisible()) {
      await userMenu.click()
    }

    const logoutButton = page.getByRole('button', { name: /log out|sign out|logout/i })
    await expect(logoutButton).toBeVisible({ timeout: 5_000 })
    await logoutButton.click()

    // Should redirect to login or landing page
    await expect(page).toHaveURL(/\/(login|$)/, { timeout: 8_000 })
  })

  test('after logout, protected page redirects to login', async ({ page }) => {
    // Log out first
    const userMenu = page.getByRole('button', { name: /account|profile|menu|user/i })
    if (await userMenu.isVisible()) {
      await userMenu.click()
    }

    const logoutButton = page.getByRole('button', { name: /log out|sign out|logout/i })
    if (await logoutButton.isVisible()) {
      await logoutButton.click()
      await page.waitForURL(/\/(login|$)/, { timeout: 8_000 })
    }

    // Try to access a protected route
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 })
  })
})
