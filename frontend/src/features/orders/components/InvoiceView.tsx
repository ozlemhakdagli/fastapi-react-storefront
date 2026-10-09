import type { ReactNode } from 'react'
import { Link } from 'react-router'
import type { UseQueryResult } from '@tanstack/react-query'
import { ErrorNotice } from '@/components/ErrorNotice'
import { LoadingNotice } from '@/components/LoadingNotice'
import { Button } from '@/components/ui/button'
import { InvoiceDocument } from '@/features/orders/components/InvoiceDocument'
import { useSite } from '@/features/pages/hooks/useSite'
import { t } from '@/lib/i18n'
import type { Order } from '@/lib/types'

interface InvoiceViewProps {
  order: UseQueryResult<Order>
  backTo: string
}

// Outside the layout, so the page has no header or footer and prints as one clean document.
export function InvoiceView({ order, backTo }: InvoiceViewProps) {
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
            <Link to={backTo}>{t('invoice.back')}</Link>
          </Button>
        </div>
        <InvoiceDocument order={order.data} seller={site.data} title={t('invoice.title')} />
      </>
    )
  }

  return <div className="mx-auto grid max-w-3xl gap-6 px-4 py-6 print:p-0">{content}</div>
}
