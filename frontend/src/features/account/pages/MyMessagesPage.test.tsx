import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MyMessagesPage from '@/features/account/pages/MyMessagesPage'
import { api, ApiError } from '@/lib/api'
import { errorMessage, t } from '@/lib/i18n'
import type { Message, Page } from '@/lib/types'
import { renderWithProviders, testCustomer } from '@/test/utils'

function message(overrides: Partial<Message> = {}): Message {
  return {
    id: 1,
    direction: 'inbound',
    subject: 'Kargo hakkında',
    body: 'Siparişim ne zaman gelir?',
    status: 'read',
    name: testCustomer.full_name,
    email: testCustomer.email,
    created_at: '2026-10-08T12:00:00Z',
    ...overrides,
  }
}

function messagesPage(items: Message[], total = items.length): Page<Message> {
  return { items, total, page: 1, page_size: 20 }
}

function renderMessages() {
  return renderWithProviders(<MyMessagesPage />, {
    route: '/account/messages',
    user: testCustomer,
  })
}

describe('MyMessagesPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('test_my_messages_show_direction_labels', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue(
      messagesPage([
        message(),
        message({ id: 2, direction: 'outbound', subject: 'Sipariş onayı', body: 'Onaylandı.' }),
      ]),
    )
    renderMessages()
    const inboundRow = (await screen.findByText('Kargo hakkında')).closest('tr')!
    expect(within(inboundRow).getByText(t('account.direction_inbound'))).toBeInTheDocument()
    const outboundRow = screen.getByText('Sipariş onayı').closest('tr')!
    expect(within(outboundRow).getByText(t('account.direction_outbound'))).toBeInTheDocument()
    expect(get).toHaveBeenCalledWith('/me/messages', { page: 1 })
  })

  it('test_my_messages_next_page_requests_page_two', async () => {
    const get = vi
      .spyOn(api, 'get')
      .mockResolvedValue({ items: [message()], total: 25, page: 1, page_size: 20 })
    renderMessages()
    await userEvent.click(await screen.findByRole('button', { name: t('common.next') }))
    expect(get).toHaveBeenLastCalledWith('/me/messages', { page: 2 })
  })

  it('shows the translated message when the list cannot be loaded', async () => {
    const error = new ApiError(500, 'unknown')
    vi.spyOn(api, 'get').mockRejectedValue(error)
    renderMessages()
    expect(await screen.findByRole('alert')).toHaveTextContent(errorMessage(error))
  })
})
