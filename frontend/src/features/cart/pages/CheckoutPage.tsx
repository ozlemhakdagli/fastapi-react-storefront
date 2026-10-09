import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { ErrorNotice } from '@/components/ErrorNotice'
import { FormField } from '@/components/FormField'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/features/auth/AuthContext'
import { type ShippingDetails, useCheckout } from '@/features/cart/hooks/useCheckout'
import { ApiError } from '@/lib/api'
import { t } from '@/lib/i18n'

type Field = keyof ShippingDetails
type FieldErrors = Partial<Record<Field, string>>

const FIELDS: Field[] = ['ship_name', 'ship_phone', 'ship_address']

// Same limits as the orders table columns (contract section 3).
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
    <div className="mx-auto grid max-w-xl gap-6">
      <PageHeader title={t('cart.checkout_title')} />
      {/* noValidate: the messages come from our own validation, not from the browser. */}
      <form className="grid gap-4" noValidate onSubmit={handleSubmit}>
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
        <FormField label={t('cart.checkout_phone')} htmlFor="ship_phone" error={errors.ship_phone}>
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
        <Button type="submit" disabled={checkout.isPending}>
          {t('cart.checkout_submit')}
        </Button>
      </form>
    </div>
  )
}
