import { render, screen, within } from '@testing-library/react'
import { InvoiceDocument } from '@/features/orders/components/InvoiceDocument'
import { formatDate } from '@/lib/format'
import { t } from '@/lib/i18n'
import type { Order, SiteSettings } from '@/lib/types'
import { price } from '@/test/utils'

const seller: SiteSettings = {
  site_name: 'Örnek Mağaza',
  description: '',
  address: 'Bağdat Cad. 22, Kadıköy, İstanbul',
  phone: '02120000000',
  email: 'destek@example.com',
  facebook: '',
  instagram: '',
  pinterest: '',
  about_text: '',
  contact_text: '',
}

function order(overrides: Partial<Order> = {}): Order {
  return {
    id: 5,
    status: 'shipped',
    total: '2749.80',
    item_count: 2,
    created_at: '2026-10-08T12:00:00Z',
    ship_name: 'Ayşe Yılmaz',
    ship_phone: '05320000000',
    ship_address: 'Moda Cad. 1\nKadıköy, İstanbul',
    cargo_company: null,
    tracking_no: null,
    updated_at: '2026-10-08T12:00:00Z',
    items: [
      {
        product_id: 5,
        product_name: 'Mekanik Klavye',
        unit_price: '1299.90',
        quantity: 2,
        line_total: '2599.80',
      },
      {
        product_id: 9,
        product_name: 'Kablosuz Mouse',
        unit_price: '150.00',
        quantity: 1,
        line_total: '150.00',
      },
    ],
    ...overrides,
  }
}

function renderInvoice(overrides: Partial<Order> = {}) {
  return render(
    <InvoiceDocument order={order(overrides)} seller={seller} title={t('invoice.title')} />,
  )
}

/** The value that the invoice shows next to a label of its details list. */
function valueOf(label: string) {
  return screen.getByText(label).nextElementSibling
}

describe('InvoiceDocument', () => {
  it('shows the title, the disclaimer and the seller with its contact lines', () => {
    renderInvoice()
    expect(screen.getByRole('heading', { name: t('invoice.title') })).toBeInTheDocument()
    expect(screen.getByText(t('invoice.disclaimer'))).toBeInTheDocument()
    expect(screen.getByText('Örnek Mağaza')).toBeInTheDocument()
    expect(screen.getByText('Bağdat Cad. 22, Kadıköy, İstanbul')).toBeInTheDocument()
    expect(screen.getByText('02120000000')).toBeInTheDocument()
    expect(screen.getByText('destek@example.com')).toBeInTheDocument()
  })

  it('shows the order number, the date and the status', () => {
    renderInvoice()
    expect(valueOf(t('invoice.number'))).toHaveTextContent('5')
    expect(valueOf(t('invoice.date'))).toHaveTextContent(formatDate('2026-10-08T12:00:00Z'))
    expect(valueOf(t('invoice.status'))).toHaveTextContent(t('common.status_shipped'))
  })

  it('shows the buyer', () => {
    renderInvoice()
    expect(screen.getByText('Ayşe Yılmaz')).toBeInTheDocument()
    expect(screen.getByText('05320000000')).toBeInTheDocument()
    expect(screen.getByText('Moda Cad. 1 Kadıköy, İstanbul')).toBeInTheDocument()
  })

  it('shows one row per line with its quantity, unit price and line total', () => {
    renderInvoice()
    const row = screen.getByRole('row', { name: /Mekanik Klavye/ })
    expect(within(row).getByText('2')).toBeInTheDocument()
    expect(within(row).getByText(price('1299.90'))).toBeInTheDocument()
    expect(within(row).getByText(price('2599.80'))).toBeInTheDocument()
  })

  it('shows the order total', () => {
    renderInvoice()
    expect(screen.getByText(price('2749.80'))).toBeInTheDocument()
  })

  it('hides the cargo company and the tracking number when they are not set', () => {
    renderInvoice()
    expect(screen.queryByText(t('invoice.cargo'))).not.toBeInTheDocument()
    expect(screen.queryByText(t('invoice.tracking'))).not.toBeInTheDocument()
  })

  it('shows the cargo company and the tracking number when they are set', () => {
    renderInvoice({ cargo_company: 'Yurtiçi Kargo', tracking_no: 'YK123456' })
    expect(valueOf(t('invoice.cargo'))).toHaveTextContent('Yurtiçi Kargo')
    expect(valueOf(t('invoice.tracking'))).toHaveTextContent('YK123456')
  })

  it('renders 30 items as 30 rows', () => {
    const items = Array.from({ length: 30 }, (_, index) => ({
      product_id: index + 1,
      product_name: `Ürün ${index + 1}`,
      unit_price: '10.00',
      quantity: 1,
      line_total: '10.00',
    }))
    renderInvoice({ items, total: '300.00' })
    // Only the item rows have a number after "Ürün"; the header and the total row do not.
    expect(screen.getAllByRole('row', { name: /^Ürün \d+ / })).toHaveLength(30)
  })
})
