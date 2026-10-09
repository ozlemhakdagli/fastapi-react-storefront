import { expect, test } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'
import { apiUrl, loginAsAdmin } from './support'

const SKU = 'SEED-006'
const IMAGE_FIELD = 'Görsel dosyası (JPEG, PNG veya WebP, en fazla 2 MB)'
// A valid 1x1 PNG. The server decodes it and makes a full-size and a card-size WebP copy.
const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

interface ProductImage {
  id: number
  url: string
  thumb_url: string
  position: number
}

interface Product {
  id: number
  name: string
  images: ProductImage[]
}

/** A product as the store API answers it, with its images. */
async function getProduct(request: APIRequestContext, productId: number): Promise<Product> {
  const response = await request.get(apiUrl(`/api/products/${productId}`))
  expect(response.ok()).toBe(true)
  return (await response.json()) as Product
}

test('the admin uploads a photo for a product, and the store card and page show it', async ({
  page,
  request,
}) => {
  // The admin signs in and opens the seeded SSD from the product list.
  await loginAsAdmin(page)
  await page.getByRole('link', { name: 'Yönetim Paneli', exact: true }).click()
  await page.getByRole('navigation').getByRole('link', { name: 'Ürünler', exact: true }).click()
  await page.getByRole('searchbox', { name: 'Ara (ad veya SKU)', exact: true }).fill(SKU)
  await page.getByRole('button', { name: 'Ara', exact: true }).click()
  await page
    .getByRole('row')
    .filter({ hasText: SKU })
    .getByRole('link', { name: 'Düzenle', exact: true })
    .click()
  await expect(
    page.getByRole('heading', { level: 1, name: 'Ürünü düzenle', exact: true }),
  ).toBeVisible()
  const productId = Number(new URL(page.url()).pathname.split('/').at(-1))

  // The photo goes into the Görseller section of the product form.
  await page.getByLabel(IMAGE_FIELD, { exact: true }).setInputFiles({
    name: 'e2e.png',
    mimeType: 'image/png',
    buffer: Buffer.from(PNG_BASE64, 'base64'),
  })
  await page.getByRole('button', { name: 'Görseli yükle', exact: true }).click()
  // The first real photo replaces the placeholder row, so the new photo is the first image.
  await expect(page.getByRole('img', { name: 'Ürün görseli 1', exact: true })).toHaveAttribute(
    'src',
    /-sm\.webp$/,
  )

  // The API answers with the new image. The store card and the product page show it.
  const product = await getProduct(request, productId)
  const uploaded = product.images.find((image) => image.thumb_url.endsWith('-sm.webp'))
  if (!uploaded) throw new Error('the uploaded image is missing from the product')
  await page.goto(`/products?q=${SKU}`)
  await expect(page.getByRole('img', { name: product.name, exact: true })).toHaveAttribute(
    'src',
    uploaded.thumb_url,
  )
  await page.goto(`/products/${productId}`)
  const photo = page.getByRole('img', { name: product.name, exact: true })
  await expect(photo).toBeVisible()
  await expect(photo).toHaveAttribute('src', uploaded.url)
  // The picture has loaded: a broken image has no natural width.
  await expect
    .poll(() => photo.evaluate((image: HTMLImageElement) => image.naturalWidth))
    .toBeGreaterThan(0)
})
