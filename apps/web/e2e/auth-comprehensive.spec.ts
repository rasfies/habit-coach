// e2e/auth-comprehensive.spec.ts
// Comprehensive authentication test suite for HabitAI.
// Covers signup, login, route protection, logout, password reset,
// and session persistence.
//
// Pre-conditions:
//   - Next.js dev server running at http://localhost:3000
//   - Supabase email confirmations DISABLED (Supabase dashboard → Auth → Disable email confirmations)
//   - .env.local contains valid NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
//   - A seeded test user exists: set TEST_USER_EMAIL + TEST_USER_PASSWORD env vars
//     (default: seed-user@habitai-test.example.com / TestPass123!)

import { test, expect, type Page } from '@playwright/test'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Unique email per call — avoids conflicts across parallel test runs. */
function uniqueEmail(): string {
  return `e2e-${Date.now()}-${Math.floor(Math.random() * 9999)}@habitai-test.example.com`
}

const TEST_PASSWORD = 'TestPass123!'

/** Credentials for the pre-seeded test account. */
const SEED_EMAIL = process.env.TEST_USER_EMAIL ?? 'seed-user@habitai-test.example.com'
const SEED_PASSWORD = process.env.TEST_USER_PASSWORD ?? TEST_PASSWORD

/** Log in via the UI and wait for redirect to a protected route. */
async function loginAs(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login')
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill(password)
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(/\/(dashboard|onboarding|habits)/, { timeout: 12_000 })
}

/** Click the logout control — handles both a direct button and a user-menu pattern. */
async function logout(page: Page): Promise<void> {
  // Some implementations expose logout inside a dropdown / avatar menu
  const userMenu = page.getByRole('button', { name: /account|profile|menu|avatar/i })
  if (await userMenu.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await userMenu.click()
  }
  const logoutBtn = page.getByRole('button', { name: /log out|sign out|logout/i })
  await expect(logoutBtn).toBeVisible({ timeout: 5_000 })
  await logoutBtn.click()
  await expect(page).toHaveURL(/\/(login|$)/, { timeout: 8_000 })
}

// ===========================================================================
// SIGNUP
// ===========================================================================
test.describe('Signup', () => {

  // TC-01: Happy path — new user signs up and is redirected to onboarding
  test('TC-01: valid signup redirects to /onboarding', async ({ page }) => {
    const email = uniqueEmail()

    await page.goto('/signup')
    await expect(page).toHaveTitle(/sign up|create account|habit/i)

    // Display name field (labeled "Display name" in the signup page)
    await page.getByLabel(/display name/i).fill('E2E Test User')
    await page.getByLabel(/^email$/i).fill(email)
    // Fill password — use the first "Password" label (not "Confirm password")
    await page.getByLabel(/^password$/i).fill(TEST_PASSWORD)
    await page.getByLabel(/confirm password/i).fill(TEST_PASSWORD)

    await page.getByRole('button', { name: /create.*account|sign up/i }).click()

    // After signup: redirect to /onboarding (email confirmation disabled in dev)
    await expect(page).toHaveURL(/\/(onboarding|dashboard)/, { timeout: 12_000 })

    // No error banner must be visible
    await expect(page.getByText(/something went wrong|already exists/i)).not.toBeVisible()
  })

  // TC-02: Invalid email format → inline field error
  test('TC-02: invalid email shows field error', async ({ page }) => {
    await page.goto('/signup')

    await page.getByLabel(/display name/i).fill('Test User')
    await page.getByLabel(/^email$/i).fill('not-an-email')
    await page.getByLabel(/^password$/i).fill(TEST_PASSWORD)
    await page.getByLabel(/confirm password/i).fill(TEST_PASSWORD)

    await page.getByRole('button', { name: /create.*account|sign up/i }).click()

    // The signup page validates client-side: "Please enter a valid email address."
    const emailError = page.getByText(/valid email|invalid email|email.*address/i)
    const emailInput = page.getByLabel(/^email$/i)
    const browserInvalid = await emailInput
      .evaluate((el: HTMLInputElement) => !el.validity.valid)
      .catch(() => false)

    expect(
      await emailError.isVisible().catch(() => false) || browserInvalid,
    ).toBe(true)
  })

  // TC-03: Weak password (< 8 chars) → inline error
  test('TC-03: password shorter than 8 chars shows error', async ({ page }) => {
    await page.goto('/signup')

    await page.getByLabel(/display name/i).fill('Test User')
    await page.getByLabel(/^email$/i).fill(uniqueEmail())
    await page.getByLabel(/^password$/i).fill('abc')   // 3 chars — too short
    await page.getByLabel(/confirm password/i).fill('abc')

    await page.getByRole('button', { name: /create.*account|sign up/i }).click()

    // Expect: "Password must be at least 8 characters."
    await expect(
      page.getByText(/at least 8|minimum.*8|password.*short|8 characters/i),
    ).toBeVisible({ timeout: 4_000 })
  })

  // TC-04: Already-registered email → server error message
  test('TC-04: duplicate email shows server error', async ({ page }) => {
    // Use the known seeded account to trigger a conflict
    await page.goto('/signup')

    await page.getByLabel(/display name/i).fill('Duplicate User')
    await page.getByLabel(/^email$/i).fill(SEED_EMAIL)
    await page.getByLabel(/^password$/i).fill(TEST_PASSWORD)
    await page.getByLabel(/confirm password/i).fill(TEST_PASSWORD)

    await page.getByRole('button', { name: /create.*account|sign up/i }).click()

    // Error message: "An account with this email already exists."
    await expect(
      page.getByText(/already exists|already in use|email.*taken/i),
    ).toBeVisible({ timeout: 10_000 })
  })

  // TC-05: Mismatched passwords → inline error
  test('TC-05: mismatched passwords shows confirm-password error', async ({ page }) => {
    await page.goto('/signup')

    await page.getByLabel(/display name/i).fill('Test User')
    await page.getByLabel(/^email$/i).fill(uniqueEmail())
    await page.getByLabel(/^password$/i).fill(TEST_PASSWORD)
    await page.getByLabel(/confirm password/i).fill('DifferentPass999!')

    await page.getByRole('button', { name: /create.*account|sign up/i }).click()

    // Expect: "Passwords don't match."
    await expect(
      page.getByText(/passwords.*don't match|passwords.*not match|passwords.*mismatch/i),
    ).toBeVisible({ timeout: 4_000 })
  })

  // TC-06: Display name too short → inline error
  test('TC-06: display name under 2 chars shows error', async ({ page }) => {
    await page.goto('/signup')

    await page.getByLabel(/display name/i).fill('A')  // 1 char — too short
    await page.getByLabel(/^email$/i).fill(uniqueEmail())
    await page.getByLabel(/^password$/i).fill(TEST_PASSWORD)
    await page.getByLabel(/confirm password/i).fill(TEST_PASSWORD)

    await page.getByRole('button', { name: /create.*account|sign up/i }).click()

    await expect(
      page.getByText(/at least 2|display name.*2|name.*characters/i),
    ).toBeVisible({ timeout: 4_000 })
  })

  // TC-07: Signup page has link back to login
  test('TC-07: signup page links to login', async ({ page }) => {
    await page.goto('/signup')
    const loginLink = page.getByRole('link', { name: /sign in|log in|already have/i })
    await expect(loginLink).toBeVisible()
    await loginLink.click()
    await expect(page).toHaveURL(/\/login/)
  })

})

// ===========================================================================
// LOGIN
// ===========================================================================
test.describe('Login', () => {

  // TC-08: Correct credentials → redirect to /dashboard (or /onboarding if incomplete)
  test('TC-08: valid credentials redirect to app', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveTitle(/log in|sign in|habit/i)

    await page.getByLabel(/email/i).fill(SEED_EMAIL)
    await page.getByLabel(/password/i).fill(SEED_PASSWORD)
    await page.getByRole('button', { name: /sign in/i }).click()

    await expect(page).toHaveURL(/\/(dashboard|onboarding|habits)/, { timeout: 12_000 })
  })

  // TC-09: Wrong password → error shown (does not specify which field was wrong)
  test('TC-09: wrong password shows generic error', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel(/email/i).fill(SEED_EMAIL)
    await page.getByLabel(/password/i).fill('WrongPassword000!')
    await page.getByRole('button', { name: /sign in/i }).click()

    // The login page sets: "Email or password is incorrect."
    await expect(
      page.getByText(/incorrect|invalid credentials|email or password/i),
    ).toBeVisible({ timeout: 10_000 })
  })

  // TC-10: Non-existent email → error (should not reveal which field caused failure)
  test('TC-10: non-existent email shows generic error', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel(/email/i).fill('ghost-user-nobody@habitai-test.example.com')
    await page.getByLabel(/password/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /sign in/i }).click()

    // Should show an error — and must NOT distinguish between bad email vs bad password
    // (prevents user enumeration)
    const errorBanner = page.getByText(/incorrect|invalid credentials|email or password/i)
    await expect(errorBanner).toBeVisible({ timeout: 10_000 })

    // Confirm we are still on the login page
    await expect(page).toHaveURL(/\/login/)
  })

  // TC-11: Empty form submission → HTML5 required validation
  test('TC-11: empty form shows validation errors', async ({ page }) => {
    await page.goto('/login')

    await page.getByRole('button', { name: /sign in/i }).click()

    // Email input must be required — either browser validation or app-level message
    const emailInput = page.getByLabel(/email/i)
    const isRequired = await emailInput.getAttribute('required')
    const hasAppError = await page.getByText(/required|email.*required/i).isVisible().catch(() => false)

    expect(isRequired !== null || hasAppError).toBe(true)
    // Must stay on login page
    await expect(page).toHaveURL(/\/login/)
  })

  // TC-12: Pressing Enter in the password field submits the form
  test('TC-12: Enter key in password field submits form', async ({ page }) => {
    await page.goto('/login')

    await page.getByLabel(/email/i).fill(SEED_EMAIL)
    const passwordInput = page.getByLabel(/password/i)
    await passwordInput.fill(SEED_PASSWORD)
    await passwordInput.press('Enter')

    // Should redirect — not stay on login
    await expect(page).toHaveURL(/\/(dashboard|onboarding|habits)/, { timeout: 12_000 })
  })

  // TC-13: Login page has link to signup
  test('TC-13: login page links to signup', async ({ page }) => {
    await page.goto('/login')
    const signupLink = page.getByRole('link', { name: /sign up|create account/i })
    await expect(signupLink).toBeVisible()
  })

  // TC-14: Forgot password link is present on login page
  test('TC-14: "Forgot password?" link is visible on login page', async ({ page }) => {
    await page.goto('/login')
    const forgotLink = page.getByRole('link', { name: /forgot password/i })
    await expect(forgotLink).toBeVisible()
  })

})

// ===========================================================================
// ROUTE PROTECTION
// ===========================================================================
test.describe('Route Protection', () => {

  // TC-15 to TC-17: Unauthenticated access to protected pages
  const PROTECTED_ROUTES = ['/dashboard', '/habits', '/groups'] as const

  for (const route of PROTECTED_ROUTES) {
    test(`TC-15: unauthenticated ${route} → redirect to /login`, async ({ page }) => {
      // Clear storage to ensure no lingering session
      await page.context().clearCookies()
      await page.goto(route)
      await expect(page).toHaveURL(/\/login/, { timeout: 8_000 })
    })
  }

  // TC-18: Unauthenticated API call returns 401 JSON
  test('TC-18: unauthenticated GET /api/habits returns 401', async ({ page }) => {
    await page.context().clearCookies()
    const response = await page.request.get('/api/habits')
    expect(response.status()).toBe(401)

    // Response should be JSON (not an HTML redirect)
    const contentType = response.headers()['content-type'] ?? ''
    expect(contentType).toContain('application/json')
  })

  // TC-19: Authenticated user visiting /login → redirect to /dashboard
  test('TC-19: logged-in user visiting /login is redirected to /dashboard', async ({ page }) => {
    await loginAs(page, SEED_EMAIL, SEED_PASSWORD)

    // Now try to access /login while authenticated
    await page.goto('/login')
    await expect(page).toHaveURL(/\/(dashboard|habits|onboarding)/, { timeout: 8_000 })
  })

  // TC-20: Authenticated user visiting /signup → redirect to /dashboard
  test('TC-20: logged-in user visiting /signup is redirected to /dashboard', async ({ page }) => {
    await loginAs(page, SEED_EMAIL, SEED_PASSWORD)

    await page.goto('/signup')
    await expect(page).toHaveURL(/\/(dashboard|habits|onboarding)/, { timeout: 8_000 })
  })

})

// ===========================================================================
// LOGOUT
// ===========================================================================
test.describe('Logout', () => {

  test.beforeEach(async ({ page }) => {
    await loginAs(page, SEED_EMAIL, SEED_PASSWORD)
  })

  // TC-21: Logout clears session → subsequent /dashboard visit redirects to /login
  test('TC-21: logout clears session and redirects to login', async ({ page }) => {
    await logout(page)

    // Try to access a protected route after logout
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 })
  })

  // TC-22: After logout, browser back button does not restore authenticated session
  test('TC-22: back button after logout does not restore session', async ({ page }) => {
    await logout(page)

    // Navigate back in history — the app should not treat this as authenticated
    await page.goBack()

    // Either still on login/landing, or if we landed on a protected page the middleware
    // should immediately redirect back to /login
    const currentUrl = page.url()
    const isProtectedRoute = /\/(dashboard|habits|groups)/.test(currentUrl)

    if (isProtectedRoute) {
      // Middleware should kick in and redirect
      await expect(page).toHaveURL(/\/login/, { timeout: 6_000 })
    } else {
      // Already on a non-protected page — pass
      expect(/\/(login|$|\?|#)/.test(currentUrl) || !isProtectedRoute).toBe(true)
    }
  })

})

// ===========================================================================
// PASSWORD RESET
// ===========================================================================
test.describe('Password Reset', () => {

  // TC-23: Forgot password page is accessible from login
  test('TC-23: forgot-password page is reachable from login page', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: /forgot password/i }).click()
    await expect(page).toHaveURL(/\/forgot-password/, { timeout: 6_000 })
    // Page should render a heading
    await expect(
      page.getByRole('heading', { name: /forgot|reset|password/i }),
    ).toBeVisible()
  })

  // TC-24: Valid email on forgot-password form → success message
  test('TC-24: submitting valid email on forgot-password shows success message', async ({ page }) => {
    await page.goto('/forgot-password')

    await page.getByLabel(/email/i).fill(SEED_EMAIL)
    await page.getByRole('button', { name: /send|reset|submit/i }).click()

    // Should show a confirmation — actual email delivery is not tested here
    await expect(
      page.getByText(/check your email|sent|reset.*link|instructions/i),
    ).toBeVisible({ timeout: 10_000 })
  })

  // TC-25: Invalid email format on forgot-password → inline validation error
  test('TC-25: invalid email format on forgot-password shows validation error', async ({ page }) => {
    await page.goto('/forgot-password')

    await page.getByLabel(/email/i).fill('not-valid')
    await page.getByRole('button', { name: /send|reset|submit/i }).click()

    const emailInput = page.getByLabel(/email/i)
    const browserInvalid = await emailInput
      .evaluate((el: HTMLInputElement) => !el.validity.valid)
      .catch(() => false)
    const appError = await page.getByText(/valid email|invalid email/i).isVisible().catch(() => false)

    expect(browserInvalid || appError).toBe(true)
  })

})

// ===========================================================================
// SESSION PERSISTENCE
// ===========================================================================
test.describe('Session Persistence', () => {

  test.beforeEach(async ({ page }) => {
    await loginAs(page, SEED_EMAIL, SEED_PASSWORD)
  })

  // TC-26: Page reload after login keeps user logged in (session stored in cookie/localStorage)
  test('TC-26: reload after login keeps user authenticated', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 8_000 })

    await page.reload()

    // Must stay on /dashboard — not redirected to /login
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 8_000 })

    // The page must not show a login form
    await expect(page.getByLabel(/email/i)).not.toBeVisible()
  })

  // TC-27: New tab after login inherits the session (shared cookies)
  test('TC-27: new browser context tab shares session via cookie', async ({ page, context }) => {
    // Confirm we are authenticated in the first page
    await expect(page).toHaveURL(/\/(dashboard|onboarding|habits)/)

    // Open a new page within the same browser context (shared cookies)
    const newTab = await context.newPage()
    await newTab.goto('/dashboard')

    // Should not redirect to login — session cookie is shared
    await expect(newTab).toHaveURL(/\/dashboard/, { timeout: 8_000 })
    await expect(newTab.getByLabel(/email/i)).not.toBeVisible()

    await newTab.close()
  })

})
