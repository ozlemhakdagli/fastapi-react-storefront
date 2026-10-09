import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { ErrorNotice } from '@/components/ErrorNotice'
import { FormField } from '@/components/FormField'
import { Money } from '@/components/Money'
import { PageHeader } from '@/components/PageHeader'
import { ProductImage } from '@/components/ProductImage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/features/auth/AuthContext'
import { useCart } from '@/features/cart/hooks/useCart'
import { type ShippingDetails, useCheckout } from '@/features/cart/hooks/useCheckout'
import { ApiError } from '@/lib/api'
import { t } from '@/lib/i18n'

type Field = keyof ShippingDetails
type FieldErrors = Partial<Record<Field, string>>

const FIELDS: Field[] = ['ship_name', 'ship_phone', 'ship_address']

// Same limits as the orders table columns (backend/migrations/0001_init.sql).
const MAX_LENGTH: Record<Field, number> = { ship_name: 100, ship_phone: 30, ship_address: 500 }

function validate(values: ShippingDetails): FieldErrors {
  const errors: FieldErrors = {}
  for (const field of FIELDS) {
    if (values[field].trim() === '') errors[field] = t('cart.checkout_required')
  }
  return errors
}

export default function CheckoutPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const checkout = useCheckout()
  // The cart only feeds the summary. The server still checks it when the order is placed.
  const cart = useCart()
  const [values, setValues] = useState<ShippingDetails>(() => ({
    ship_name: user?.full_name ?? '',
    ship_phone: user?.phone ?? '',
    ship_address: user?.address ?? '',
  }))
  // Field errors appear after the first submit attempt, then follow the inputs.
  const [attempted, setAttempted] = useState(false)

  const errors: FieldErrors = attempted ? validate(values) : {}
  const stockProblem =
    checkout.error instanceof ApiError &&
    (checkout.error.code === 'insufficient_stock' || checkout.error.code === 'product_unavailable')
  // No summary while the cart loads, when it failed, or when it is empty.
  const summary = cart.data && cart.data.items.length > 0 ? cart.data : null

  function update(field: Field, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (checkout.isPending) return // a second submit must not place a second order
    setAttempted(true)
    if (Object.keys(validate(values)).length > 0) return
    checkout.mutate(
      {
        ship_name: values.ship_name.trim(),
        ship_phone: values.ship_phone.trim(),
        ship_address: values.ship_address.trim(),
      },
      {
        onSuccess: (order) => {
          navigate(`/account/orders/${order.id}?placed=1`, { replace: true })
        },
        onError: (error) => {
          // The server has no cart to check out (for example, it was emptied in another tab).
          if (error instanceof ApiError && error.code === 'empty_cart') {
            navigate('/cart', { replace: true })
          }
        },
      },
    )
  }

  return (
    <div className="mx-auto grid max-w-xl gap-6 lg:max-w-5xl">
      <PageHeader title={t('cart.checkout_title')} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        {/* noValidate: the messages come from our own validation, not from the browser. */}
        <form
          className="grid gap-4 rounded-xl border bg-card p-5 sm:p-6"
          noValidate
          onSubmit={handleSubmit}
        >
          <FormField label={t('cart.checkout_name')} htmlFor="ship_name" error={errors.ship_name}>
            <Input
              id="ship_name"
              name="ship_name"
              autoComplete="name"
              required
              maxLength={MAX_LENGTH.ship_name}
              value={values.ship_name}
              onChange={(event) => update('ship_name', event.target.value)}
            />
          </FormField>
          <FormField
            label={t('cart.checkout_phone')}
            htmlFor="ship_phone"
            error={errors.ship_phone}
          >
            <Input
              id="ship_phone"
              name="ship_phone"
              type="tel"
              autoComplete="tel"
              required
              maxLength={MAX_LENGTH.ship_phone}
              value={values.ship_phone}
              onChange={(event) => update('ship_phone', event.target.value)}
            />
          </FormField>
          <FormField
            label={t('cart.checkout_address')}
            htmlFor="ship_address"
            error={errors.ship_address}
          >
            <Textarea
              id="ship_address"
              name="ship_address"
              autoComplete="street-address"
              required
              rows={3}
              maxLength={MAX_LENGTH.ship_address}
              value={values.ship_address}
              onChange={(event) => update('ship_address', event.target.value)}
            />
          </FormField>
          <ErrorNotice error={checkout.error} />
          {stockProblem ? (
            <Link to="/cart" className="text-sm underline underline-offset-4">
              {t('cart.checkout_back_to_cart')}
            </Link>
          ) : null}
          <Button type="submit" className="w-full" disabled={checkout.isPending}>
            {t('cart.checkout_submit')}
          </Button>
        </form>
        {summary ? (
          <aside className="grid gap-4 self-start rounded-xl border bg-card p-5 lg:sticky lg:top-24">
            <ul aria-label={t('cart.column_product')} className="grid gap-3">
              {summary.items.map((item) => (
                <li key={item.product_id} className="flex items-center gap-3">
                  <ProductImage
                    name={item.name}
                    imageUrl={item.image_url}
                    className="size-12 shrink-0 rounded-md"
                  />
                  <div className="grid min-w-0 flex-1 gap-0.5">
                    <span className="text-sm font-medium wrap-break-word">{item.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {t('cart.column_quantity')}: {item.quantity}
                    </span>
                  </div>
                  <Money value={item.line_total} className="shrink-0 text-sm font-medium" />
                </li>
              ))}
            </ul>
            <div className="flex items-baseline justify-between gap-4 border-t pt-4">
              <span className="text-muted-foreground">{t('cart.total')}</span>
              <Money value={summary.total} className="text-primary text-xl font-semibold" />
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  )
}
