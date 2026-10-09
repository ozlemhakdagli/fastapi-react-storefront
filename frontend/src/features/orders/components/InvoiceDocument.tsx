import { Money } from '@/components/Money'
import { formatDate } from '@/lib/format'
import { t } from '@/lib/i18n'
import type { Order, SiteSettings } from '@/lib/types'

interface InvoiceDocumentProps {
  order: Order
  seller: SiteSettings
  title: string
}

// Black on white whatever the theme, so the print looks the same. Rows never break across pages,
// and the header row repeats on every page. This is not a legal invoice; the disclaimer says so.
export function InvoiceDocument({ order, seller, title }: InvoiceDocumentProps) {
  return (
    <article className="mx-auto max-w-3xl bg-white p-6 text-black sm:p-10 print:p-0">
      <header
        className="flex flex-wrap items-start justify-between gap-6 border-b border-black/20 pb-6"
      >
        <section className="grid gap-1 text-sm">
          <h2 className="font-semibold">{t('invoice.seller')}</h2>
          <p className="font-semibold">{seller.site_name}</p>
          <p className="whitespace-pre-line">{seller.address}</p>
          <p>{seller.phone}</p>
          <p>{seller.email}</p>
        </section>
        <div className="text-right">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <p className="mt-1 text-sm">{t('invoice.disclaimer')}</p>
        </div>
      </header>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <section className="grid gap-1 text-sm">
          <h2 className="font-semibold">{t('invoice.buyer')}</h2>
          <p>{order.ship_name}</p>
          <p>{order.ship_phone}</p>
          <p className="whitespace-pre-line">{order.ship_address}</p>
        </section>
        <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-1 text-sm">
          <dt className="font-semibold">{t('invoice.number')}</dt>
          <dd>{order.id}</dd>
          <dt className="font-semibold">{t('invoice.date')}</dt>
          <dd>
            <time dateTime={order.created_at}>{formatDate(order.created_at)}</time>
          </dd>
          <dt className="font-semibold">{t('invoice.status')}</dt>
          <dd>{t(`common.status_${order.status}`)}</dd>
          {order.cargo_company ? (
            <>
              <dt className="font-semibold">{t('invoice.cargo')}</dt>
              <dd>{order.cargo_company}</dd>
            </>
          ) : null}
          {order.tracking_no ? (
            <>
              <dt className="font-semibold">{t('invoice.tracking')}</dt>
              <dd>{order.tracking_no}</dd>
            </>
          ) : null}
        </dl>
      </div>

      <table className="mt-8 w-full text-sm tabular-nums">
        <thead>
          <tr className="border-b border-black">
            <th scope="col" className="py-2 text-left font-semibold">
              {t('invoice.column_product')}
            </th>
            <th scope="col" className="py-2 text-right font-semibold">
              {t('invoice.column_quantity')}
            </th>
            <th scope="col" className="py-2 text-right font-semibold">
              {t('invoice.column_unit_price')}
            </th>
            <th scope="col" className="py-2 text-right font-semibold">
              {t('invoice.column_total')}
            </th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.product_id} className="break-inside-avoid border-b border-black/20">
              <td className="py-2">{item.product_name}</td>
              <td className="py-2 text-right">{item.quantity}</td>
              <td className="py-2 text-right">
                <Money value={item.unit_price} />
              </td>
              <td className="py-2 text-right">
                <Money value={item.line_total} />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="break-inside-avoid">
            <th scope="row" colSpan={3} className="py-2 text-right font-semibold">
              {t('invoice.total')}
            </th>
            <td className="py-2 text-right font-semibold">
              <Money value={order.total} />
            </td>
          </tr>
        </tfoot>
      </table>
    </article>
  )
}
