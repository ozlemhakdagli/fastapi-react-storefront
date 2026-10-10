import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OrdersPage from '@/features/account/pages/OrdersPage'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/format'
import { t } from '@/lib/i18n'
import type { OrderListItem, Page } from '@/lib/types'
import { price, renderWithProviders, testCustomer } from '@/test/utils'

function order(overrides: Partial<OrderListItem> = {}): OrderListItem {
  return {
    id: 1,
    status: 'new',
    total: '1299.90',
    item_count: 2,
    created_at: '2026-10-08T12:00:00Z',
    ...overrides,
  }
}

function ordersPage(items: OrderListItem[], total = items.length): Page<OrderListItem> {
  return { items, total, page: 1, page_size: 20 }
}

function renderList() {
  return renderWithProviders(<OrdersPage />, { route: '/account/orders', user: testCustomer })
}

describe('OrdersPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('test_orders_list_renders_rows_and_links', async () => {
    const shipped = order({
      id: 2,
      status: 'shipped',
      total: '250.00',
      item_count: 1,
      created_at: '2026-10-07T09:30:00Z',
    })
    const get = vi.spyOn(api, 'get').mockResolvedValue(ordersPage([order(), shipped]))
    renderList()
    const firstLink = await screen.findByRole('link', {
      name: t('account.order_number', { id: 1 }),
    })
    expect(firstLink).toHaveAttribute('href', '/account/orders/1')
    const secondLink = screen.getByRole('link', { name: t('account.order_number', { id: 2 }) })
    expect(secondLink).toHaveAttribute('href', '/account/orders/2')
    expect(screen.getByText(t('common.status_new'))).toBeInTheDocument()
    expect(screen.getByText(t('common.status_shipped'))).toBeInTheDocument()
    expect(screen.getByText(price('1299.90'))).toBeInTheDocument()
    expect(screen.getByText(price('250.00'))).toBeInTheDocument()
    expect(screen.getByText(formatDate('2026-10-08T12:00:00Z'))).toBeInTheDocument()
    expect(get).toHaveBeenCalledWith('/orders', { page: 1 })
  })

  it('test_orders_next_page_requests_page_two', async () => {
    const get = vi
      .spyOn(api, 'get')
      .mockResolvedValue({ items: [order()], total: 25, page: 1, page_size: 20 })
    renderList()
    await userEvent.click(await screen.findByRole('button', { name: t('common.next') }))
    expect(get).toHaveBeenLastCalledWith('/orders', { page: 2 })
  })

  it('test_orders_empty_state', async () => {
    vi.spyOn(api, 'get').mockResolvedValue(ordersPage([]))
    renderList()
    expect(await screen.findByText(t('account.orders_empty'))).toBeInTheDocument()
  })

})
