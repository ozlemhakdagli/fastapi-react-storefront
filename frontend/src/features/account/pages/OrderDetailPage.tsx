import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { type Column, DataTable } from '@/components/DataTable'
import { DetailRow } from '@/components/DetailRow'
import { ErrorNotice } from '@/components/ErrorNotice'
import { Money } from '@/components/Money'
import { PageHeader } from '@/components/PageHeader'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { useCancelOrder, useOrder } from '@/features/account/hooks/useOrders'
import { formatDate } from '@/lib/format'
import { t } from '@/lib/i18n'
import type { OrderItem } from '@/lib/types'

export default function OrderDetailPage() {
  const { id } = useParams()
  const orderId = Number(id)
  const [searchParams] = useSearchParams()
  const order = useOrder(orderId)
  const cancel = useCancelOrder(orderId)
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (order.isPending) return <p className="text-muted-foreground text-sm">{t('common.loading')}</p>
  if (order.isError) return <ErrorNotice error={order.error} />

  const detail = order.data
  // Set by the checkout, which redirects here with ?placed=1 after the order is created.
  const placed = searchParams.get('placed') === '1'

  const columns: Column<OrderItem>[] = [
    {
      key: 'product',
      header: t('account.column_product'),
      cell: (item) => item.product_name,
    },
    {
      key: 'unit_price',
      header: t('account.column_unit_price'),
      cell: (item) => <Money value={item.unit_price} />,
    },
    {
      key: 'quantity',
      header: t('account.column_quantity'),
      cell: (item) => item.quantity,
    },
    {
      key: 'line_total',
      header: t('account.column_line_total'),
      cell: (item) => <Money value={item.line_total} />,
    },
  ]

  return (
    <div className="grid gap-6">
      <PageHeader
        title={t('account.order_number', { id: detail.id })}
        actions={
          <Button variant="outline" asChild>
            <Link to="/account/orders">{t('account.order_back')}</Link>
          </Button>
        }
      />
      {placed ? (
        <p role="status" className="border-border bg-muted rounded-md border px-3 py-2 text-sm">
          {t('account.order_placed')}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-4 text-sm">
        <StatusBadge status={detail.status} />
        <span className="text-muted-foreground">
          {t('account.order_date')}{' '}
          <time dateTime={detail.created_at} className="text-foreground">
            {formatDate(detail.created_at)}
          </time>
        </span>
      </div>

      <section className="grid gap-3">
        <h2 className="text-lg font-semibold">{t('account.items_title')}</h2>
        <DataTable
          columns={columns}
          rows={detail.items}
          rowKey={(item) => item.product_id}
          emptyText={t('common.empty')}
        />
        <div className="flex items-baseline justify-end gap-2 text-lg">
          <span className="text-muted-foreground">{t('account.order_total')}</span>
          <Money value={detail.total} className="font-semibold" />
        </div>
      </section>

      <section className="grid gap-3">
        <h2 className="text-lg font-semibold">{t('account.shipping_title')}</h2>
        <dl className="grid gap-3 text-sm">
          <DetailRow label={t('account.ship_name')}>{detail.ship_name}</DetailRow>
          <DetailRow label={t('account.ship_phone')}>{detail.ship_phone}</DetailRow>
          <DetailRow label={t('account.ship_address')}>{detail.ship_address}</DetailRow>
          {detail.cargo_company ? (
            <DetailRow label={t('account.cargo_company')}>{detail.cargo_company}</DetailRow>
          ) : null}
          {detail.tracking_no ? (
            <DetailRow label={t('account.tracking_no')}>{detail.tracking_no}</DetailRow>
          ) : null}
        </dl>
      </section>

      <ErrorNotice error={cancel.error} />
      {detail.status === 'new' ? (
        <div>
          <Button
            variant="outline"
            disabled={cancel.isPending}
            onClick={() => setConfirmOpen(true)}
          >
            {t('account.order_cancel')}
          </Button>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmOpen}
        title={t('account.order_cancel_title')}
        description={t('account.order_cancel_description')}
        confirmLabel={t('account.order_cancel_confirm')}
        onConfirm={() => {
          setConfirmOpen(false)
          cancel.mutate()
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}

