import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { apiLogin, apiUrl, loginAsAdmin, placeOrder, seededSsd, uniqueEmail } from './support'

const CUSTOMER_PASSWORD = 'E2e-Register-2026!'
const CARGO_COMPANY = 'Example Cargo'
const TRACKING_NO = 'E2E-TAKIP-0001'

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
    data: { email, password: CUSTOMER_PASSWORD, full_name: 'E2E Customer' },
  })
  expect(registered.status()).toBe(201)
  const token = await apiLogin(request, email, CUSTOMER_PASSWORD)
  const order = await placeOrder(request, token, [
    { product_id: (await seededSsd(request)).id, quantity: 1 },
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
