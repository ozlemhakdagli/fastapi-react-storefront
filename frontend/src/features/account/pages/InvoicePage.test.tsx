import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import InvoicePage from '@/features/account/pages/InvoicePage'
import { api, ApiError } from '@/lib/api'
import { errorMessage, t } from '@/lib/i18n'
import type { Order, SiteSettings } from '@/lib/types'
import { renderWithProviders, testCustomer } from '@/test/utils'

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

function order(): Order {
  return {
    id: 5,
    status: 'new',
    total: '2599.80',
    item_count: 1,
    created_at: '2026-10-08T12:00:00Z',
    ship_name: 'Jane Doe',
    ship_phone: '+1 555 010 0100',
    ship_address: '12 Example Street, Springfield',
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
  return renderWithProviders(<InvoicePage />, {
    route: '/account/orders/5/invoice',
    path: '/account/orders/:id/invoice',
    user: testCustomer,
  })
}

describe('InvoicePage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows the invoice of the order with the shop details from the site settings', async () => {
    const get = mockApi()
    renderPage()
    expect(await screen.findByRole('heading', { name: t('invoice.title') })).toBeInTheDocument()
    expect(screen.getByText('Sample Shop')).toBeInTheDocument()
    expect(screen.getByText('Mechanical Keyboard')).toBeInTheDocument()
    expect(get).toHaveBeenCalledWith('/orders/5')
    expect(get).toHaveBeenCalledWith('/site')
  })

  it('shows the loading text while the order is fetched', () => {
    vi.spyOn(api, 'get').mockImplementation(() => new Promise(() => {}))
    renderPage()
    expect(screen.getByText(t('common.loading'))).toBeInTheDocument()
  })

  it.each(['/orders/5', '/site'])(
    'shows the translated message when %s cannot be loaded',
    async (failing) => {
      const error = new ApiError(404, 'not_found')
      vi.spyOn(api, 'get').mockImplementation(async (path: string) => {
        if (path === failing) throw error
        return path === '/site' ? site : order()
      })
      renderPage()
      expect(await screen.findByRole('alert')).toHaveTextContent(errorMessage(error))
    },
  )

  it('prints the page when the print button is clicked', async () => {
    mockApi()
    const print = vi.spyOn(window, 'print').mockImplementation(() => {})
    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: t('invoice.print') }))
    expect(print).toHaveBeenCalledTimes(1)
  })

  it('hides the toolbar when the page is printed', async () => {
    mockApi()
    renderPage()
    // Print visibility cannot be tested in jsdom, so the toolbar class is checked directly.
    const toolbar = (await screen.findByRole('button', { name: t('invoice.print') })).parentElement
    expect(toolbar).toHaveClass('print:hidden')
  })

  it('links back to the order', async () => {
    mockApi()
    renderPage()
    expect(await screen.findByRole('link', { name: t('invoice.back') })).toHaveAttribute(
      'href',
      '/account/orders/5',
    )
  })
})
