import { test, expect } from '@playwright/test'

test.describe('GTA 6 News Hub – Smoke', () => {
  // Onboarding-/Consent-Overlays vor jedem Test deaktivieren.
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        'gta6hub:preferences',
        JSON.stringify({ onboarded: true, consent: false }),
      )
    })
  })

  test('Startseite zeigt Hero und Feed', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /Grand Theft Auto VI/i })).toBeVisible()
    await expect(page.locator('.card').first()).toBeVisible()
  })

  test('Suche filtert die Artikel', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('searchbox').fill('soundtrack')
    await expect(page.getByText(/Radiosender-Partner/i)).toBeVisible()
  })

  test('Artikel öffnen und Lesezeichen setzen', async ({ page }) => {
    await page.goto('/')
    await page.locator('.card__link').first().click()
    await expect(page).toHaveURL(/\/news\//)
    await expect(page.locator('.article__title')).toBeVisible()
    await page.getByRole('button', { name: /Als Lesezeichen merken/i }).click()
    await expect(page.getByRole('button', { name: /Lesezeichen entfernen/i })).toBeVisible()
  })

  test('Theme-Toggle wechselt auf hell', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /Theme wechseln/i }).click()
    await expect(page.locator('html')).toHaveClass(/light/)
  })
})
