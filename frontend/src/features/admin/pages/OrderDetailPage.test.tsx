import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OrderDetailPage from '@/features/admin/pages/OrderDetailPage'
import { api, ApiError } from '@/lib/api'
import { errorMessage, t } from '@/lib/i18n'
import { type AdminOrder, type OrderStatus } from '@/lib/types'
import { price, renderWithProviders, testAdmin } from '@/test/utils'

// The status select offers the current status first, then the allowed next ones. The whole
// table is checked in orderTransitions.test.ts; two rows show that the page uses it.
const OFFERED: [OrderStatus, OrderStatus[]][] = [
  ['new', ['new', 'approved', 'rejected', 'cancelled']],
  ['shipped', ['shipped', 'completed']],
]

const FINAL_STATUSES: OrderStatus[] = ['completed']

function order(overrides: Partial<AdminOrder> = {}): AdminOrder {
  return {
    id: 5,
    status: 'new',
    total: '2599.80',
    item_count: 2,
    created_at: '2026-10-08T12:00:00Z',
    customer: { id: 2, email: 'jane.doe@example.com', full_name: 'Jane Doe' },
    ship_name: 'Mary Major',
    ship_phone: '+1 555 010 0100',
    ship_address: '12 Example Street\nSpringfield',
    cargo_company: 'Example Cargo',
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
    ...overrides,
  }
}

function renderDetail() {
  return renderWithProviders(<OrderDetailPage />, {
    route: '/admin/orders/5',
    path: '/admin/orders/:id',
    user: testAdmin,
  })
}

/** The form appears once the order has loaded. */
function findStatusSelect() {
  return screen.findByLabelText(t('adminorders.status_label'))
}

function saveButton() {
  return screen.getByRole('button', { name: t('common.save') })
}

describe('OrderDetailPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the customer, shipping, items and current status from the API', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue(order())
    renderDetail()
    expect(
      await screen.findByRole('heading', { name: t('adminorders.detail_title', { id: 5 }) }),
    ).toBeInTheDocument()
    expect(screen.getByText('jane.doe@example.com')).toBeInTheDocument()
    expect(screen.getByText('Mary Major')).toBeInTheDocument()
    expect(screen.getByText('+1 555 010 0100')).toBeInTheDocument()
    expect(screen.getByText('12 Example Street Springfield')).toBeInTheDocument()
    expect(screen.getByText('Mechanical Keyboard')).toBeInTheDocument()
    // The total and the line total are both 2599.80, so the amount appears more than once.
    expect(screen.getAllByText(price('2599.80'))).not.toHaveLength(0)
    expect(await findStatusSelect()).toHaveValue('new')
    expect(screen.getByLabelText(t('adminorders.cargo_company_label'))).toHaveValue('Example Cargo')
    expect(get).toHaveBeenCalledWith('/admin/orders/5')
  })

  it.each(OFFERED)(
    'test_detail_status_select_offers_only_allowed_next (%s)',
    async (status, offered) => {
      vi.spyOn(api, 'get').mockResolvedValue(order({ status }))
      renderDetail()
      const select = await findStatusSelect()
      expect(
        within(select)
          .getAllByRole('option')
          .map((option) => option.getAttribute('value')),
      ).toEqual(offered)
    },
  )

  it('test_detail_patch_sends_only_changed_fields', async () => {
    const saved = order({
      status: 'approved',
      tracking_no: 'YK123456',
      updated_at: '2026-10-08T13:00:00Z',
    })
    const get = vi.spyOn(api, 'get').mockResolvedValueOnce(order()).mockResolvedValue(saved)
    const patch = vi.spyOn(api, 'patch').mockResolvedValue(saved)
    renderDetail()
    await userEvent.selectOptions(await findStatusSelect(), 'approved')
    await userEvent.type(screen.getByLabelText(t('adminorders.tracking_no_label')), 'YK123456')
    await userEvent.click(saveButton())
    // The cargo company was not touched, so it is not sent.
    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith('/admin/orders/5', {
        status: 'approved',
        tracking_no: 'YK123456',
      }),
    )
    expect(await screen.findByRole('status')).toHaveTextContent(t('adminorders.saved'))
    // The saved order is fetched again, so the form shows the server's values.
    await waitFor(() =>
      expect(screen.getByLabelText(t('adminorders.status_label'))).toHaveValue('approved'),
    )
    expect(get).toHaveBeenCalledTimes(2)
  })

  it('clears a field by sending null', async () => {
    vi.spyOn(api, 'get').mockResolvedValue(order())
    const patch = vi.spyOn(api, 'patch').mockResolvedValue(order({ cargo_company: null }))
    renderDetail()
    await userEvent.clear(await screen.findByLabelText(t('adminorders.cargo_company_label')))
    await userEvent.click(saveButton())
    await waitFor(() =>
      expect(patch).toHaveBeenCalledWith('/admin/orders/5', { cargo_company: null }),
    )
  })

  it('keeps save disabled until a field changes', async () => {
    vi.spyOn(api, 'get').mockResolvedValue(order())
    renderDetail()
    await findStatusSelect()
    expect(saveButton()).toBeDisabled()
    await userEvent.type(screen.getByLabelText(t('adminorders.admin_note_label')), 'Arandı')
    expect(saveButton()).toBeEnabled()
  })

  it('test_detail_invalid_transition_shows_error', async () => {
    vi.spyOn(api, 'get').mockResolvedValue(order())
    const error = new ApiError(409, 'invalid_status_transition')
    const patch = vi.spyOn(api, 'patch').mockRejectedValue(error)
    renderDetail()
    await userEvent.selectOptions(await findStatusSelect(), 'approved')
    await userEvent.click(saveButton())
    expect(await screen.findByRole('alert')).toHaveTextContent(errorMessage(error))
    expect(patch).toHaveBeenCalledWith('/admin/orders/5', { status: 'approved' })
  })

  it.each(FINAL_STATUSES)('test_final_status_disables_status_select (%s)', async (status) => {
    vi.spyOn(api, 'get').mockResolvedValue(order({ status }))
    renderDetail()
    expect(await findStatusSelect()).toBeDisabled()
    expect(screen.getByText(t('adminorders.status_final'))).toBeInTheDocument()
  })

  it('links to the printable invoice', async () => {
    vi.spyOn(api, 'get').mockResolvedValue(order())
    renderDetail()
    expect(await screen.findByRole('link', { name: t('invoice.link') })).toHaveAttribute(
      'href',
      '/admin/orders/5/invoice',
    )
  })

  it('shows the translated message when the order cannot be loaded', async () => {
    const error = new ApiError(404, 'not_found')
    vi.spyOn(api, 'get').mockRejectedValue(error)
    renderDetail()
    expect(await screen.findByRole('alert')).toHaveTextContent(errorMessage(error))
  })
})
