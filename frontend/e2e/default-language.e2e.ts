import { expect, test } from '@playwright/test'

test.use({ storageState: { cookies: [], origins: [] } })

test('starts in English by default and switches to Turkish on click', async ({ page }) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', { level: 1, name: 'Everything you need in one place' }),
  ).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')

  await page.getByRole('button', { name: 'Switch language: Türkçe' }).click()

  await expect(
    page.getByRole('heading', { level: 1, name: 'Aradığınız her şey tek yerde' }),
  ).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'tr')
})
