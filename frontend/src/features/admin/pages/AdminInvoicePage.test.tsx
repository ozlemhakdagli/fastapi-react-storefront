import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminInvoicePage from '@/features/admin/pages/AdminInvoicePage'
import { api, ApiError } from '@/lib/api'
import { errorMessage, t } from '@/lib/i18n'
import type { AdminOrder, SiteSettings } from '@/lib/types'
import { renderWithProviders, testAdmin } from '@/test/utils'

const site: SiteSettings = {
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

function order(): AdminOrder {
  return {
    id: 5,
    status: 'approved',
    total: '2599.80',
    item_count: 1,
    created_at: '2026-10-08T12:00:00Z',
    customer: { id: 2, email: 'ayse@example.com', full_name: 'Ayşe Yılmaz' },
    ship_name: 'Zeynep Kaya',
    ship_phone: '05320000000',
    ship_address: 'Moda Cad. 1, Kadıköy, İstanbul',
    cargo_company: null,
    tracking_no: null,
    admin_note: null,
    updated_at: '2026-10-08T12:00:00Z',
    items: [
      {
        product_id: 5,
        product_name: 'Mekanik Klavye',
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
    expect(screen.getByText('Örnek Mağaza')).toBeInTheDocument()
    expect(screen.getByText('Zeynep Kaya')).toBeInTheDocument()
    expect(get).toHaveBeenCalledWith('/admin/orders/5')
    expect(get).toHaveBeenCalledWith('/site')
  })

  it('shows the loading text while the order is fetched', () => {
    vi.spyOn(api, 'get').mockImplementation(() => new Promise(() => {}))
    renderPage()
    expect(screen.getByText(t('common.loading'))).toBeInTheDocument()
  })

  it.each(['/admin/orders/5', '/site'])(
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
      '/admin/orders/5',
    )
  })
})
