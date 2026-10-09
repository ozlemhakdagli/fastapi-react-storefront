import type { LucideIcon } from 'lucide-react'
import { ClipboardList, MessageSquare, Package, Users } from 'lucide-react'
import { Link } from 'react-router'
import { LoadingNotice } from '@/components/LoadingNotice'
import { ErrorNotice } from '@/components/ErrorNotice'
import { PageHeader } from '@/components/PageHeader'
import { useAdminDashboard } from '@/features/admin/hooks/useAdminDashboard'
import { t } from '@/lib/i18n'
import type { Dashboard } from '@/lib/types'

interface CountCard {
  key: keyof Dashboard
  label: string
  value: number
  /** The admin page that lists what the count is about. */
  to: string
  icon: LucideIcon
  /** Colours of the icon tile: soft background and icon colour, from the design tokens. */
  tone: string
}

function countCards(counts: Dashboard): CountCard[] {
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

export default function DashboardPage() {
  const dashboard = useAdminDashboard()

  return (
    <div className="grid gap-6">
      <PageHeader title={t('admindashboard.title')} />
      <ErrorNotice error={dashboard.error} />
      {dashboard.isPending ? (
        <LoadingNotice />
      ) : null}
      {dashboard.data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {countCards(dashboard.data).map(({ key, label, value, to, icon: Icon, tone }) => (
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
      ) : null}
    </div>
  )
}
