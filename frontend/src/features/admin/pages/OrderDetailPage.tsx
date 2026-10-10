import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { type Column, DataTable } from '@/components/DataTable'
import { DetailRow } from '@/components/DetailRow'
import { ErrorNotice } from '@/components/ErrorNotice'
import { FormField } from '@/components/FormField'
import { LoadingNotice } from '@/components/LoadingNotice'
import { Money } from '@/components/Money'
import { NativeSelect } from '@/components/NativeSelect'
import { PageHeader } from '@/components/PageHeader'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  type AdminOrderChanges,
  useAdminOrder,
  useUpdateAdminOrder,
} from '@/features/admin/hooks/useAdminOrders'
import { ALLOWED_NEXT } from '@/features/admin/orderTransitions'
import { formatDate } from '@/lib/format'
import { t } from '@/lib/i18n'
import { useDocumentTitle } from '@/features/pages/hooks/useDocumentTitle'
import type { AdminOrder, OrderItem, OrderStatus } from '@/lib/types'

export default function OrderDetailPage() {
  const { id } = useParams()
  const orderId = Number(id)
  const order = useAdminOrder(orderId)
  useDocumentTitle(order.data ? t('adminorders.detail_title', { id: order.data.id }) : t('adminorders.title'))
  const update = useUpdateAdminOrder(orderId)

  if (order.isPending) return <LoadingNotice />
  if (order.isError) return <ErrorNotice error={order.error} />

  const detail = order.data

  const columns: Column<OrderItem>[] = [
    {
      key: 'product',
      header: t('adminorders.column_product'),
      cell: (item) => item.product_name,
    },
    {
      key: 'unit_price',
      header: t('adminorders.column_unit_price'),
      cell: (item) => <Money value={item.unit_price} />,
    },
    {
      key: 'quantity',
      header: t('adminorders.column_quantity'),
      cell: (item) => item.quantity,
    },
    {
      key: 'line_total',
      header: t('adminorders.column_line_total'),
      cell: (item) => <Money value={item.line_total} />,
    },
  ]

  return (
    <div className="grid gap-6">
      <PageHeader
        title={t('adminorders.detail_title', { id: detail.id })}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to={`/admin/orders/${orderId}/invoice`}>{t('invoice.link')}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/orders">{t('adminorders.back_to_orders')}</Link>
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-4 text-sm">
        <StatusBadge status={detail.status} />
        <span className="text-muted-foreground">
          {t('adminorders.order_date')}{' '}
          <time dateTime={detail.created_at} className="text-foreground">
            {formatDate(detail.created_at)}
          </time>
        </span>
      </div>

      <section className="grid gap-3 rounded-xl border bg-card p-4">
        <h2 className="text-lg font-semibold">{t('adminorders.customer_title')}</h2>
        <dl className="grid gap-3 text-sm">
          <DetailRow label={t('adminorders.customer_name')}>{detail.customer.full_name}</DetailRow>
          <DetailRow label={t('adminorders.customer_email')}>{detail.customer.email}</DetailRow>
        </dl>
      </section>

      <section className="grid gap-3 rounded-xl border bg-card p-4">
        <h2 className="text-lg font-semibold">{t('adminorders.shipping_title')}</h2>
        <dl className="grid gap-3 text-sm">
          <DetailRow label={t('adminorders.ship_name')}>{detail.ship_name}</DetailRow>
          <DetailRow label={t('adminorders.ship_phone')}>{detail.ship_phone}</DetailRow>
          <DetailRow label={t('adminorders.ship_address')}>{detail.ship_address}</DetailRow>
        </dl>
      </section>

      <section className="grid gap-3 rounded-xl border bg-card p-4">
        <h2 className="text-lg font-semibold">{t('adminorders.items_title')}</h2>
        <DataTable
          columns={columns}
          rows={detail.items}
          rowKey={(item) => item.product_id}
          emptyText={t('common.empty')}
        />
        <div className="flex items-baseline justify-end gap-2 text-lg">
          <span className="text-muted-foreground">{t('adminorders.order_total')}</span>
          <Money value={detail.total} className="font-semibold" />
        </div>
      </section>

      <section className="grid gap-4 rounded-xl border bg-card p-4">
        <h2 className="text-lg font-semibold">{t('adminorders.manage_title')}</h2>
        {/* Keyed by the saved version, so the form shows the server's values after every
            change, and keeps the admin's draft while the order is unchanged. */}
        <OrderForm
          key={`${detail.id}:${detail.updated_at}`}
          order={detail}
          saving={update.isPending}
          onSave={(changes) => update.mutate(changes)}
        />
        <ErrorNotice error={update.error} />
        {update.isSuccess ? (
          <p role="status" className="border-border bg-muted rounded-md border px-3 py-2 text-sm">
            {t('adminorders.saved')}
          </p>
        ) : null}
      </section>
    </div>
  )
}

interface OrderFormProps {
  order: AdminOrder
  saving: boolean
  onSave: (changes: AdminOrderChanges) => void
}

function OrderForm({ order, saving, onSave }: OrderFormProps) {
  const [status, setStatus] = useState<OrderStatus>(order.status)
  const [cargoCompany, setCargoCompany] = useState(order.cargo_company ?? '')
  const [trackingNo, setTrackingNo] = useState(order.tracking_no ?? '')
  const [adminNote, setAdminNote] = useState(order.admin_note ?? '')

  // The current status is always offered, so that the select shows where the order stands.
  const next = ALLOWED_NEXT[order.status]
  const statusOptions: OrderStatus[] = [order.status, ...next]
  const statusFinal = next.length === 0

  // Only the fields that differ from the saved order are sent.
  const changes: AdminOrderChanges = {}
  if (status !== order.status) changes.status = status
  if (clean(cargoCompany) !== clean(order.cargo_company)) {
    changes.cargo_company = clean(cargoCompany)
  }
  if (clean(trackingNo) !== clean(order.tracking_no)) changes.tracking_no = clean(trackingNo)
  if (clean(adminNote) !== clean(order.admin_note)) changes.admin_note = clean(adminNote)
  const dirty = Object.keys(changes).length > 0

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (dirty && !saving) onSave(changes)
  }

  return (
    <form className="grid max-w-xl gap-4" noValidate onSubmit={handleSubmit}>
      <FormField label={t('adminorders.status_label')} htmlFor="order-status">
        <NativeSelect
          id="order-status"
          value={status}
          disabled={statusFinal}
          onChange={(event) => setStatus(event.target.value as OrderStatus)}
        >
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {t(`common.status_${option}`)}
            </option>
          ))}
        </NativeSelect>
      </FormField>
      {statusFinal ? (
        <p className="text-muted-foreground -mt-2 text-sm">{t('adminorders.status_final')}</p>
      ) : null}
      <FormField label={t('adminorders.cargo_company_label')} htmlFor="order-cargo">
        <Input
          id="order-cargo"
          maxLength={100}
          value={cargoCompany}
          onChange={(event) => setCargoCompany(event.target.value)}
        />
      </FormField>
      <FormField label={t('adminorders.tracking_no_label')} htmlFor="order-tracking">
        <Input
          id="order-tracking"
          maxLength={100}
          value={trackingNo}
          onChange={(event) => setTrackingNo(event.target.value)}
        />
      </FormField>
      <FormField label={t('adminorders.admin_note_label')} htmlFor="order-note">
        <Textarea
          id="order-note"
          rows={4}
          maxLength={2000}
          value={adminNote}
          onChange={(event) => setAdminNote(event.target.value)}
        />
      </FormField>
      <div>
        <Button type="submit" disabled={!dirty || saving}>
          {t('common.save')}
        </Button>
      </div>
    </form>
  )
}

/** Trims a text field and maps empty text to null, which clears the column on the server. */
function clean(value: string | null): string | null {
  const trimmed = (value ?? '').trim()
  return trimmed === '' ? null : trimmed
}

