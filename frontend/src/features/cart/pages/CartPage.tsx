import { Minus, Plus } from 'lucide-react'
import { Link } from 'react-router'
import { ErrorNotice } from '@/components/ErrorNotice'
import { LoadingNotice } from '@/components/LoadingNotice'
import { Money } from '@/components/Money'
import { PageHeader } from '@/components/PageHeader'
import { ProductImage } from '@/components/ProductImage'
import { Button } from '@/components/ui/button'
import { useCart, useRemoveCartItem, useSetCartQuantity } from '@/features/cart/hooks/useCart'
import { t } from '@/lib/i18n'
import { useDocumentTitle } from '@/features/pages/hooks/useDocumentTitle'

// The API accepts quantities 1..99, and never more than the stock (backend/app/schemas/cart.py).
const MAX_QUANTITY = 99

export default function CartPage() {
  useDocumentTitle(t('cart.title'))
  const cart = useCart()
  const setQuantity = useSetCartQuantity()
  const removeItem = useRemoveCartItem()

  if (cart.isPending) return <LoadingNotice />
  if (cart.isError) return <ErrorNotice error={cart.error} />

  const { items, total } = cart.data
  const hasUnavailable = items.some((item) => !item.available)

  return (
    <div className="grid gap-6">
      <PageHeader title={t('cart.title')} />
      <ErrorNotice error={setQuantity.error ?? removeItem.error} />
      {items.length === 0 ? (
        <div className="grid justify-items-center gap-4 py-12 text-center">
          <p className="text-muted-foreground">{t('cart.empty')}</p>
          <Button variant="outline" asChild>
            <Link to="/products">{t('cart.continue_shopping')}</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <ul aria-label={t('cart.column_product')} className="grid gap-3">
            {items.map((item) => {
              const busy =
                setQuantity.isPending && setQuantity.variables?.productId === item.product_id
              const maxQuantity = Math.min(item.stock, MAX_QUANTITY)
              const change = (quantity: number) =>
                setQuantity.mutate({ productId: item.product_id, quantity })
              return (
                <li
                  key={item.product_id}
                  className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4 rounded-xl border bg-card p-4 xl:grid-cols-[auto_minmax(0,1fr)_auto] xl:items-center"
                >
                  <ProductImage
                    name={item.name}
                    imageUrl={item.image_url}
                    className="size-20 shrink-0 rounded-lg"
                  />
                  <div className="grid min-w-0 justify-items-start gap-1">
                    <span className="font-medium wrap-break-word">{item.name}</span>
                    {!item.available ? (
                      <span className="text-destructive text-sm">
                        {t('cart.unavailable_warning')}
                      </span>
                    ) : item.quantity > item.stock ? (
                      <span className="text-destructive text-sm">
                        {t('cart.stock_warning', { stock: item.stock })}
                      </span>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={removeItem.isPending && removeItem.variables === item.product_id}
                      onClick={() => removeItem.mutate(item.product_id)}
                    >
                      {t('cart.remove')}
                    </Button>
                  </div>
                  <dl className="col-span-2 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-t pt-4 xl:col-span-1 xl:justify-end xl:border-t-0 xl:pt-0">
                    <div className="grid gap-1">
                      <dt className="text-muted-foreground text-xs">
                        {t('cart.column_quantity')}
                      </dt>
                      <dd className="inline-flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon-sm"
                          aria-label={t('cart.decrease')}
                          disabled={busy || item.quantity <= 1}
                          onClick={() => change(item.quantity - 1)}
                        >
                          <Minus />
                        </Button>
                        <span className="w-8 text-center tabular-nums">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon-sm"
                          aria-label={t('cart.increase')}
                          disabled={busy || item.quantity >= maxQuantity}
                          onClick={() => change(item.quantity + 1)}
                        >
                          <Plus />
                        </Button>
                      </dd>
                    </div>
                    <div className="grid justify-items-end gap-1">
                      <dt className="text-muted-foreground text-xs">
                        {t('cart.column_unit_price')}
                      </dt>
                      <dd>
                        <Money value={item.unit_price} />
                      </dd>
                    </div>
                    <div className="grid justify-items-end gap-1">
                      <dt className="text-muted-foreground text-xs">
                        {t('cart.column_line_total')}
                      </dt>
                      <dd>
                        <Money value={item.line_total} className="font-semibold" />
                      </dd>
                    </div>
                  </dl>
                </li>
              )
            })}
          </ul>
          <aside className="grid gap-4 self-start rounded-xl border bg-card p-5 lg:sticky lg:top-24">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-muted-foreground">{t('cart.total')}</span>
              <Money value={total} className="text-primary text-xl font-semibold" />
            </div>
            {hasUnavailable ? (
              <p className="text-destructive text-sm">{t('cart.checkout_blocked')}</p>
            ) : (
              <Button asChild className="w-full">
                <Link to="/checkout">{t('cart.checkout')}</Link>
              </Button>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}
