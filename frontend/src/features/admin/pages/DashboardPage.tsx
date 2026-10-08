import { Link } from 'react-router'
import { ErrorNotice } from '@/components/ErrorNotice'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAdminDashboard } from '@/features/admin/hooks/useAdminDashboard'
import { t } from '@/lib/i18n'
import type { Dashboard } from '@/lib/types'

interface CountCard {
  key: keyof Dashboard
  label: string
  value: number
  /** The admin page that lists what the count is about. */
  to: string
}

function countCards(counts: Dashboard): CountCard[] {
  return [
    {
      key: 'new_orders',
      label: t('admindashboard.new_orders'),
      value: counts.new_orders,
      to: '/admin/orders?status=new',
    },
    {
      key: 'unread_messages',
      label: t('admindashboard.unread_messages'),
      value: counts.unread_messages,
      to: '/admin/messages',
    },
    {
      key: 'products',
      label: t('admindashboard.products'),
      value: counts.products,
      to: '/admin/products',
    },
    {
      key: 'customers',
      label: t('admindashboard.customers'),
      value: counts.customers,
      to: '/admin/users',
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
        <p className="text-muted-foreground text-sm">{t('common.loading')}</p>
      ) : null}
      {dashboard.data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {countCards(dashboard.data).map((card) => (
            <Link
              key={card.key}
              to={card.to}
              className="focus-visible:ring-ring/50 block rounded-xl outline-none focus-visible:ring-3"
            >
              <Card className="hover:bg-muted/50 h-full transition-colors">
                <CardHeader>
                  <CardDescription>{card.label}</CardDescription>
                  <CardTitle className="text-3xl tabular-nums">{card.value}</CardTitle>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  )
}
