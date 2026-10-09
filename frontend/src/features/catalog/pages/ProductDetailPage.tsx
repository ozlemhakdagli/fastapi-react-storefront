import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { ShoppingCart } from 'lucide-react'
import { LoadingNotice } from '@/components/LoadingNotice'
import { ErrorNotice } from '@/components/ErrorNotice'
import { FormField } from '@/components/FormField'
import { Money } from '@/components/Money'
import { ProductImage } from '@/components/ProductImage'
import { StockBadge } from '@/components/StockBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/features/auth/AuthContext'
import { ProductComments } from '@/features/catalog/components/ProductComments'
import { useAddToCart, useProduct } from '@/features/catalog/hooks/useProduct'
import { ApiError } from '@/lib/api'
import { t } from '@/lib/i18n'

// The API holds at most 99 units in a cart line.
const MAX_QUANTITY = 99

// Soft chip for the brand and category links.
const CHIP_CLASS =
  'bg-secondary text-secondary-foreground hover:bg-accent focus-visible:ring-ring focus-visible:ring-3 inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors outline-none'

/** Turns the typed quantity into a whole number in [1, max]; text that is not a number becomes 1. */
function clampQuantity(text: string, max: number): number {
  const value = Math.trunc(Number(text))
  if (!Number.isFinite(value) || value < 1) return 1
  return Math.min(value, max)
}

export default function ProductDetailPage() {
  const { id } = useParams()
  const productId = Number(id)
  if (!Number.isInteger(productId) || productId < 1) {
    return <ErrorNotice error={new ApiError(404, 'not_found')} />
  }
  // Keyed by id so that the gallery and the quantity reset when the route changes product.
  return <ProductContent key={productId} productId={productId} />
}

function ProductContent({ productId }: { productId: number }) {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const product = useProduct(productId)
  const addToCart = useAddToCart()
  const [activeImage, setActiveImage] = useState(0)
  const [quantityText, setQuantityText] = useState('1')

  if (product.error) return <ErrorNotice error={product.error} />
  if (!product.data) return <LoadingNotice />

  const item = product.data
  const gallery =
    item.images.length > 0 ? item.images : [{ id: 0, url: item.image_url, position: 0 }]
  const image = gallery[activeImage] ?? gallery[0]
  const outOfStock = item.stock <= 0
  const maxQuantity = Math.min(item.stock, MAX_QUANTITY)
  const quantity = clampQuantity(quantityText, maxQuantity)

  function handleAddToCart() {
    if (!user) {
      // Same state shape as the route guards, so the login page can send the guest back here.
      navigate('/login', { state: { from: location } })
      return
    }
    addToCart.mutate({ productId: item.id, quantity })
  }

  return (
    <div className="grid gap-10">
      <div className="grid gap-8 md:grid-cols-2">
        <div className="grid content-start gap-3">
          <ProductImage
            name={item.name}
            imageUrl={image.url}
            category={item.category}
            className="aspect-square w-full rounded-xl"
          />
          {gallery.length > 1 ? (
            <div role="group" aria-label={t('catalog.gallery_label')} className="flex flex-wrap gap-2">
              {gallery.map((thumbnail, index) => (
                <button
                  key={thumbnail.id}
                  type="button"
                  aria-label={t('catalog.thumbnail', { number: index + 1 })}
                  aria-pressed={index === activeImage}
                  onClick={() => setActiveImage(index)}
                  className={`size-16 overflow-hidden rounded-lg ring-2 ${
                    index === activeImage ? 'ring-foreground' : 'ring-transparent'
                  }`}
                >
                  <img src={thumbnail.url} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="grid content-start gap-5">
          <dl className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <div className="flex items-center gap-2">
              <dt className="text-muted-foreground">{t('catalog.brand_label')}</dt>
              <dd>
                {item.brand ? (
                  <Link to={`/products?brand_id=${item.brand.id}`} className={CHIP_CLASS}>
                    {item.brand.name}
                  </Link>
                ) : null}
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <dt className="text-muted-foreground">{t('catalog.category_label')}</dt>
              <dd>
                {item.category ? (
                  <Link to={`/products?category_id=${item.category.id}`} className={CHIP_CLASS}>
                    {item.category.name}
                  </Link>
                ) : null}
              </dd>
            </div>
          </dl>
          <h1 className="text-3xl font-semibold tracking-tight">{item.name}</h1>
          <p className="text-muted-foreground">{item.short_description}</p>
          <div className="grid justify-items-start gap-2">
            <Money value={item.price} className="text-3xl font-semibold text-primary" />
            <StockBadge stock={item.stock} />
          </div>
          <p className="text-muted-foreground text-sm">{t('catalog.sku', { sku: item.sku })}</p>

          <div className="flex flex-wrap items-end gap-3">
            <FormField label={t('catalog.quantity')} htmlFor="quantity">
              <Input
                id="quantity"
                type="number"
                inputMode="numeric"
                min={1}
                max={maxQuantity}
                disabled={outOfStock}
                value={quantityText}
                onChange={(event) => setQuantityText(event.target.value)}
                onBlur={() => setQuantityText(String(quantity))}
                className="w-24"
              />
            </FormField>
            <Button
              size="lg"
              disabled={outOfStock || loading || addToCart.isPending}
              onClick={handleAddToCart}
            >
              <ShoppingCart aria-hidden="true" />
              {addToCart.isPending ? t('catalog.adding_to_cart') : t('catalog.add_to_cart')}
            </Button>
          </div>
          {addToCart.isSuccess ? (
            <p role="status" className="text-sm">
              {t('catalog.added_to_cart')}
            </p>
          ) : null}
          <ErrorNotice error={addToCart.error} />
        </div>
      </div>

      {item.description.trim() ? (
        <section className="grid gap-2 rounded-xl border bg-card p-6">
          <h2 className="text-xl font-semibold">{t('catalog.description_title')}</h2>
          <p className="text-sm leading-6 whitespace-pre-line">{item.description}</p>
        </section>
      ) : null}

      <ProductComments productId={item.id} />
    </div>
  )
}
