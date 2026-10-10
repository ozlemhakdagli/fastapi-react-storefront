import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MessagesPage from '@/features/admin/pages/MessagesPage'
import { api, ApiError } from '@/lib/api'
import { errorMessage, t } from '@/lib/i18n'
import type { AdminMessage, Page } from '@/lib/types'
import { renderWithProviders, testAdmin } from '@/test/utils'

const inbound: AdminMessage = {
  id: 3,
  direction: 'inbound',
  subject: 'Question about an order',
  body: 'When will my order be shipped?',
  status: 'new',
  name: 'Jane Doe',
  email: 'jane.doe@example.com',
  phone: '+1 555 010 0100',
  user_id: 2,
  admin_note: null,
  created_at: '2026-10-08T12:00:00Z',
}

// A visitor without an account: the message has no user_id, so it cannot be answered.
const guest: AdminMessage = {
  ...inbound,
  id: 4,
  subject: 'Message from a visitor',
  body: 'Hello, I would like to know the return terms.',
  status: 'read',
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: null,
  user_id: null,
}

function page(items: AdminMessage[]): Page<AdminMessage> {
  return { items, total: items.length, page: 1, page_size: 20 }
}

function renderMessages() {
  return renderWithProviders(<MessagesPage />, { user: testAdmin })
}

/** Serves the list for GET /admin/messages and the message itself for GET /admin/messages/:id. */
function mockGet(list: AdminMessage[]) {
  return vi.spyOn(api, 'get').mockImplementation(async (path: string) => {
    if (path === '/admin/messages') return page(list)
    const id = Number(path.split('/').pop())
    return list.find((message) => message.id === id)
  })
}

/** Selects a message in the list and returns the detail panel. */
async function openMessage(subject: string) {
  await userEvent.click(await screen.findByRole('button', { name: subject }))
  return screen.findByRole('region', { name: t('adminmessages.detail_title') })
}

describe('MessagesPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('test_messages_renders_list_from_api', async () => {
    const get = mockGet([inbound, guest])
    renderMessages()
    expect(await screen.findByRole('button', { name: inbound.subject })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: guest.subject })).toBeInTheDocument()
    expect(screen.getByText(inbound.email)).toBeInTheDocument()
    expect(get).toHaveBeenCalledWith(
      '/admin/messages',
      expect.objectContaining({ page: 1, page_size: 20 }),
    )
  })

  it('test_messages_filter_params', async () => {
    const get = mockGet([inbound])
    renderMessages()
    await screen.findByRole('button', { name: inbound.subject })
    await userEvent.selectOptions(screen.getByLabelText(t('adminmessages.filter_status')), 'new')
    await waitFor(() =>
      expect(get).toHaveBeenLastCalledWith(
        '/admin/messages',
        expect.objectContaining({ status: 'new', page: 1 }),
      ),
    )
    await userEvent.selectOptions(
      screen.getByLabelText(t('adminmessages.filter_direction')),
      'inbound',
    )
    await waitFor(() =>
      expect(get).toHaveBeenLastCalledWith(
        '/admin/messages',
        expect.objectContaining({ status: 'new', direction: 'inbound', page: 1 }),
      ),
    )
  })

  it('test_messages_patch_status_and_note', async () => {
    // The server keeps the message, so each PATCH changes what the next GET returns.
    let stored: AdminMessage = inbound
    vi.spyOn(api, 'get').mockImplementation(async (path: string) =>
      path === '/admin/messages' ? page([stored]) : stored,
    )
    const patch = vi
      .spyOn(api, 'patch')
      .mockImplementation(async (_path: string, body?: unknown) => {
        stored = { ...stored, ...(body as Partial<AdminMessage>) }
        return stored
      })
    renderMessages()
    const panel = await openMessage(inbound.subject)

    await userEvent.click(
      await within(panel).findByRole('button', { name: t('adminmessages.mark_read') }),
    )
    await waitFor(() => expect(patch).toHaveBeenCalledWith('/admin/messages/3', { status: 'read' }))
    // The detail is fetched again after the change, so the button now offers the opposite.
    expect(
      await within(panel).findByRole('button', { name: t('adminmessages.mark_unread') }),
    ).toBeInTheDocument()

    await userEvent.type(
      within(panel).getByLabelText(t('adminmessages.field_note')),
      'Talked to the customer on the phone.',
    )
    await userEvent.click(within(panel).getByRole('button', { name: t('adminmessages.save_note') }))
    await waitFor(() =>
      expect(patch).toHaveBeenLastCalledWith('/admin/messages/3', {
        admin_note: 'Talked to the customer on the phone.',
      }),
    )
    expect(patch).toHaveBeenCalledTimes(2)
  })

  it('test_messages_reply_posts_outbound_body_only_when_user_id_present', async () => {
    mockGet([inbound])
    const post = vi.spyOn(api, 'post').mockResolvedValue(inbound)
    renderMessages()
    const panel = await openMessage(inbound.subject)
    await userEvent.type(
      await within(panel).findByLabelText(t('adminmessages.reply_subject')),
      'About your order',
    )
    await userEvent.type(
      within(panel).getByLabelText(t('adminmessages.reply_body')),
      'Your parcel leaves tomorrow.',
    )
    await userEvent.click(within(panel).getByRole('button', { name: t('adminmessages.reply_send') }))
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/admin/messages', {
        user_id: 2,
        subject: 'About your order',
        body: 'Your parcel leaves tomorrow.',
      }),
    )
  })

  it('test_messages_reply_hidden_without_user_id', async () => {
    mockGet([guest])
    const post = vi.spyOn(api, 'post')
    renderMessages()
    const panel = await openMessage(guest.subject)
    expect(await within(panel).findByText(guest.body)).toBeInTheDocument()
    expect(within(panel).queryByLabelText(t('adminmessages.reply_subject'))).not.toBeInTheDocument()
    expect(within(panel).getByText(t('adminmessages.no_account'))).toBeInTheDocument()
    expect(post).not.toHaveBeenCalled()
  })

  it('test_messages_delete_confirms_then_deletes', async () => {
    mockGet([inbound])
    const del = vi.spyOn(api, 'delete').mockResolvedValue(undefined)
    renderMessages()
    const panel = await openMessage(inbound.subject)
    await userEvent.click(
      await within(panel).findByRole('button', { name: t('adminmessages.delete') }),
    )
    const dialog = await screen.findByRole('dialog')
    expect(del).not.toHaveBeenCalled() // the confirmation comes first
    await userEvent.click(within(dialog).getByRole('button', { name: t('common.delete') }))
    await waitFor(() => expect(del).toHaveBeenCalledWith('/admin/messages/3'))
    // Without a selected message the detail column shows the hint again.
    expect(await screen.findByText(t('adminmessages.select_hint'))).toBeInTheDocument()
  })

  it('test_messages_patch_error_shows_message', async () => {
    mockGet([inbound])
    const error = new ApiError(404, 'not_found')
    vi.spyOn(api, 'patch').mockRejectedValue(error)
    renderMessages()
    const panel = await openMessage(inbound.subject)
    await userEvent.click(
      await within(panel).findByRole('button', { name: t('adminmessages.mark_read') }),
    )
    expect(await within(panel).findByRole('alert')).toHaveTextContent(errorMessage(error))
  })
})
