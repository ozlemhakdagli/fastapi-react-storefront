import { expect, test } from '@playwright/test'
import {
  adminToken,
  advanceOrder,
  apiLogin,
  apiUrl,
  placeOrder,
  registerAndLogin,
  registerCustomer,
  seededSsd,
} from './support'

/** A price the way the shop shows it, for example $1,899.90 with the dollar sign. */
function formatTry(price: string): string {
  const money = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'USD' })
  return money.format(Number(price))
}

test('a buyer rates the product, comments, adds a favourite and reads the invoice', async ({
  page,
  request,
}) => {
  // Arrange through the API: the customer orders one SSD and the admin completes the order.
  const account = await registerCustomer(request)
  const product = await seededSsd(request)
  const token = await apiLogin(request, account.email, account.password)
  const order = await placeOrder(request, token, [{ product_id: product.id, quantity: 1 }])
  const admin = await adminToken(request)
  await advanceOrder(request, admin, order.id, 'approved')
  await advanceOrder(request, admin, order.id, 'shipped')
  await advanceOrder(request, admin, order.id, 'completed')

  // The customer logs in through the login page.
  await page.goto('/login')
  await page.getByLabel('E-posta', { exact: true }).fill(account.email)
  await page.getByLabel('Şifre', { exact: true }).fill(account.password)
  await page.getByRole('button', { name: 'Giriş yap', exact: true }).click()
  await expect(page.getByRole('link', { name: 'Hesabım', exact: true })).toBeVisible()

  // Rating: the customer, who bought the product, gives four stars.
  await page.goto(`/products/${product.id}`)
  const ratingGroup = page.getByRole('radiogroup', { name: 'Puanınız' })
  await expect(ratingGroup.getByRole('radio')).toHaveCount(5)
  await ratingGroup.getByRole('radio', { name: '4 yıldız', exact: true }).click()
  await expect(ratingGroup.getByRole('radio', { name: '4 yıldız', exact: true })).toBeChecked()
  // The average under the title is now the one rating, four stars.
  await expect(
    page.getByRole('img', { name: '5 üzerinden 4,0 puan, 1 değerlendirme', exact: true }),
  ).toBeVisible()

  // Comment: the customer's own comment shows the four stars as well.
  const body = 'Delivered quickly, very happy with it.'
  await page.getByLabel('Yorumunuz veya sorunuz').fill(body)
  await page.getByRole('button', { name: 'Yorum yap', exact: true }).click()
  const comment = page.getByRole('listitem').filter({ hasText: body })
  const commentStars = comment.getByRole('img', { name: '5 üzerinden 4,0 puan', exact: true })
  await expect(commentStars).toBeVisible()

  // Favourite: the heart switches to "remove", and the product is on the favourites page.
  await page.getByRole('button', { name: 'favorilere ekle' }).click()
  await expect(page.getByRole('button', { name: 'favorilerden çıkar' })).toBeVisible()
  await page.getByRole('link', { name: 'Hesabım', exact: true }).click()
  await page.getByRole('link', { name: 'Favorilerim', exact: true }).click()
  await expect(
    page.getByRole('heading', { level: 3, name: product.name, exact: true }),
  ).toBeVisible()

  // Invoice: the completed order opens its invoice view, with the seller, the line and the total.
  await page.getByRole('link', { name: 'Siparişlerim', exact: true }).click()
  await page.getByRole('link', { name: `Sipariş #${order.id}`, exact: true }).click()
  await page.getByRole('link', { name: 'Fatura görünümü', exact: true }).click()

  const siteResponse = await request.get(apiUrl('/api/site'))
  const site = (await siteResponse.json()) as { site_name: string }
  const invoice = page.getByRole('article')
  await expect(invoice.getByRole('heading', { name: 'Satıcı', exact: true })).toBeVisible()
  await expect(invoice).toContainText(site.site_name)
  await expect(invoice.getByRole('cell', { name: product.name, exact: true })).toBeVisible()
  // One unit was ordered, so the total is the price of that unit.
  await expect(invoice.getByRole('row', { name: /Toplam/ })).toContainText(
    formatTry(product.price),
  )
  await expect(
    page.getByText('Bu belge bilgi amaçlıdır; resmi fatura yerine geçmez.'),
  ).toBeVisible()
  // The print button is there; it is not clicked, because printing opens the browser dialog.
  await expect(page.getByRole('button', { name: 'Yazdır', exact: true })).toBeVisible()
})

test('a customer without a purchase sees the hint, can still comment and cannot rate', async ({
  page,
  request,
}) => {
  // A second customer, who has no order, registers in the browser.
  const product = await seededSsd(request)
  const account = await registerAndLogin(page)

  await page.goto(`/products/${product.id}`)
  await expect(
    page.getByText('Puan vermek için bu ürünü satın almış olmalısınız.'),
  ).toBeVisible()
  await expect(page.getByRole('radiogroup', { name: 'Puanınız' })).toHaveCount(0)

  // Questions are open to every logged-in customer.
  const question = 'Does this drive work with a PlayStation?'
  await page.getByLabel('Yorumunuz veya sorunuz').fill(question)
  await page.getByRole('button', { name: 'Yorum yap', exact: true }).click()
  await expect(page.getByRole('listitem').filter({ hasText: question })).toBeVisible()

  // The API refuses a rating from a customer who has not bought the product.
  const token = await apiLogin(request, account.email, account.password)
  const response = await request.put(apiUrl(`/api/me/ratings/${product.id}`), {
    headers: { Authorization: `Bearer ${token}` },
    data: { rating: 5 },
  })
  expect(response.status()).toBe(403)
  expect(await response.json()).toMatchObject({ detail: 'purchase_required' })
})
