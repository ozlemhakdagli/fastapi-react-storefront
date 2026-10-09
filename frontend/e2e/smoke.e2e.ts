import { expect, test } from '@playwright/test'
import { apiUrl } from './support'

test('the home page, the catalogue and the API health answer', async ({ page, request }) => {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { level: 1, name: 'Aradığınız her şey tek yerde' }),
  ).toBeVisible()

  await page.goto('/products')
  await expect(page.getByRole('heading', { level: 3 }).first()).toBeVisible()

  const health = await request.get(apiUrl('/api/health'))
  expect(health.ok()).toBe(true)
  expect(await health.json()).toMatchObject({ status: 'ok' })
})
