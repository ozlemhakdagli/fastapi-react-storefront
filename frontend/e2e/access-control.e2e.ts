import { expect, test } from '@playwright/test'
import {
  apiLogin,
  apiUrl,
  loginAsAdmin,
  placeOrder,
  registerAndLogin,
  registerCustomer,
  seededSsd,
} from './support'

test('an anonymous visitor who opens the cart is sent to the login page', async ({ page }) => {
  await page.goto('/cart')
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('heading', { level: 1, name: 'Giriş Yap' })).toBeVisible()
})

test('a customer who opens the admin area is sent to the home page', async ({ page }) => {
  await registerAndLogin(page)
  await page.goto('/admin')
  await expect(page).toHaveURL(/\/$/)
  await expect(
    page.getByRole('heading', { level: 1, name: 'Aradığınız her şey tek yerde' }),
  ).toBeVisible()
})

test('the admin logs in and sees the dashboard', async ({ page }) => {
  await loginAsAdmin(page)
  await page.getByRole('link', { name: 'Yönetim Paneli', exact: true }).click()
  await expect(
    page.getByRole('heading', { level: 1, name: 'Gösterge Paneli', exact: true }),
  ).toBeVisible()
})

test('a customer cannot read the order of another customer', async ({ request }) => {
  // The buyer orders the SSD; another customer then asks for that order with their own token.
  const product = await seededSsd(request)

  const buyer = await registerCustomer(request)
  const buyerToken = await apiLogin(request, buyer.email, buyer.password)
  const order = await placeOrder(request, buyerToken, [{ product_id: product.id, quantity: 1 }])

  const other = await registerCustomer(request)
  const otherToken = await apiLogin(request, other.email, other.password)

  // The buyer can read the order (so the 404 below is about the owner, not a broken route).
  const own = await request.get(apiUrl(`/api/orders/${order.id}`), {
    headers: { Authorization: `Bearer ${buyerToken}` },
  })
  expect(own.status()).toBe(200)

  // Another customer gets 404: the order is hidden from them.
  const foreign = await request.get(apiUrl(`/api/orders/${order.id}`), {
    headers: { Authorization: `Bearer ${otherToken}` },
  })
  expect(foreign.status()).toBe(404)
})

test('the API documentation is off and API answers carry the security headers', async ({
  request,
}) => {
  const docs = await request.get(apiUrl('/api/docs'))
  expect(docs.status()).toBe(404)

  // Headers are read in lower case, as the HTTP client returns them.
  const health = await request.get(apiUrl('/api/health'))
  expect(health.headers()['x-frame-options']).toBe('DENY')
  expect(health.headers()['cache-control']).toBe('no-store')
})
