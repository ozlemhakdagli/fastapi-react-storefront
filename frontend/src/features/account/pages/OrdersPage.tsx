import { Link, useSearchParams } from 'react-router'
import { type Column, DataTable } from '@/components/DataTable'
import { ErrorNotice } from '@/components/ErrorNotice'
import { Money } from '@/components/Money'
import { PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/Pagination'
import { StatusBadge } from '@/components/StatusBadge'
import { useOrders } from '@/features/account/hooks/useOrders'
import { formatDate } from '@/lib/format'
import { t } from '@/lib/i18n'
import type { OrderListItem } from '@/lib/types'

export default function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  // The page number lives in the URL, so that Back from an order returns to the same page.
  const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '', 10) || 1)
  const orders = useOrders(page)

  function changePage(next: number) {
    setSearchParams((previous) => {
      const params = new URLSearchParams(previous)
      if (next > 1) params.set('page', String(next))
      else params.delete('page')
      return params
    })
  }

  const columns: Column<OrderListItem>[] = [
    {
      key: 'id',
      header: t('account.column_order'),
      cell: (order) => (
        <Link
          to={`/account/orders/${order.id}`}
          className="font-medium underline underline-offset-4"
        >
          {t('account.order_number', { id: order.id })}
        </Link>
      ),
    },
    {
      key: 'created_at',
      header: t('account.column_date'),
      cell: (order) => <time dateTime={order.created_at}>{formatDate(order.created_at)}</time>,
    },
    {
      key: 'item_count',
      header: t('account.column_item_count'),
      cell: (order) => order.item_count,
    },
    {
      key: 'total',
      header: t('account.column_total'),
      cell: (order) => <Money value={order.total} />,
    },
    {
      key: 'status',
      header: t('account.column_status'),
      cell: (order) => <StatusBadge status={order.status} />,
    },
  ]

  return (
    <div className="grid gap-6">
      <PageHeader title={t('account.orders_title')} />
      <ErrorNotice error={orders.error} />
      {orders.isPending ? (
        <p className="text-muted-foreground text-sm">{t('common.loading')}</p>
      ) : null}
      {orders.data ? (
        <>
          <DataTable
            columns={columns}
            rows={orders.data.items}
            rowKey={(order) => order.id}
            emptyText={t('account.orders_empty')}
          />
          <Pagination
            page={page}
            pageSize={orders.data.page_size}
            total={orders.data.total}
            onChange={changePage}
          />
        </>
      ) : null}
    </div>
  )
}
