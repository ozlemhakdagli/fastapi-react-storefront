import { randomUUID } from 'node:crypto'
import { expect } from '@playwright/test'
import type { APIRequestContext, APIResponse, Page } from '@playwright/test'

export interface Account {
  email: string
  password: string
}

export interface CartLine {
  product_id: number
  quantity: number
}

export interface Order {
  id: number
  status: string
}

export type OrderStatus = 'new' | 'approved' | 'rejected' | 'cancelled' | 'shipped' | 'completed'

// The variables that scripts/e2e.sh sets for the tests.
function env(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set: run the browser tests with scripts/e2e.sh`)
  return value
}

/** The URL of an API path on the throw-away API, for example apiUrl('/api/health'). */
export function apiUrl(path: string): string {
  return `${env('E2E_API_URL')}${path}`
}

/** A new e-mail address, so that no test shares a user with another test or an earlier run. */
export function uniqueEmail(): string {
  return `e2e.${randomUUID()}@example.com`
}

/** The body of a successful answer; any other answer becomes an error that carries its text. */
async function json<T>(response: APIResponse): Promise<T> {
  if (!response.ok()) {
    throw new Error(`${response.url()} answered ${response.status()}: ${await response.text()}`)
  }
  return (await response.json()) as T
}

/** Registers a new customer on the register page; the page ends on the home page, logged in. */
export async function registerAndLogin(page: Page): Promise<Account> {
  const account = { email: uniqueEmail(), password: 'E2e-Register-2026!' }
  await page.goto('/register')
  await page.getByLabel('E-posta', { exact: true }).fill(account.email)
  await page.getByLabel('Şifre', { exact: true }).fill(account.password)
  await page.getByLabel('Şifre (tekrar)', { exact: true }).fill(account.password)
  await page.getByLabel('Ad soyad', { exact: true }).fill('E2E Müşteri')
  await page.getByRole('button', { name: 'Kayıt ol', exact: true }).click()
  await page.waitForURL((url) => url.pathname === '/')
  return account
}

/** Logs in through the API and returns the access token. */
export async function apiLogin(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<string> {
  const login = await json<{ access_token: string }>(
    await request.post(apiUrl('/api/auth/login'), { data: { email, password } }),
  )
  return login.access_token
}

/** The token of the seeded administrator. */
export function adminToken(request: APIRequestContext): Promise<string> {
  return apiLogin(request, env('E2E_ADMIN_EMAIL'), env('E2E_ADMIN_PASSWORD'))
}

/** Puts the lines into the cart of the token's user and checks out; returns the new order. */
export async function placeOrder(
  request: APIRequestContext,
  token: string,
  items: CartLine[],
): Promise<Order> {
  const headers = { Authorization: `Bearer ${token}` }
  for (const item of items) {
    await json(await request.post(apiUrl('/api/cart/items'), { headers, data: item }))
  }
  return json<Order>(
    await request.post(apiUrl('/api/orders'), {
      headers,
      data: {
        ship_name: 'E2E Alıcı',
        ship_phone: '0555 000 00 00',
        ship_address: 'E2E Mahallesi, Test Sokak No: 1, İstanbul',
      },
    }),
  )
}

/** Moves an order to a new status through the admin API; the status machine refuses a wrong step. */
export async function advanceOrder(
  request: APIRequestContext,
  token: string,
  orderId: number,
  status: OrderStatus,
): Promise<Order> {
  return json<Order>(
    await request.patch(apiUrl(`/api/admin/orders/${orderId}`), {
      headers: { Authorization: `Bearer ${token}` },
      data: { status },
    }),
  )
}

/** A customer registered through the API (the page is not involved). */
export async function registerCustomer(request: APIRequestContext): Promise<Account> {
  const account = { email: uniqueEmail(), password: 'E2e-Customer-2026!' }
  const response = await request.post(apiUrl('/api/auth/register'), {
    data: { ...account, full_name: 'E2E Müşteri' },
  })
  expect(response.status()).toBe(201)
  return account
}

/** The seeded Samsung T7 500 GB SSD (SKU SEED-006), as the catalogue lists it. */
export async function seededSsd(
  request: APIRequestContext,
): Promise<{ id: number; sku: string; name: string; price: string }> {
  const response = await request.get(apiUrl('/api/products?q=SEED-006'))
  expect(response.ok()).toBe(true)
  const { items } = (await response.json()) as {
    items: { id: number; sku: string; name: string; price: string }[]
  }
  const ssd = items.find((item) => item.sku === 'SEED-006')
  if (!ssd) throw new Error('SEED-006 is missing: run the browser tests with scripts/e2e.sh')
  return ssd
}

/** Signs the seeded administrator in on the login page; the admin link shows that it worked. */
export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('E-posta', { exact: true }).fill(env('E2E_ADMIN_EMAIL'))
  await page.getByLabel('Şifre', { exact: true }).fill(env('E2E_ADMIN_PASSWORD'))
  await page.getByRole('button', { name: 'Giriş yap', exact: true }).click()
  await expect(page.getByRole('link', { name: 'Yönetim Paneli', exact: true })).toBeVisible()
}
