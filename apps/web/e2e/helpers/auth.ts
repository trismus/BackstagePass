/**
 * E2E Test Helpers for Authentication
 */

import { Page, expect } from '@playwright/test'

export interface TestUser {
  email: string
  password: string
  role: string
}

// Test users - these should exist in your test database
export const testUsers = {
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || 'admin@test.local',
    password: process.env.TEST_ADMIN_PASSWORD || 'testpassword123',
    role: 'ADMIN',
  },
  vorstand: {
    email: process.env.TEST_VORSTAND_EMAIL || 'vorstand@test.local',
    password: process.env.TEST_VORSTAND_PASSWORD || 'testpassword123',
    role: 'VORSTAND',
  },
  mitglied: {
    email: process.env.TEST_MITGLIED_EMAIL || 'mitglied@test.local',
    password: process.env.TEST_MITGLIED_PASSWORD || 'testpassword123',
    role: 'MITGLIED_AKTIV',
  },
  helfer: {
    email: process.env.TEST_HELFER_EMAIL || 'helfer@test.local',
    password: process.env.TEST_HELFER_PASSWORD || 'testpassword123',
    role: 'HELFER',
  },
}

/**
 * Login as a specific user
 */
export async function login(page: Page, user: TestUser): Promise<void> {
  await page.goto('/login')

  // Fill login form
  await page.fill('input[name="email"]', user.email)
  await page.fill('input[name="password"]', user.password)

  // Submit
  await page.click('button[type="submit"]')

  // Wait for redirect to dashboard
  await page.waitForURL(/\/(dashboard|mein-bereich)/, { timeout: 10000 })
}

/**
 * Logout the current user
 */
export async function logout(page: Page): Promise<void> {
  // Click user menu or logout button
  const logoutButton = page.locator('button:has-text("Abmelden"), a:has-text("Abmelden")')
  if (await logoutButton.isVisible()) {
    await logoutButton.click()
  } else {
    // Try navigating directly
    await page.goto('/logout')
  }

  // Wait for redirect to login
  await page.waitForURL(/\/login/, { timeout: 5000 })
}

/**
 * Check if user is logged in
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  try {
    await page.goto('/dashboard')
    await page.waitForURL(/\/(dashboard|login)/, { timeout: 5000 })
    return !page.url().includes('/login')
  } catch {
    return false
  }
}

/**
 * Create a test helper event via UI (admin only)
 */
export async function createTestHelferEvent(
  page: Page,
  data: {
    name: string
    datum: string
    ort?: string
  }
): Promise<string> {
  await page.goto('/helferliste/neu')

  await page.fill('input[name="name"]', data.name)
  await page.fill('input[name="datum_start"]', data.datum)
  if (data.ort) {
    await page.fill('input[name="ort"]', data.ort)
  }

  await page.click('button[type="submit"]')

  // Wait for redirect to event page
  await page.waitForURL(/\/helferliste\/[a-z0-9-]+$/, { timeout: 5000 })

  // Extract event ID from URL
  const url = page.url()
  const eventId = url.split('/').pop() || ''
  return eventId
}
