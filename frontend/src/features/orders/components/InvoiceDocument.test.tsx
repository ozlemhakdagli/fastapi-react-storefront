import { render, screen, within } from '@testing-library/react'
import { InvoiceDocument } from '@/features/orders/components/InvoiceDocument'
import { formatDate } from '@/lib/format'
import { t } from '@/lib/i18n'
import type { Order, SiteSettings } from '@/lib/types'
import { price } from '@/test/utils'

const seller: SiteSettings = {
  site_name: 'Sample Shop',
  description: '',
  address: '1 Sample Street, Sample City',
  phone: '+1 555 010 0400',
  email: 'support@example.com',
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
    ship_name: 'Jane Doe',
    ship_phone: '+1 555 010 0100',
    ship_address: '12 Example Street\nSpringfield',
    cargo_company: null,
    tracking_no: null,
    updated_at: '2026-10-08T12:00:00Z',
    items: [
      {
        product_id: 5,
        product_name: 'Mechanical Keyboard',
        unit_price: '1299.90',
        quantity: 2,
        line_total: '2599.80',
      },
      {
        product_id: 9,
        product_name: 'Wireless Mouse',
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
    expect(screen.getByText('Sample Shop')).toBeInTheDocument()
    expect(screen.getByText('1 Sample Street, Sample City')).toBeInTheDocument()
    expect(screen.getByText('+1 555 010 0400')).toBeInTheDocument()
    expect(screen.getByText('support@example.com')).toBeInTheDocument()
  })

  it('shows the order number, the date and the status', () => {
    renderInvoice()
    expect(valueOf(t('invoice.number'))).toHaveTextContent('5')
    expect(valueOf(t('invoice.date'))).toHaveTextContent(formatDate('2026-10-08T12:00:00Z'))
    expect(valueOf(t('invoice.status'))).toHaveTextContent(t('common.status_shipped'))
  })

  it('shows the buyer', () => {
    renderInvoice()
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('+1 555 010 0100')).toBeInTheDocument()
    expect(screen.getByText('12 Example Street Springfield')).toBeInTheDocument()
  })

  it('shows one row per line with its quantity, unit price and line total', () => {
    renderInvoice()
    const row = screen.getByRole('row', { name: /Mechanical Keyboard/ })
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
    renderInvoice({ cargo_company: 'Example Cargo', tracking_no: 'YK123456' })
    expect(valueOf(t('invoice.cargo'))).toHaveTextContent('Example Cargo')
    expect(valueOf(t('invoice.tracking'))).toHaveTextContent('YK123456')
  })

  it('renders 30 items as 30 rows', () => {
    const items = Array.from({ length: 30 }, (_, index) => ({
      product_id: index + 1,
      product_name: `Product ${index + 1}`,
      unit_price: '10.00',
      quantity: 1,
      line_total: '10.00',
    }))
    renderInvoice({ items, total: '300.00' })
    // Only the item rows have a number after "Product"; the header and the total row do not.
    expect(screen.getAllByRole('row', { name: /^Product \d+ / })).toHaveLength(30)
  })
})
