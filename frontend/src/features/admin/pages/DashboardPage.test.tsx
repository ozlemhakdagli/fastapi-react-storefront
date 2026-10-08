import { screen, within } from '@testing-library/react'
import DashboardPage from '@/features/admin/pages/DashboardPage'
import { api, ApiError } from '@/lib/api'
import { errorMessage, t } from '@/lib/i18n'
import type { Dashboard } from '@/lib/types'
import { renderWithProviders, testAdmin } from '@/test/utils'

const counts: Dashboard = { new_orders: 3, unread_messages: 5, products: 42, customers: 17 }

function renderDashboard() {
  return renderWithProviders(<DashboardPage />, { route: '/admin', user: testAdmin })
}

/** Each count card is a link whose accessible name starts with the card label. */
function findCard(label: string) {
  return screen.findByRole('link', { name: new RegExp(label) })
}

describe('DashboardPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('test_dashboard_shows_counts', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue(counts)
    renderDashboard()
    const orders = await findCard(t('admindashboard.new_orders'))
    expect(within(orders).getByText('3')).toBeInTheDocument()
    const messages = await findCard(t('admindashboard.unread_messages'))
    expect(within(messages).getByText('5')).toBeInTheDocument()
    const products = await findCard(t('admindashboard.products'))
    expect(within(products).getByText('42')).toBeInTheDocument()
    const customers = await findCard(t('admindashboard.customers'))
    expect(within(customers).getByText('17')).toBeInTheDocument()
    expect(get).toHaveBeenCalledWith('/admin/dashboard')
  })

  it('test_dashboard_cards_link_to_matching_pages', async () => {
    vi.spyOn(api, 'get').mockResolvedValue(counts)
    renderDashboard()
    expect(await findCard(t('admindashboard.new_orders'))).toHaveAttribute(
      'href',
      '/admin/orders?status=new',
    )
    expect(await findCard(t('admindashboard.unread_messages'))).toHaveAttribute(
      'href',
      '/admin/messages',
    )
    expect(await findCard(t('admindashboard.products'))).toHaveAttribute('href', '/admin/products')
    expect(await findCard(t('admindashboard.customers'))).toHaveAttribute('href', '/admin/users')
  })

  it('shows the translated message when the counts cannot be loaded', async () => {
    const error = new ApiError(403, 'forbidden')
    vi.spyOn(api, 'get').mockRejectedValue(error)
    renderDashboard()
    expect(await screen.findByRole('alert')).toHaveTextContent(errorMessage(error))
  })
})
