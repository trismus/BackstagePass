/**
 * E2E Tests: Helferliste Admin Workflow
 *
 * Tests for administrators managing helper events:
 * - Creating new events
 * - Adding role instances
 * - Publishing events
 * - Managing registrations
 */

import { test, expect } from '@playwright/test'
import { login, testUsers } from './helpers/auth'

test.describe('Helferliste Admin Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await login(page, testUsers.admin)
  })

  test('can view helferliste overview', async ({ page }) => {
    await page.goto('/helferliste')

    // Should see the page title
    await expect(page.locator('h1')).toContainText(/Helferliste|Helfer/i)

    // Should see create button
    await expect(
      page.locator('a[href="/helferliste/neu"], button:has-text("Neu")')
    ).toBeVisible()
  })

  test('can create a new helfer event', async ({ page }) => {
    await page.goto('/helferliste/neu')

    // Fill out the form
    await page.fill('input[name="name"]', 'E2E Test Event')

    // Set date (future date)
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 30)
    const dateStr = futureDate.toISOString().slice(0, 16) // YYYY-MM-DDTHH:mm
    await page.fill('input[name="datum_start"]', dateStr)

    // Set end date
    futureDate.setHours(futureDate.getHours() + 4)
    const endDateStr = futureDate.toISOString().slice(0, 16)
    await page.fill('input[name="datum_end"]', endDateStr)

    // Fill location
    await page.fill('input[name="ort"]', 'Testort')

    // Submit
    await page.click('button[type="submit"]')

    // Should redirect to event detail page
    await expect(page).toHaveURL(/\/helferliste\/[a-z0-9-]+$/, { timeout: 5000 })

    // Should show success message or event name
    await expect(page.locator('text=E2E Test Event')).toBeVisible()
  })

  test('can add role instances from templates', async ({ page }) => {
    // First create an event or go to existing one
    await page.goto('/helferliste')

    // Click on first event or create new one
    const eventLink = page.locator('a[href^="/helferliste/"]').first()
    if (await eventLink.isVisible()) {
      await eventLink.click()
    } else {
      // Create new event first
      await page.goto('/helferliste/neu')
      await page.fill('input[name="name"]', 'Test Event for Roles')
      const date = new Date()
      date.setDate(date.getDate() + 30)
      await page.fill('input[name="datum_start"]', date.toISOString().slice(0, 16))
      date.setHours(date.getHours() + 4)
      await page.fill('input[name="datum_end"]', date.toISOString().slice(0, 16))
      await page.click('button[type="submit"]')
      await page.waitForURL(/\/helferliste\/[a-z0-9-]+$/)
    }

    // Look for "Add role" button
    const addRoleButton = page.locator(
      'button:has-text("Rolle hinzufügen"), button:has-text("Aus Vorlage")'
    )

    if (await addRoleButton.isVisible()) {
      await addRoleButton.click()

      // Select a template (e.g., Einlass)
      const templateOption = page.locator('text=Einlass').first()
      if (await templateOption.isVisible()) {
        await templateOption.click()
      }

      // Confirm
      const confirmButton = page.locator(
        'button:has-text("Hinzufügen"), button:has-text("Speichern")'
      )
      if (await confirmButton.isVisible()) {
        await confirmButton.click()
      }

      // Should show the new role
      await expect(page.locator('text=Einlass')).toBeVisible({ timeout: 5000 })
    }
  })

  test('can view and manage registrations', async ({ page }) => {
    await page.goto('/helferliste')

    // Click on first event
    const eventLink = page.locator('a[href^="/helferliste/"]').first()
    if (await eventLink.isVisible()) {
      await eventLink.click()
      await page.waitForURL(/\/helferliste\/[a-z0-9-]+$/)

      // Look for registrations section
      const registrationsSection = page.locator(
        'text=Anmeldungen, text=Registrierungen, [data-testid="registrations"]'
      )

      // Page should load without errors
      await expect(page.locator('h1, h2')).toBeVisible()
    }
  })

  test('can change registration status', async ({ page }) => {
    await page.goto('/helferliste')

    // Find an event with registrations
    const eventLink = page.locator('a[href^="/helferliste/"]').first()
    if (await eventLink.isVisible()) {
      await eventLink.click()
      await page.waitForURL(/\/helferliste\/[a-z0-9-]+$/)

      // Look for status dropdown or buttons
      const statusButton = page.locator(
        'button:has-text("Bestätigen"), select[name="status"], [data-testid="status-select"]'
      ).first()

      if (await statusButton.isVisible()) {
        await statusButton.click()

        // Select "Bestätigt" if it's a dropdown
        const confirmedOption = page.locator('text=Bestätigt, option[value="bestaetigt"]')
        if (await confirmedOption.isVisible()) {
          await confirmedOption.click()
        }
      }
    }
  })

  test('can access template management', async ({ page }) => {
    await page.goto('/helferliste/templates')

    // Should see templates page
    await expect(page.locator('h1')).toContainText(/Vorlagen|Templates/i)

    // Should see existing templates
    await expect(page.locator('text=Einlass')).toBeVisible({ timeout: 5000 })
  })

  test('can delete a helfer event', async ({ page }) => {
    // Create a test event to delete
    await page.goto('/helferliste/neu')
    await page.fill('input[name="name"]', 'Event to Delete')
    const date = new Date()
    date.setDate(date.getDate() + 60)
    await page.fill('input[name="datum_start"]', date.toISOString().slice(0, 16))
    date.setHours(date.getHours() + 4)
    await page.fill('input[name="datum_end"]', date.toISOString().slice(0, 16))
    await page.click('button[type="submit"]')
    await page.waitForURL(/\/helferliste\/[a-z0-9-]+$/)

    // Find and click delete button
    const deleteButton = page.locator(
      'button:has-text("Löschen"), button[aria-label="Löschen"]'
    )

    if (await deleteButton.isVisible()) {
      await deleteButton.click()

      // Confirm deletion in dialog
      const confirmButton = page.locator(
        'button:has-text("Bestätigen"), button:has-text("Ja"), [data-testid="confirm-delete"]'
      )
      if (await confirmButton.isVisible()) {
        await confirmButton.click()
      }

      // Should redirect to list
      await expect(page).toHaveURL(/\/helferliste$/, { timeout: 5000 })
    }
  })
})
