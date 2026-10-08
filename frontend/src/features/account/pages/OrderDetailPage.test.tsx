import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OrderDetailPage from '@/features/account/pages/OrderDetailPage'
import { api, ApiError } from '@/lib/api'
import { formatMoney } from '@/lib/format'
import { errorMessage, t } from '@/lib/i18n'
import { type Order, ORDER_STATUSES } from '@/lib/types'
import { renderWithProviders, testCustomer } from '@/test/utils'

// Intl may put a non-breaking space before the lira sign. The default text matcher only
// collapses ordinary whitespace, so the expected text is normalized the same way.
function price(value: string): string {
  return formatMoney(value).replace(/\s/g, ' ')
}

function order(overrides: Partial<Order> = {}): Order {
  return {
    id: 5,
    status: 'new',
    total: '2599.80',
    item_count: 2,
    created_at: '2026-10-08T12:00:00Z',
    ship_name: 'Ayşe Yılmaz',
    ship_phone: '05320000000',
    ship_address: 'Moda Cad. 1, Kadıköy, İstanbul',
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
    ],
    ...overrides,
  }
}

function renderDetail(route = '/account/orders/5') {
  return renderWithProviders(<OrderDetailPage />, {
    route,
    path: '/account/orders/:id',
    user: testCustomer,
  })
}

/** The title appears once the order has loaded. */
function findTitle() {
  return screen.findByRole('heading', { name: t('account.order_number', { id: 5 }) })
}

describe('OrderDetailPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the items, shipping data and status from the API', async () => {
    const get = vi
      .spyOn(api, 'get')
      .mockResolvedValue(order({ cargo_company: 'Yurtiçi Kargo', tracking_no: 'YK123456' }))
    renderDetail()
    await findTitle()
    expect(screen.getByText('Mekanik Klavye')).toBeInTheDocument()
    expect(screen.getByText('Ayşe Yılmaz')).toBeInTheDocument()
    expect(screen.getByText('05320000000')).toBeInTheDocument()
    expect(screen.getByText('Moda Cad. 1, Kadıköy, İstanbul')).toBeInTheDocument()
    expect(screen.getByText(t('common.status_new'))).toBeInTheDocument()
    expect(screen.getByText('Yurtiçi Kargo')).toBeInTheDocument()
    expect(screen.getByText('YK123456')).toBeInTheDocument()
    // The total and the line total are both 2599.80, so the amount appears more than once.
    expect(screen.getAllByText(price('2599.80'))).not.toHaveLength(0)
    expect(get).toHaveBeenCalledWith('/orders/5')
  })

  it.each(ORDER_STATUSES)('test_order_detail_shows_cancel_only_for_new (%s)', async (status) => {
    vi.spyOn(api, 'get').mockResolvedValue(order({ status }))
    renderDetail()
    await findTitle()
    const shown = screen.queryByRole('button', { name: t('account.order_cancel') }) !== null
    expect(shown).toBe(status === 'new')
  })

  it('test_cancel_confirms_then_posts', async () => {
    const get = vi
      .spyOn(api, 'get')
      .mockResolvedValueOnce(order())
      .mockResolvedValue(order({ status: 'cancelled' }))
    const post = vi.spyOn(api, 'post').mockResolvedValue(order({ status: 'cancelled' }))
    renderDetail()
    await userEvent.click(await screen.findByRole('button', { name: t('account.order_cancel') }))
    const dialog = await screen.findByRole('dialog')
    expect(post).not.toHaveBeenCalled() // the confirmation comes first
    await userEvent.click(
      within(dialog).getByRole('button', { name: t('account.order_cancel_confirm') }),
    )
    await waitFor(() => expect(post).toHaveBeenCalledWith('/orders/5/cancel'))
    // Cancelling invalidates the ['orders'] queries, so the order is fetched again.
    expect(await screen.findByText(t('common.status_cancelled'))).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: t('account.order_cancel') }),
    ).not.toBeInTheDocument()
    expect(get).toHaveBeenCalledTimes(2)
  })

  it('shows the translated message when cancelling fails and reloads the order', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue(order())
    const error = new ApiError(409, 'invalid_status_transition')
    vi.spyOn(api, 'post').mockRejectedValue(error)
    renderDetail()
    await userEvent.click(await screen.findByRole('button', { name: t('account.order_cancel') }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(
      within(dialog).getByRole('button', { name: t('account.order_cancel_confirm') }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(errorMessage(error))
    // A refused cancel refreshes the order, because the server's status may have moved on.
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2))
  })

  it('test_placed_banner_visible_with_query_flag', async () => {
    vi.spyOn(api, 'get').mockResolvedValue(order())
    renderDetail('/account/orders/5?placed=1')
    expect(await screen.findByRole('status')).toHaveTextContent(t('account.order_placed'))
  })

  it('test_placed_banner_hidden_without_query_flag', async () => {
    vi.spyOn(api, 'get').mockResolvedValue(order())
    renderDetail('/account/orders/5')
    await findTitle()
    expect(screen.queryByText(t('account.order_placed'))).not.toBeInTheDocument()
  })

  it('shows the translated message when the order cannot be loaded', async () => {
    const error = new ApiError(404, 'not_found')
    vi.spyOn(api, 'get').mockRejectedValue(error)
    renderDetail()
    expect(await screen.findByRole('alert')).toHaveTextContent(errorMessage(error))
  })
})
