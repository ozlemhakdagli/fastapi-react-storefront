import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OrderDetailPage from '@/features/account/pages/OrderDetailPage'
import { api, ApiError } from '@/lib/api'
import { errorMessage, t } from '@/lib/i18n'
import type { Order, OrderStatus } from '@/lib/types'
import { price, renderWithProviders, testCustomer } from '@/test/utils'

function order(overrides: Partial<Order> = {}): Order {
  return {
    id: 5,
    status: 'new',
    total: '2599.80',
    item_count: 2,
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
      .mockResolvedValue(order({ cargo_company: 'Example Cargo', tracking_no: 'YK123456' }))
    renderDetail()
    await findTitle()
    expect(screen.getByText('Mechanical Keyboard')).toBeInTheDocument()
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('+1 555 010 0100')).toBeInTheDocument()
    expect(screen.getByText('12 Example Street, Springfield')).toBeInTheDocument()
    // The status shows in the badge and as the first step of the timeline.
    expect(screen.getAllByText(t('common.status_new'))).toHaveLength(2)
    const progress = screen.getByRole('list', { name: t('account.order_progress') })
    expect(within(progress).getByRole('listitem', { current: 'step' })).toHaveTextContent(
      t('common.status_new'),
    )
    expect(screen.getByText('Example Cargo')).toBeInTheDocument()
    expect(screen.getByText('YK123456')).toBeInTheDocument()
    // The total and the line total are both 2599.80, so the amount appears more than once.
    expect(screen.getAllByText(price('2599.80'))).toHaveLength(2)
    expect(get).toHaveBeenCalledWith('/orders/5')
  })

  it('links to the printable invoice', async () => {
    vi.spyOn(api, 'get').mockResolvedValue(order())
    renderDetail()
    expect(await screen.findByRole('link', { name: t('invoice.link') })).toHaveAttribute(
      'href',
      '/account/orders/5/invoice',
    )
  })

  it.each<OrderStatus>(['new', 'approved'])('test_order_detail_shows_cancel_only_for_new (%s)', async (status) => {
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
    // Cancelling invalidates the ['orders'] queries, so the order is fetched again. The cancelled
    // state then shows in the badge and in the timeline, which has no steps left.
    await waitFor(() => expect(screen.getAllByText(t('common.status_cancelled'))).toHaveLength(2))
    expect(
      screen.queryByRole('list', { name: t('account.order_progress') }),
    ).not.toBeInTheDocument()
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
