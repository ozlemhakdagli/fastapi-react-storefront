import { Minus, Plus } from 'lucide-react'
import { Link } from 'react-router'
import { type Column, DataTable } from '@/components/DataTable'
import { ErrorNotice } from '@/components/ErrorNotice'
import { Money } from '@/components/Money'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { useCart, useRemoveCartItem, useSetCartQuantity } from '@/features/cart/hooks/useCart'
import { t } from '@/lib/i18n'
import type { CartItem } from '@/lib/types'

// The API accepts quantities 1..99, and never more than the stock (contract section 5).
const MAX_QUANTITY = 99

export default function CartPage() {
  const cart = useCart()
  const setQuantity = useSetCartQuantity()
  const removeItem = useRemoveCartItem()

  if (cart.isPending) return <p className="text-muted-foreground">{t('common.loading')}</p>
  if (cart.isError) return <ErrorNotice error={cart.error} />

  const { items, total } = cart.data
  const hasUnavailable = items.some((item) => !item.available)

  const columns: Column<CartItem>[] = [
    {
      key: 'product',
      header: t('cart.column_product'),
      cell: (item) => (
        <div className="flex items-center gap-3">
          <img
            src={item.image_url}
            alt={item.name}
            className="size-14 shrink-0 rounded-md border object-cover"
          />
          <div className="grid gap-1">
            <span className="font-medium">{item.name}</span>
            {!item.available ? (
              <span className="text-destructive text-sm">{t('cart.unavailable_warning')}</span>
            ) : item.quantity > item.stock ? (
              <span className="text-destructive text-sm">
                {t('cart.stock_warning', { stock: item.stock })}
              </span>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      key: 'unit_price',
      header: t('cart.column_unit_price'),
      cell: (item) => <Money value={item.unit_price} />,
    },
    {
      key: 'quantity',
      header: t('cart.column_quantity'),
      cell: (item) => {
        const busy = setQuantity.isPending && setQuantity.variables?.productId === item.product_id
        const maxQuantity = Math.min(item.stock, MAX_QUANTITY)
        const change = (quantity: number) =>
          setQuantity.mutate({ productId: item.product_id, quantity })
        return (
          <div className="inline-flex items-center gap-2">
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
          </div>
        )
      },
    },
    {
      key: 'line_total',
      header: t('cart.column_line_total'),
      cell: (item) => <Money value={item.line_total} />,
    },
    {
      key: 'actions',
      header: t('common.actions'),
      cell: (item) => (
        <Button
          variant="ghost"
          size="sm"
          disabled={removeItem.isPending && removeItem.variables === item.product_id}
          onClick={() => removeItem.mutate(item.product_id)}
        >
          {t('cart.remove')}
        </Button>
      ),
    },
  ]

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
        <>
          <DataTable
            columns={columns}
            rows={items}
            rowKey={(item) => item.product_id}
            emptyText={t('cart.empty')}
          />
          <div className="flex flex-wrap items-center justify-end gap-4">
            <div className="flex items-baseline gap-2 text-lg">
              <span className="text-muted-foreground">{t('cart.total')}</span>
              <Money value={total} className="font-semibold" />
            </div>
            {hasUnavailable ? (
              <p className="text-destructive text-sm">{t('cart.checkout_blocked')}</p>
            ) : (
              <Button asChild>
                <Link to="/checkout">{t('cart.checkout')}</Link>
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
