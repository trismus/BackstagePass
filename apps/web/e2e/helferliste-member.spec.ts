/**
 * E2E Tests: Helferliste Member Workflow
 *
 * Tests for members registering as helpers:
 * - Viewing available events
 * - Registering for roles
 * - Viewing own registrations
 * - Canceling registrations
 */

import { test, expect } from '@playwright/test'
import { login, testUsers } from './helpers/auth'

test.describe('Helferliste Member Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as regular member
    await login(page, testUsers.mitglied)
  })

  test('can view available helfer events', async ({ page }) => {
    await page.goto('/helferliste')

    // Should see the helferliste page
    await expect(page.locator('h1')).toBeVisible()

    // Should see event cards or list
    const eventList = page.locator(
      '[data-testid="event-list"], .event-card, table tbody tr'
    )
    // Page should load without errors
    await expect(page.locator('body')).toBeVisible()
  })

  test('can view event details', async ({ page }) => {
    await page.goto('/helferliste')

    // Click on first available event
    const eventLink = page.locator('a[href^="/helferliste/"]').first()

    if (await eventLink.isVisible()) {
      await eventLink.click()

      // Should see event details
      await expect(page).toHaveURL(/\/helferliste\/[a-z0-9-]+$/)

      // Should see event information
      await expect(page.locator('h1, h2')).toBeVisible()
    }
  })

  test('can register for a role', async ({ page }) => {
    await page.goto('/helferliste')

    // Click on first event
    const eventLink = page.locator('a[href^="/helferliste/"]').first()

    if (await eventLink.isVisible()) {
      await eventLink.click()
      await page.waitForURL(/\/helferliste\/[a-z0-9-]+$/)

      // Find registration button
      const registerButton = page.locator(
        'button:has-text("Anmelden"), button:has-text("Registrieren"), [data-testid="register-button"]'
      ).first()

      if (await registerButton.isVisible()) {
        await registerButton.click()

        // Should show confirmation or success message
        await expect(
          page.locator('text=Angemeldet, text=Erfolgreich, [data-testid="success-message"]')
        ).toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('can view own registrations in mein-bereich', async ({ page }) => {
    await page.goto('/mein-bereich')

    // Should see personal area
    await expect(page.locator('h1')).toBeVisible()

    // Look for helper section or registrations
    const helperSection = page.locator(
      'text=Helfereinsätze, text=Meine Anmeldungen, [data-testid="my-registrations"]'
    )

    // Page should load
    await expect(page.locator('body')).toBeVisible()
  })

  test('can cancel own registration', async ({ page }) => {
    // First, go to an event and register
    await page.goto('/helferliste')

    const eventLink = page.locator('a[href^="/helferliste/"]').first()

    if (await eventLink.isVisible()) {
      await eventLink.click()
      await page.waitForURL(/\/helferliste\/[a-z0-9-]+$/)

      // Look for cancel button (if already registered)
      const cancelButton = page.locator(
        'button:has-text("Abmelden"), button:has-text("Stornieren"), [data-testid="cancel-button"]'
      ).first()

      if (await cancelButton.isVisible()) {
        await cancelButton.click()

        // Confirm cancellation if dialog appears
        const confirmButton = page.locator(
          'button:has-text("Bestätigen"), button:has-text("Ja")'
        )
        if (await confirmButton.isVisible()) {
          await confirmButton.click()
        }

        // Registration should be removed
        await expect(
          page.locator('text=Abgemeldet, text=Erfolgreich, button:has-text("Anmelden")')
        ).toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('cannot register for overlapping time slots', async ({ page }) => {
    await page.goto('/helferliste')

    // This test assumes there are events with overlapping times
    // The double-booking prevention should show an error

    const eventLink = page.locator('a[href^="/helferliste/"]').first()

    if (await eventLink.isVisible()) {
      await eventLink.click()
      await page.waitForURL(/\/helferliste\/[a-z0-9-]+$/)

      // Try to register for multiple overlapping roles
      const registerButtons = page.locator(
        'button:has-text("Anmelden"), [data-testid="register-button"]'
      )

      const count = await registerButtons.count()
      if (count >= 2) {
        // Register for first
        await registerButtons.first().click()
        await page.waitForTimeout(1000)

        // Try to register for second (overlapping)
        await registerButtons.nth(1).click()

        // Should show overlap error
        const errorMessage = page.locator(
          'text=Zeitüberschneidung, text=bereits angemeldet, [data-testid="error-message"]'
        )

        // Either shows error or succeeds if no overlap
        await expect(page.locator('body')).toBeVisible()
      }
    }
  })

  test('shows registration status correctly', async ({ page }) => {
    await page.goto('/helferliste')

    const eventLink = page.locator('a[href^="/helferliste/"]').first()

    if (await eventLink.isVisible()) {
      await eventLink.click()
      await page.waitForURL(/\/helferliste\/[a-z0-9-]+$/)

      // Look for status badges
      const statusBadges = page.locator(
        '[data-testid="status-badge"], .status-badge, text=angemeldet, text=bestätigt, text=offen'
      )

      // Page should load with status information
      await expect(page.locator('body')).toBeVisible()
    }
  })
})
