import { Link, useSearchParams } from 'react-router'
import { type Column, DataTable } from '@/components/DataTable'
import { ErrorNotice } from '@/components/ErrorNotice'
import { Money } from '@/components/Money'
import { PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/Pagination'
import { StatusBadge } from '@/components/StatusBadge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAdminOrders } from '@/features/admin/hooks/useAdminOrders'
import { formatDate } from '@/lib/format'
import { t } from '@/lib/i18n'
import { type AdminOrderListItem, ORDER_STATUSES, type OrderStatus } from '@/lib/types'

// The "all" tab has no status in the URL.
const ALL_TAB = 'all'

/** The status named in the URL, or undefined for every status (also for an unknown value). */
function parseStatus(value: string | null): OrderStatus | undefined {
  return ORDER_STATUSES.find((status) => status === value)
}

export default function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  // The tab and the page live in the URL, so that Back from an order returns to the same list.
  const status = parseStatus(searchParams.get('status'))
  const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '', 10) || 1)
  const orders = useAdminOrders({ status, page })

  function selectTab(value: string) {
    setSearchParams((previous) => {
      const params = new URLSearchParams(previous)
      const next = parseStatus(value)
      if (next) params.set('status', next)
      else params.delete('status')
      params.delete('page') // a different tab starts on its first page
      return params
    })
  }

  function changePage(next: number) {
    setSearchParams((previous) => {
      const params = new URLSearchParams(previous)
      if (next > 1) params.set('page', String(next))
      else params.delete('page')
      return params
    })
  }

  const columns: Column<AdminOrderListItem>[] = [
    {
      key: 'id',
      header: t('adminorders.column_order'),
      cell: (order) => (
        <Link
          to={`/admin/orders/${order.id}`}
          className="font-medium underline underline-offset-4"
        >
          {t('adminorders.order_number', { id: order.id })}
        </Link>
      ),
    },
    {
      key: 'customer',
      header: t('adminorders.column_customer'),
      cell: (order) => (
        <div className="grid">
          <span>{order.customer.full_name}</span>
          <span className="text-muted-foreground text-xs">{order.customer.email}</span>
        </div>
      ),
    },
    {
      key: 'created_at',
      header: t('adminorders.column_date'),
      cell: (order) => <time dateTime={order.created_at}>{formatDate(order.created_at)}</time>,
    },
    {
      key: 'item_count',
      header: t('adminorders.column_units'),
      cell: (order) => order.item_count,
    },
    {
      key: 'total',
      header: t('adminorders.column_total'),
      cell: (order) => <Money value={order.total} />,
    },
    {
      key: 'status',
      header: t('adminorders.column_status'),
      cell: (order) => <StatusBadge status={order.status} />,
    },
  ]

  const currentTab = status ?? ALL_TAB

  return (
    <div className="grid gap-6">
      <PageHeader title={t('adminorders.title')} />
      <Tabs value={currentTab} onValueChange={selectTab}>
        <div className="max-w-full overflow-x-auto">
          <TabsList>
            <TabsTrigger value={ALL_TAB}>{t('adminorders.tab_all')}</TabsTrigger>
            {ORDER_STATUSES.map((value) => (
              <TabsTrigger key={value} value={value}>
                {t(`common.status_${value}`)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <TabsContent value={currentTab} className="grid gap-4">
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
                emptyText={t('adminorders.orders_empty')}
              />
              <Pagination
                page={page}
                pageSize={orders.data.page_size}
                total={orders.data.total}
                onChange={changePage}
              />
            </>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  )
}
