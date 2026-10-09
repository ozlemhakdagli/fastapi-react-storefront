import { expect, test } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'
import { apiUrl, registerAndLogin } from './support'

const SSD_NAME = 'Samsung T7 500 GB Taşınabilir SSD'

/** The id of the seeded SSD (SKU SEED-006), found through the product search of the API. */
async function seededSsdId(request: APIRequestContext): Promise<number> {
  const response = await request.get(apiUrl('/api/products?q=SEED-006'))
  expect(response.ok()).toBe(true)
  const { items } = (await response.json()) as { items: { id: number; sku: string }[] }
  const ssd = items.find((item) => item.sku === 'SEED-006')
  if (!ssd) throw new Error('SEED-006 is missing: the seed did not run')
  return ssd.id
}

/** The stock of a product, as the API reports it now. */
async function stockOf(request: APIRequestContext, productId: number): Promise<number> {
  const response = await request.get(apiUrl(`/api/products/${productId}`))
  expect(response.ok()).toBe(true)
  return ((await response.json()) as { stock: number }).stock
}

test('a customer buys the SSD, sees the order as new and cancels it', async ({ page, request }) => {
  const productId = await seededSsdId(request)
  const stockBefore = await stockOf(request, productId)

  // The customer registers on the page and lands on the home page, logged in.
  await registerAndLogin(page)

  // The search box finds the SSD, and its page opens.
  await page.getByRole('link', { name: 'Ürünler', exact: true }).click()
  await page.getByRole('searchbox', { name: 'Ürün ara', exact: true }).fill('Samsung T7 500 GB')
  await page.getByRole('button', { name: 'Ara', exact: true }).click()
  await page.getByRole('link', { name: SSD_NAME }).click()
  await expect(page.getByRole('heading', { level: 1, name: SSD_NAME, exact: true })).toBeVisible()

  // One unit goes into the cart, and the cart opens from the header.
  await page.getByRole('button', { name: 'Sepete ekle', exact: true }).click()
  await expect(page.getByText('Ürün sepetinize eklendi.')).toBeVisible()
  await page.getByRole('link', { name: 'Sepetim' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Sepetim', exact: true })).toBeVisible()

  // Checkout: the delivery form, then the confirmation.
  await page.getByRole('link', { name: 'Siparişi tamamla', exact: true }).click()
  await page.getByLabel('Ad soyad', { exact: true }).fill('E2E Müşteri')
  await page.getByLabel('Telefon', { exact: true }).fill('0555 000 00 00')
  await page
    .getByLabel('Teslimat adresi', { exact: true })
    .fill('E2E Mahallesi, Test Sokak No: 1, İstanbul')
  await page.getByRole('button', { name: 'Siparişi onayla', exact: true }).click()

  // The order page opens, and the order has taken one unit of stock.
  await expect(page).toHaveURL(/\/account\/orders\/\d+/)
  const orderId = Number(new URL(page.url()).pathname.split('/').at(-1))
  await expect(
    page.getByRole('heading', { level: 1, name: `Sipariş #${orderId}`, exact: true }),
  ).toBeVisible()
  expect(await stockOf(request, productId)).toBe(stockBefore - 1)

  // "Siparişlerim" lists the order as new.
  await page.getByRole('link', { name: 'Siparişlerim', exact: true }).click()
  const orderRow = page.getByRole('row').filter({ hasText: `Sipariş #${orderId}` })
  await expect(orderRow.getByText('Yeni', { exact: true })).toBeVisible()

  // The order page cancels the order, after the confirmation dialog.
  await orderRow.getByRole('link', { name: `Sipariş #${orderId}`, exact: true }).click()
  await page.getByRole('button', { name: 'Siparişi iptal et', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Sipariş iptal edilsin mi?', exact: true })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('button', { name: 'Evet, iptal et', exact: true }).click()
  // The status shows at the top of the page and again in the progress box, so take the first.
  await expect(page.getByText('İptal Edildi', { exact: true }).first()).toBeVisible()

  // The cancelled order gives the unit back.
  expect(await stockOf(request, productId)).toBe(stockBefore)
})
