import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { ErrorNotice } from '@/components/ErrorNotice'
import { LoadingNotice } from '@/components/LoadingNotice'
import { Button } from '@/components/ui/button'
import { useAdminOrder } from '@/features/admin/hooks/useAdminOrders'
import { InvoiceDocument } from '@/features/orders/components/InvoiceDocument'
import { useSite } from '@/features/pages/hooks/useSite'
import { t } from '@/lib/i18n'

// Outside the admin layout, so the page has no header or footer and prints as one clean document.
export default function AdminInvoicePage() {
  const { id } = useParams()
  const orderId = Number(id)
  const order = useAdminOrder(orderId)
  const site = useSite()

  // Every state shares the same frame, so the loading and error texts have the page gutter too.
  let content: ReactNode
  if (order.isError) {
    content = <ErrorNotice error={order.error} />
  } else if (site.isError) {
    content = <ErrorNotice error={site.error} />
  } else if (order.isPending || site.isPending) {
    content = <LoadingNotice />
  } else {
    content = (
      <>
        <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Button onClick={() => window.print()}>{t('invoice.print')}</Button>
          <Button variant="outline" asChild>
            <Link to={`/admin/orders/${orderId}`}>{t('invoice.back')}</Link>
          </Button>
        </div>
        <InvoiceDocument order={order.data} seller={site.data} title={t('invoice.title')} />
      </>
    )
  }

  return <div className="mx-auto grid max-w-3xl gap-6 px-4 py-6 print:p-0">{content}</div>
}
