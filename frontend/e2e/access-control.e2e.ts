import { expect, test, type APIRequestContext } from '@playwright/test'
import { apiLogin, apiUrl, placeOrder, registerAndLogin, uniqueEmail } from './support'

// The seeded Samsung T7 500 GB SSD, found by its SKU.
const SSD_SKU = 'SEED-006'

/** A setting that scripts/e2e.sh puts in the environment. */
function setting(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set: run the browser tests with scripts/e2e.sh`)
  return value
}

/** Registers a customer through the API and returns the account. */
async function registerCustomer(request: APIRequestContext) {
  const account = { email: uniqueEmail(), password: 'E2e-Access-2026!' }
  const response = await request.post(apiUrl('/api/auth/register'), {
    data: { ...account, full_name: 'E2E Müşteri' },
  })
  expect(response.status()).toBe(201)
  return account
}

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
  await page.goto('/login')
  await page.getByLabel('E-posta', { exact: true }).fill(setting('E2E_ADMIN_EMAIL'))
  await page.getByLabel('Şifre', { exact: true }).fill(setting('E2E_ADMIN_PASSWORD'))
  await page.getByRole('button', { name: 'Giriş yap', exact: true }).click()
  await page.getByRole('link', { name: 'Yönetim Paneli', exact: true }).click()
  await expect(
    page.getByRole('heading', { level: 1, name: 'Gösterge Paneli', exact: true }),
  ).toBeVisible()
})

test('a customer cannot read the order of another customer', async ({ request }) => {
  // The buyer orders the SSD; another customer then asks for that order with their own token.
  const productsResponse = await request.get(apiUrl(`/api/products?q=${SSD_SKU}`))
  const products = (await productsResponse.json()) as { items: { id: number; sku: string }[] }
  const product = products.items.find((item) => item.sku === SSD_SKU)
  if (!product) {
    throw new Error(`${SSD_SKU} is missing: run the browser tests with scripts/e2e.sh`)
  }

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
