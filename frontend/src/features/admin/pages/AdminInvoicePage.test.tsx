import { screen } from '@testing-library/react'
import AdminInvoicePage from '@/features/admin/pages/AdminInvoicePage'
import { api } from '@/lib/api'
import { t } from '@/lib/i18n'
import type { AdminOrder, SiteSettings } from '@/lib/types'
import { renderWithProviders, testAdmin } from '@/test/utils'

const site: SiteSettings = {
  site_name: 'Sample Shop',
  description: '',
  address: '1 Sample Street, Sample City',
  phone: '+1 555 010 0100',
  email: 'support@example.com',
  facebook: '',
  instagram: '',
  pinterest: '',
  about_text: '',
  contact_text: '',
}

function order(): AdminOrder {
  return {
    id: 5,
    status: 'approved',
    total: '2599.80',
    item_count: 1,
    created_at: '2026-10-08T12:00:00Z',
    customer: { id: 2, email: 'jane.doe@example.com', full_name: 'Jane Doe' },
    ship_name: 'Mary Major',
    ship_phone: '+1 555 010 0100',
    ship_address: '12 Example Street, Springfield',
    cargo_company: null,
    tracking_no: null,
    admin_note: null,
    updated_at: '2026-10-08T12:00:00Z',
    items: [
      {
        product_id: 5,
        product_name: 'Mechanical Keyboard',
        unit_price: '1299.90',
        quantity: 2,
        line_total: '2599.80',
      },
    ],
  }
}

/** Answers the two requests of the page: the order and the site settings. */
function mockApi() {
  return vi
    .spyOn(api, 'get')
    .mockImplementation(async (path: string) => (path === '/site' ? site : order()))
}

function renderPage() {
  return renderWithProviders(<AdminInvoicePage />, {
    route: '/admin/orders/5/invoice',
    path: '/admin/orders/:id/invoice',
    user: testAdmin,
  })
}

describe('AdminInvoicePage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows the invoice of the order with the shop details from the site settings', async () => {
    const get = mockApi()
    renderPage()
    expect(await screen.findByRole('heading', { name: t('invoice.title') })).toBeInTheDocument()
    expect(screen.getByText('Sample Shop')).toBeInTheDocument()
    expect(screen.getByText('Mary Major')).toBeInTheDocument()
    expect(get).toHaveBeenCalledWith('/admin/orders/5')
    expect(get).toHaveBeenCalledWith('/site')
  })

  it('links back to the order', async () => {
    mockApi()
    renderPage()
    expect(await screen.findByRole('link', { name: t('invoice.back') })).toHaveAttribute(
      'href',
      '/admin/orders/5',
    )
  })
})
