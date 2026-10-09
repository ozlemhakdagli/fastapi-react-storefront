import { screen, within } from '@testing-library/react'
import type { AdminDashboard } from '@/features/admin/hooks/useAdminDashboard'
import DashboardPage from '@/features/admin/pages/DashboardPage'
import { api, ApiError } from '@/lib/api'
import { errorMessage, t } from '@/lib/i18n'
import { price, renderWithProviders, testAdmin } from '@/test/utils'

const ordersPerDay: AdminDashboard['orders_per_day'] = [
  { date: '2026-09-26', orders: 0, revenue: '0.00' },
  { date: '2026-09-27', orders: 2, revenue: '1299.90' },
  { date: '2026-09-28', orders: 0, revenue: '0.00' },
  { date: '2026-09-29', orders: 0, revenue: '0.00' },
  { date: '2026-09-30', orders: 1, revenue: '50.50' },
  { date: '2026-10-01', orders: 0, revenue: '0.00' },
  { date: '2026-10-02', orders: 0, revenue: '0.00' },
  { date: '2026-10-03', orders: 0, revenue: '0.00' },
  { date: '2026-10-04', orders: 0, revenue: '0.00' },
  { date: '2026-10-05', orders: 0, revenue: '0.00' },
  { date: '2026-10-06', orders: 0, revenue: '0.00' },
  { date: '2026-10-07', orders: 0, revenue: '0.00' },
  { date: '2026-10-08', orders: 0, revenue: '0.00' },
  { date: '2026-10-09', orders: 3, revenue: '150.50' },
]

const dashboard: AdminDashboard = {
  new_orders: 3,
  unread_messages: 5,
  products: 42,
  customers: 17,
  orders_by_status: { new: 3, approved: 1, shipped: 1, completed: 2, rejected: 1, cancelled: 0 },
  orders_per_day: ordersPerDay,
  recent_orders: [
    {
      id: 7,
      customer_name: 'Ayşe Yılmaz',
      status: 'new',
      total: '1299.90',
      created_at: '2026-10-09T12:00:00Z',
    },
    {
      id: 6,
      customer_name: 'Mehmet Demir',
      status: 'completed',
      total: '50.50',
      created_at: '2026-09-30T09:30:00Z',
    },
  ],
  low_stock: [
    { id: 3, sku: 'SEED-007', name: 'Samsung T7 1 TB Taşınabilir SSD', stock: 4 },
    { id: 9, sku: 'SEED-021', name: 'Kablosuz Kulaklık', stock: 0 },
  ],
}

// An empty shop: every count is zero and the chart still has its 14 days.
const emptyDashboard: AdminDashboard = {
  new_orders: 0,
  unread_messages: 0,
  products: 0,
  customers: 0,
  orders_by_status: { new: 0, approved: 0, rejected: 0, cancelled: 0, shipped: 0, completed: 0 },
  orders_per_day: ordersPerDay.map(({ date }) => ({ date, orders: 0, revenue: '0.00' })),
  recent_orders: [],
  low_stock: [],
}

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
    const get = vi.spyOn(api, 'get').mockResolvedValue(dashboard)
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
    vi.spyOn(api, 'get').mockResolvedValue(dashboard)
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

  it('labels the 14-day chart with its total orders and revenue', async () => {
    vi.spyOn(api, 'get').mockResolvedValue(dashboard)
    renderDashboard()
    expect(
      await screen.findByRole('img', { name: t('admindashboard.chart_aria', { orders: 6 }) }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(t('admindashboard.chart_revenue', { amount: price('1500.90') })),
    ).toBeInTheDocument()
    expect(screen.getByText('26 Eyl')).toBeInTheDocument()
  })

  it('lists every order status with its count and its share of all orders', async () => {
    vi.spyOn(api, 'get').mockResolvedValue(dashboard)
    renderDashboard()
    const list = await screen.findByRole('list', { name: t('admindashboard.status_title') })
    const rows = within(list).getAllByRole('listitem')
    const expected = [
      ['new', '3'],
      ['approved', '1'],
      ['shipped', '1'],
      ['completed', '2'],
      ['rejected', '1'],
      ['cancelled', '0'],
    ] as const
    expect(rows).toHaveLength(expected.length)
    expected.forEach(([status, count], index) => {
      expect(within(rows[index]).getByText(t(`common.status_${status}`))).toBeInTheDocument()
      expect(within(rows[index]).getByText(count)).toBeInTheDocument()
    })
    // 3 of the 8 orders are new.
    expect(rows[0].querySelector('[style]')).toHaveStyle({ width: '37.5%' })
  })

  it('links the recent orders to their order pages', async () => {
    vi.spyOn(api, 'get').mockResolvedValue(dashboard)
    renderDashboard()
    const table = await screen.findByRole('table')
    expect(
      within(table).getByRole('link', { name: t('adminorders.order_number', { id: 7 }) }),
    ).toHaveAttribute('href', '/admin/orders/7')
    expect(
      within(table).getByRole('link', { name: t('adminorders.order_number', { id: 6 }) }),
    ).toHaveAttribute('href', '/admin/orders/6')
    expect(within(table).getByText('Mehmet Demir')).toBeInTheDocument()
  })

  it('links the low-stock products to their admin pages and shows the SKU', async () => {
    vi.spyOn(api, 'get').mockResolvedValue(dashboard)
    renderDashboard()
    const link = await screen.findByRole('link', { name: /Samsung T7 1 TB Taşınabilir SSD/ })
    expect(link).toHaveAttribute('href', '/admin/products/3')
    expect(within(link).getByText('SEED-007')).toBeInTheDocument()
    expect(within(link).getByText(t('common.stock_low', { count: 4 }))).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Kablosuz Kulaklık/ })).toHaveAttribute(
      'href',
      '/admin/products/9',
    )
  })

  it('shows the empty texts, and no errors, for a shop without orders or low stock', async () => {
    vi.spyOn(api, 'get').mockResolvedValue(emptyDashboard)
    renderDashboard()
    expect(await screen.findByText(t('admindashboard.recent_empty'))).toBeInTheDocument()
    expect(screen.getByText(t('admindashboard.low_stock_empty'))).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: t('admindashboard.chart_aria', { orders: 0 }) }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(document.body.innerHTML).not.toContain('NaN')
  })
})
