import type { LucideIcon } from 'lucide-react'
import { ClipboardList, MessageSquare, Package, Users } from 'lucide-react'
import { Link } from 'react-router'
import { BarChart } from '@/components/BarChart'
import { type Column, DataTable } from '@/components/DataTable'
import { ErrorNotice } from '@/components/ErrorNotice'
import { LoadingNotice } from '@/components/LoadingNotice'
import { Money } from '@/components/Money'
import { PageHeader } from '@/components/PageHeader'
import { StatusBadge } from '@/components/StatusBadge'
import { StockBadge } from '@/components/StockBadge'
import { type AdminDashboard, useAdminDashboard } from '@/features/admin/hooks/useAdminDashboard'
import { formatDate, formatDay, formatMoney } from '@/lib/format'
import { t } from '@/lib/i18n'
import { useDocumentTitle } from '@/features/pages/hooks/useDocumentTitle'
import type { OrderStatus } from '@/lib/types'

type Day = AdminDashboard['orders_per_day'][number]
type RecentOrder = AdminDashboard['recent_orders'][number]
type LowStockProduct = AdminDashboard['low_stock'][number]

// The order of the status rows: the way an order goes, then the two that end without a sale.
const STATUS_ORDER: OrderStatus[] = [
  'new',
  'approved',
  'shipped',
  'completed',
  'rejected',
  'cancelled',
]

interface CountCard {
  key: keyof AdminDashboard
  label: string
  value: number
  /** The admin page that lists what the count is about. */
  to: string
  icon: LucideIcon
  /** Colours of the icon tile: soft background and icon colour, from the design tokens. */
  tone: string
}

function countCards(counts: AdminDashboard): CountCard[] {
  return [
    {
      key: 'new_orders',
      label: t('admindashboard.new_orders'),
      value: counts.new_orders,
      to: '/admin/orders?status=new',
      icon: ClipboardList,
      tone: 'bg-primary/10 text-primary',
    },
    {
      key: 'unread_messages',
      label: t('admindashboard.unread_messages'),
      value: counts.unread_messages,
      to: '/admin/messages',
      icon: MessageSquare,
      tone: 'bg-warning/20 text-warning-foreground',
    },
    {
      key: 'products',
      label: t('admindashboard.products'),
      value: counts.products,
      to: '/admin/products',
      icon: Package,
      tone: 'bg-success/12 text-success',
    },
    {
      key: 'customers',
      label: t('admindashboard.customers'),
      value: counts.customers,
      to: '/admin/users',
      icon: Users,
      tone: 'bg-info/12 text-info',
    },
  ]
}

/** Adds money strings in whole cents, so that the sum has no rounding noise. */
function sumMoney(values: string[]): string {
  const cents = values.reduce((sum, value) => sum + Math.round(Number(value) * 100), 0)
  return (cents / 100).toFixed(2)
}

function OrdersChart({ days }: { days: Day[] }) {
  const orders = days.reduce((sum, day) => sum + day.orders, 0)
  const revenue = sumMoney(days.map((day) => day.revenue))
  return (
    <section className="grid content-start gap-3 rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-lg font-semibold">{t('admindashboard.chart_title')}</h2>
        <p className="text-muted-foreground text-sm tabular-nums">
          {t('admindashboard.chart_revenue', { amount: formatMoney(revenue) })}
        </p>
      </div>
      <BarChart
        data={days.map((day) => ({ label: formatDay(day.date), value: day.orders }))}
        ariaLabel={t('admindashboard.chart_aria', { orders })}
      />
    </section>
  )
}

function StatusCounts({ counts }: { counts: AdminDashboard['orders_by_status'] }) {
  const total = STATUS_ORDER.reduce((sum, status) => sum + counts[status], 0)
  return (
    <section className="grid content-start gap-3 rounded-xl border bg-card p-4">
      <h2 className="text-lg font-semibold">{t('admindashboard.status_title')}</h2>
      <ul aria-label={t('admindashboard.status_title')} className="grid gap-3">
        {STATUS_ORDER.map((status) => {
          const count = counts[status]
          // Zero orders means every row is an empty bar (no division by zero).
          const share = total > 0 ? (count / total) * 100 : 0
          return (
            <li
              key={status}
              className="grid grid-cols-[8.5rem_minmax(0,1fr)_2rem] items-center gap-3"
            >
              <StatusBadge status={status} />
              <div aria-hidden="true" className="bg-primary/20 h-1.5 overflow-hidden rounded-full">
                <div className="bg-primary h-full rounded-full" style={{ width: `${share}%` }} />
              </div>
              <span className="text-right font-medium tabular-nums">{count}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function RecentOrders({ orders }: { orders: RecentOrder[] }) {
  const columns: Column<RecentOrder>[] = [
    {
      key: 'id',
      header: t('admindashboard.column_order'),
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
      header: t('admindashboard.column_customer'),
      cell: (order) => order.customer_name,
    },
    {
      key: 'status',
      header: t('admindashboard.column_status'),
      cell: (order) => <StatusBadge status={order.status} />,
    },
    {
      key: 'total',
      header: t('admindashboard.column_total'),
      cell: (order) => <Money value={order.total} />,
      className: 'text-right',
    },
    {
      key: 'created_at',
      header: t('admindashboard.column_date'),
      cell: (order) => <time dateTime={order.created_at}>{formatDate(order.created_at)}</time>,
    },
  ]
  return (
    <section className="grid gap-3">
      <h2 className="text-lg font-semibold">{t('admindashboard.recent_title')}</h2>
      <DataTable
        columns={columns}
        rows={orders}
        rowKey={(order) => order.id}
        emptyText={t('admindashboard.recent_empty')}
      />
    </section>
  )
}

function LowStock({ products }: { products: LowStockProduct[] }) {
  return (
    <section className="grid gap-3">
      <h2 className="text-lg font-semibold">{t('admindashboard.low_stock_title')}</h2>
      {products.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('admindashboard.low_stock_empty')}</p>
      ) : (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card">
          {products.map((product) => (
            <li key={product.id}>
              <Link
                to={`/admin/products/${product.id}`}
                className="hover:bg-accent/40 focus-visible:ring-ring flex items-center justify-between gap-3 px-4 py-3 outline-none focus-visible:ring-3"
              >
                <span className="grid min-w-0">
                  <span className="truncate font-medium">{product.name}</span>
                  <span className="text-muted-foreground text-xs">{product.sku}</span>
                </span>
                <StockBadge stock={product.stock} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default function DashboardPage() {
  useDocumentTitle(t('admindashboard.title'))
  const dashboard = useAdminDashboard()
  const data = dashboard.data

  return (
    <div className="grid gap-6">
      <PageHeader title={t('admindashboard.title')} />
      <ErrorNotice error={dashboard.error} />
      {dashboard.isPending ? (
        <LoadingNotice />
      ) : null}
      {data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {countCards(data).map(({ key, label, value, to, icon: Icon, tone }) => (
              <Link
                key={key}
                to={to}
                className="focus-visible:ring-ring block rounded-xl outline-none focus-visible:ring-3"
              >
                <div className="hover:bg-muted/50 flex h-full items-center gap-4 rounded-xl border bg-card p-4 transition-colors">
                  <span
                    className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${tone}`}
                  >
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  <div className="grid min-w-0 gap-0.5">
                    <p className="text-muted-foreground text-sm">{label}</p>
                    <p className="text-2xl font-semibold tabular-nums">{value}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <OrdersChart days={data.orders_per_day} />
            <StatusCounts counts={data.orders_by_status} />
          </div>
          <RecentOrders orders={data.recent_orders} />
          <LowStock products={data.low_stock} />
        </>
      ) : null}
    </div>
  )
}
