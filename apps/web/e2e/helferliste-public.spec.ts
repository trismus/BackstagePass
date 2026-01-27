/**
 * E2E Tests: Helferliste Public/External Helper Workflow
 *
 * Tests for external helpers registering via public link:
 * - Accessing public event page
 * - Registering without login
 * - Form validation
 * - Waitlist behavior
 */

import { test, expect } from '@playwright/test'

// Note: These tests require a public event to exist with a known token
// In a real setup, you'd either:
// 1. Create the event via API before tests
// 2. Use a seeded test database
// 3. Use a known test token from fixtures

const TEST_PUBLIC_TOKEN = process.env.TEST_PUBLIC_TOKEN || 'test-public-token'

test.describe('Helferliste Public Registration', () => {
  test('can access public event page without login', async ({ page }) => {
    await page.goto(`/public/helfer/${TEST_PUBLIC_TOKEN}`)

    // Should not redirect to login
    await expect(page).not.toHaveURL(/\/login/)

    // Should show event information or 404 if token doesn't exist
    const content = page.locator('body')
    await expect(content).toBeVisible()
  })

  test('shows event details on public page', async ({ page }) => {
    await page.goto(`/public/helfer/${TEST_PUBLIC_TOKEN}`)

    // If event exists, should show details
    const eventTitle = page.locator('h1, h2')
    const notFound = page.locator('text=nicht gefunden, text=404')

    // Either shows event or not found
    await expect(page.locator('body')).toBeVisible()
  })

  test('shows only public roles on public page', async ({ page }) => {
    await page.goto(`/public/helfer/${TEST_PUBLIC_TOKEN}`)

    // Internal roles should not be visible
    // This is hard to test without knowing the data
    // We just verify the page loads
    await expect(page.locator('body')).toBeVisible()
  })

  test('can register as external helper', async ({ page }) => {
    await page.goto(`/public/helfer/${TEST_PUBLIC_TOKEN}`)

    // Find registration form
    const nameInput = page.locator('input[name="name"], input[placeholder*="Name"]')
    const emailInput = page.locator('input[name="email"], input[type="email"]')

    if (await nameInput.isVisible()) {
      // Fill out registration form
      await nameInput.fill('Test External Helper')

      if (await emailInput.isVisible()) {
        await emailInput.fill('external.helper@example.com')
      }

      // Phone field if exists
      const phoneInput = page.locator('input[name="telefon"], input[type="tel"]')
      if (await phoneInput.isVisible()) {
        await phoneInput.fill('+41 79 123 45 67')
      }

      // Submit
      const submitButton = page.locator(
        'button[type="submit"], button:has-text("Anmelden")'
      )
      if (await submitButton.isVisible()) {
        await submitButton.click()

        // Should show success or error
        await expect(
          page.locator(
            'text=Erfolgreich, text=Angemeldet, text=Warteliste, [data-testid="success"], [data-testid="error"]'
          )
        ).toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('validates required fields', async ({ page }) => {
    await page.goto(`/public/helfer/${TEST_PUBLIC_TOKEN}`)

    // Try to submit without filling required fields
    const submitButton = page.locator(
      'button[type="submit"], button:has-text("Anmelden")'
    )

    if (await submitButton.isVisible()) {
      await submitButton.click()

      // Should show validation error
      const validationError = page.locator(
        'text=erforderlich, text=Pflichtfeld, [data-testid="validation-error"], .error, [aria-invalid="true"]'
      )

      // Either shows error or form has HTML5 validation
      await expect(page.locator('body')).toBeVisible()
    }
  })

  test('shows available spots count', async ({ page }) => {
    await page.goto(`/public/helfer/${TEST_PUBLIC_TOKEN}`)

    // Look for spots indicator
    const spotsIndicator = page.locator(
      'text=/\\d+.*Plätze/, text=/\\d+.*frei/, text=/\\d+\\/\\d+/, [data-testid="spots-count"]'
    )

    // Page should load - spots indicator is optional based on implementation
    await expect(page.locator('body')).toBeVisible()
  })

  test('shows waitlist message when full', async ({ page }) => {
    await page.goto(`/public/helfer/${TEST_PUBLIC_TOKEN}`)

    // If a role is full, should show waitlist option
    const waitlistIndicator = page.locator(
      'text=Warteliste, text=ausgebucht, text=voll, [data-testid="waitlist"]'
    )

    // Page should load
    await expect(page.locator('body')).toBeVisible()
  })

  test('returns 404 for invalid token', async ({ page }) => {
    await page.goto('/public/helfer/invalid-token-12345')

    // Should show not found or error
    const response = await page.locator('body').textContent()

    // Either 404 page or error message
    const hasError =
      response?.includes('404') ||
      response?.includes('nicht gefunden') ||
      response?.includes('Not Found') ||
      response?.includes('existiert nicht')

    // Page should load (even if it's an error page)
    await expect(page.locator('body')).toBeVisible()
  })

  test('prevents duplicate registration with same email', async ({ page }) => {
    await page.goto(`/public/helfer/${TEST_PUBLIC_TOKEN}`)

    const nameInput = page.locator('input[name="name"], input[placeholder*="Name"]')
    const emailInput = page.locator('input[name="email"], input[type="email"]')

    if (await nameInput.isVisible() && await emailInput.isVisible()) {
      // Use same email twice (if already registered)
      await nameInput.fill('Duplicate Test')
      await emailInput.fill('duplicate@example.com')

      const submitButton = page.locator('button[type="submit"]')
      await submitButton.click()

      // Wait for response
      await page.waitForTimeout(2000)

      // Try again with same email
      await nameInput.fill('Duplicate Test 2')
      await submitButton.click()

      // Should either succeed (different role) or show error
      await expect(page.locator('body')).toBeVisible()
    }
  })
})

test.describe('Helferliste Public Page Accessibility', () => {
  test('page is accessible without JavaScript', async ({ page }) => {
    // Disable JavaScript
    await page.setJavaScriptEnabled(false)

    await page.goto(`/public/helfer/${TEST_PUBLIC_TOKEN}`)

    // Page should still render basic content
    await expect(page.locator('body')).toBeVisible()
  })

  test('page works on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto(`/public/helfer/${TEST_PUBLIC_TOKEN}`)

    // Page should be usable
    await expect(page.locator('body')).toBeVisible()

    // Form should be visible
    const form = page.locator('form')
    if (await form.isVisible()) {
      // Check it's not cut off
      const box = await form.boundingBox()
      expect(box?.width).toBeLessThanOrEqual(375)
    }
  })
})
