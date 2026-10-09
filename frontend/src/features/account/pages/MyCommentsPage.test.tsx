import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MyCommentsPage from '@/features/account/pages/MyCommentsPage'
import { api, ApiError } from '@/lib/api'
import { errorMessage, t } from '@/lib/i18n'
import type { MyComment, Page } from '@/lib/types'
import { renderWithProviders, testCustomer } from '@/test/utils'

function comment(overrides: Partial<MyComment> = {}): MyComment {
  return {
    id: 1,
    product_id: 5,
    user_id: testCustomer.id,
    author_name: testCustomer.full_name,
    body: 'Çok memnun kaldım',
    created_at: '2026-10-08T12:00:00Z',
    product_name: 'Mekanik Klavye',
    rating: null,
    ...overrides,
  }
}

function commentsPage(items: MyComment[], total = items.length): Page<MyComment> {
  return { items, total, page: 1, page_size: 20 }
}

function renderComments() {
  return renderWithProviders(<MyCommentsPage />, {
    route: '/account/comments',
    user: testCustomer,
  })
}

describe('MyCommentsPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('test_my_comments_renders_rows_with_product_links', async () => {
    const get = vi
      .spyOn(api, 'get')
      .mockResolvedValue(
        commentsPage([
          comment(),
          comment({ id: 2, product_id: 6, product_name: 'Kablo', body: 'Kaliteli bir kablo' }),
        ]),
      )
    renderComments()
    expect(await screen.findByText('Çok memnun kaldım')).toBeInTheDocument()
    expect(screen.getByText('Kaliteli bir kablo')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Mekanik Klavye' })).toHaveAttribute(
      'href',
      '/products/5',
    )
    expect(screen.getByRole('link', { name: 'Kablo' })).toHaveAttribute('href', '/products/6')
    expect(get).toHaveBeenCalledWith('/me/comments', { page: 1 })
  })

  it('test_my_comments_delete_calls_api_and_refetches', async () => {
    const get = vi
      .spyOn(api, 'get')
      .mockResolvedValueOnce(commentsPage([comment()]))
      .mockResolvedValue(commentsPage([]))
    const del = vi.spyOn(api, 'delete').mockResolvedValue(undefined)
    renderComments()
    const row = (await screen.findByText('Çok memnun kaldım')).closest('tr')!
    await userEvent.click(within(row).getByRole('button', { name: t('common.delete') }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: t('common.delete') }))
    await waitFor(() => expect(del).toHaveBeenCalledWith('/comments/1'))
    // The list is fetched again after the delete, so the emptied list is shown.
    expect(await screen.findByText(t('account.comments_empty'))).toBeInTheDocument()
    expect(get).toHaveBeenCalledTimes(2)
  })

  it('shows the translated message when the list cannot be loaded', async () => {
    const error = new ApiError(500, 'unknown')
    vi.spyOn(api, 'get').mockRejectedValue(error)
    renderComments()
    expect(await screen.findByRole('alert')).toHaveTextContent(errorMessage(error))
  })
})
