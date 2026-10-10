import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OrdersPage from '@/features/admin/pages/OrdersPage'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/format'
import { t } from '@/lib/i18n'
import { type AdminOrderListItem, ORDER_STATUSES, type Page } from '@/lib/types'
import { price, renderWithProviders, testAdmin } from '@/test/utils'

function order(overrides: Partial<AdminOrderListItem> = {}): AdminOrderListItem {
  return {
    id: 5,
    status: 'new',
    total: '2599.80',
    item_count: 2,
    created_at: '2026-10-08T12:00:00Z',
    customer: { id: 2, email: 'ayse@example.com', full_name: 'Ayşe Yılmaz' },
    ...overrides,
  }
}

function ordersPage(items: AdminOrderListItem[], total = items.length): Page<AdminOrderListItem> {
  return { items, total, page: 1, page_size: 20 }
}

function renderList(route = '/admin/orders') {
  return renderWithProviders(<OrdersPage />, { route, user: testAdmin })
}

describe('OrdersPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the orders from the API with a link to each detail page', async () => {
    const shipped = order({
      id: 6,
      status: 'shipped',
      total: '250.00',
      item_count: 1,
      created_at: '2026-10-07T09:30:00Z',
      customer: { id: 3, email: 'mehmet@example.com', full_name: 'Mehmet Demir' },
    })
    vi.spyOn(api, 'get').mockResolvedValue(ordersPage([order(), shipped]))
    renderList()
    const table = await screen.findByRole('table')
    const link = within(table).getByRole('link', { name: t('adminorders.order_number', { id: 5 }) })
    expect(link).toHaveAttribute('href', '/admin/orders/5')
    expect(within(table).getByText('Ayşe Yılmaz')).toBeInTheDocument()
    expect(within(table).getByText('Mehmet Demir')).toBeInTheDocument()
    expect(within(table).getByText(t('common.status_shipped'))).toBeInTheDocument()
    expect(within(table).getByText(price('2599.80'))).toBeInTheDocument()
    expect(within(table).getByText(price('250.00'))).toBeInTheDocument()
    expect(within(table).getByText(formatDate('2026-10-07T09:30:00Z'))).toBeInTheDocument()
  })

  it('test_orders_tab_requests_status_filter', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue(ordersPage([order()]))
    renderList()
    await screen.findByRole('table')
    expect(get).toHaveBeenLastCalledWith('/admin/orders', { page: 1 })
    for (const status of ORDER_STATUSES) {
      await userEvent.click(screen.getByRole('tab', { name: t(`common.status_${status}`) }))
      await waitFor(() =>
        expect(get).toHaveBeenLastCalledWith('/admin/orders', { status, page: 1 }),
      )
    }
    await userEvent.click(screen.getByRole('tab', { name: t('adminorders.tab_all') }))
    await waitFor(() => expect(get).toHaveBeenLastCalledWith('/admin/orders', { page: 1 }))
  })

  it('opens the tab named in the URL, as the dashboard link does', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue(ordersPage([]))
    renderList('/admin/orders?status=new')
    await waitFor(() =>
      expect(get).toHaveBeenCalledWith('/admin/orders', { status: 'new', page: 1 }),
    )
    expect(screen.getByRole('tab', { name: t('common.status_new') })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  it('test_orders_next_page_requests_page_two', async () => {
    const get = vi
      .spyOn(api, 'get')
      .mockResolvedValue({ items: [order()], total: 25, page: 1, page_size: 20 })
    renderList()
    await userEvent.click(await screen.findByRole('button', { name: t('common.next') }))
    expect(get).toHaveBeenLastCalledWith('/admin/orders', { page: 2 })
  })

  it('shows the empty message when no order matches the tab', async () => {
    vi.spyOn(api, 'get').mockResolvedValue(ordersPage([]))
    renderList()
    expect(await screen.findByText(t('adminorders.orders_empty'))).toBeInTheDocument()
  })

})
