import { expect, test } from '@playwright/test'
import type { APIRequestContext, Locator, Page } from '@playwright/test'
import { apiLogin, apiUrl, placeOrder, uniqueEmail } from './support'

const CUSTOMER_PASSWORD = 'E2e-Register-2026!'
const CARGO_COMPANY = 'Yurtiçi Kargo'
const TRACKING_NO = 'E2E-TAKIP-0001'

/** The id of the seeded SSD (SKU SEED-006), found through the product search of the API. */
async function seededSsdId(request: APIRequestContext): Promise<number> {
  const response = await request.get(apiUrl('/api/products?q=SEED-006'))
  expect(response.ok()).toBe(true)
  const { items } = (await response.json()) as { items: { id: number; sku: string }[] }
  const ssd = items.find((item) => item.sku === 'SEED-006')
  if (!ssd) throw new Error('SEED-006 is missing: the seed did not run')
  return ssd.id
}

/** The seeded administrator, from the variables that scripts/e2e.sh sets. */
function adminAccount(): { email: string; password: string } {
  const email = process.env.E2E_ADMIN_EMAIL
  const password = process.env.E2E_ADMIN_PASSWORD
  if (!email || !password) {
    throw new Error('E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD are not set: use scripts/e2e.sh')
  }
  return { email, password }
}

/** Signs in on the login page; the admin link in the header shows that the sign-in worked. */
async function loginAsAdmin(page: Page): Promise<void> {
  const { email, password } = adminAccount()
  await page.goto('/login')
  await page.getByLabel('E-posta', { exact: true }).fill(email)
  await page.getByLabel('Şifre', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Giriş yap', exact: true }).click()
  await expect(page.getByRole('link', { name: 'Yönetim Paneli', exact: true })).toBeVisible()
}

/**
 * The status badge of the order page. The status select lists the same words, but as options,
 * not as spans, so only the badge is found.
 */
function statusBadge(page: Page, status: string): Locator {
  return page.locator('span').filter({ hasText: new RegExp(`^${status}$`) })
}

test('the admin moves a customer order to completed, and the customer sees it', async ({
  browser,
  page,
  request,
}) => {
  // A customer registers and places an order through the API.
  const email = uniqueEmail()
  const registered = await request.post(apiUrl('/api/auth/register'), {
    data: { email, password: CUSTOMER_PASSWORD, full_name: 'E2E Müşteri' },
  })
  expect(registered.status()).toBe(201)
  const token = await apiLogin(request, email, CUSTOMER_PASSWORD)
  const order = await placeOrder(request, token, [
    { product_id: await seededSsdId(request), quantity: 1 },
  ])
  expect(order.status).toBe('new')

  // The admin signs in, and opens the order from the order list of the admin menu.
  await loginAsAdmin(page)
  await page.getByRole('link', { name: 'Yönetim Paneli', exact: true }).click()
  await page.getByRole('navigation').getByRole('link', { name: 'Siparişler', exact: true }).click()
  await page.getByRole('link', { name: `#${order.id}`, exact: true }).click()
  await expect(
    page.getByRole('heading', { level: 1, name: `Sipariş #${order.id}`, exact: true }),
  ).toBeVisible()
  await expect(statusBadge(page, 'Yeni')).toBeVisible()

  // Approve the order.
  await page.getByLabel('Durum', { exact: true }).selectOption({ label: 'Onaylandı' })
  await page.getByRole('button', { name: 'Kaydet', exact: true }).click()
  await expect(statusBadge(page, 'Onaylandı')).toBeVisible()

  // Ship it, with a cargo company and a tracking number.
  await page.getByLabel('Durum', { exact: true }).selectOption({ label: 'Kargoda' })
  await page.getByLabel('Kargo firması', { exact: true }).fill(CARGO_COMPANY)
  await page.getByLabel('Takip numarası', { exact: true }).fill(TRACKING_NO)
  await page.getByRole('button', { name: 'Kaydet', exact: true }).click()
  await expect(statusBadge(page, 'Kargoda')).toBeVisible()

  // Complete the order.
  await page.getByLabel('Durum', { exact: true }).selectOption({ label: 'Tamamlandı' })
  await page.getByRole('button', { name: 'Kaydet', exact: true }).click()
  await expect(statusBadge(page, 'Tamamlandı')).toBeVisible()

  // The customer, signed in in a second browser context, sees the completed order.
  const customerContext = await browser.newContext({
    baseURL: process.env.E2E_BASE_URL,
    locale: 'tr-TR',
  })
  const customer = await customerContext.newPage()
  await customer.goto('/login')
  await customer.getByLabel('E-posta', { exact: true }).fill(email)
  await customer.getByLabel('Şifre', { exact: true }).fill(CUSTOMER_PASSWORD)
  await customer.getByRole('button', { name: 'Giriş yap', exact: true }).click()
  await expect(customer.getByRole('link', { name: 'Hesabım', exact: true })).toBeVisible()
  await customer.goto(`/account/orders/${order.id}`)
  const progress = customer.getByRole('list', { name: 'Sipariş durumu', exact: true })
  await expect(progress.locator('[aria-current="step"]')).toHaveText('Tamamlandı')
  await expect(customer.getByText(TRACKING_NO, { exact: true })).toBeVisible()
  await customerContext.close()
})
