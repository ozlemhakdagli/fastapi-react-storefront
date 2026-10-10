import { Link } from 'react-router'
import { type Column } from '@/components/DataTable'
import { Money } from '@/components/Money'
import { PageHeader } from '@/components/PageHeader'
import { PagedTable } from '@/components/PagedTable'
import { StatusBadge } from '@/components/StatusBadge'
import { useOrders } from '@/features/account/hooks/useOrders'
import { formatDate } from '@/lib/format'
import { t } from '@/lib/i18n'
import { useDocumentTitle } from '@/features/pages/hooks/useDocumentTitle'
import type { OrderListItem } from '@/lib/types'
import { usePageParam } from '@/lib/usePageParam'

export default function OrdersPage() {
  useDocumentTitle(t('account.orders_title'))
  const [page, changePage] = usePageParam()
  // The page number lives in the URL, so that Back from an order returns to the same page.
  const orders = useOrders(page)

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
      <PagedTable
        query={orders}
        columns={columns}
        rowKey={(order) => order.id}
        emptyText={t('account.orders_empty')}
        page={page}
        onPageChange={changePage}
      />
    </div>
  )
}
