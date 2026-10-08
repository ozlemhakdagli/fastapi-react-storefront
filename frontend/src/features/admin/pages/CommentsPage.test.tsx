import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CommentsPage from '@/features/admin/pages/CommentsPage'
import { api, ApiError } from '@/lib/api'
import { errorMessage, t } from '@/lib/i18n'
import type { AdminComment, Page } from '@/lib/types'
import { renderWithProviders, testAdmin } from '@/test/utils'

const comment: AdminComment = {
  id: 101,
  product_id: 5,
  user_id: 2,
  author_name: 'Ayşe Yılmaz',
  author_email: 'ayse@example.com',
  body: 'Klavye çok rahat, tavsiye ederim.',
  created_at: '2026-10-08T12:00:00Z',
  product_name: 'Mekanik Klavye',
}

const second: AdminComment = {
  ...comment,
  id: 102,
  product_id: 6,
  user_id: 3,
  author_name: 'Mehmet Kaya',
  author_email: 'mehmet@example.com',
  body: 'Kargo hızlıydı.',
  product_name: 'Kablosuz Mouse',
}

function page(items: AdminComment[], total = items.length): Page<AdminComment> {
  return { items, total, page: 1, page_size: 20 }
}

function renderComments() {
  return renderWithProviders(<CommentsPage />, { user: testAdmin })
}

/** The table row that shows the given comment text. */
async function rowOf(body: string): Promise<HTMLElement> {
  const cell = await screen.findByText(body)
  return cell.closest('tr') as HTMLElement
}

describe('CommentsPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('test_comments_renders_rows_from_api', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue(page([comment, second]))
    renderComments()
    expect(await screen.findByText(comment.body)).toBeInTheDocument()
    expect(screen.getByText(comment.author_email)).toBeInTheDocument()
    expect(screen.getByText(comment.product_name)).toBeInTheDocument()
    expect(get).toHaveBeenCalledWith(
      '/admin/comments',
      expect.objectContaining({ page: 1, page_size: 20 }),
    )
  })

  it('test_comments_next_page_requests_page_two', async () => {
    const get = vi
      .spyOn(api, 'get')
      .mockResolvedValue({ items: [comment], total: 25, page: 1, page_size: 20 })
    renderComments()
    await screen.findByText(comment.body)
    await userEvent.click(screen.getByRole('button', { name: t('common.next') }))
    await waitFor(() =>
      expect(get).toHaveBeenLastCalledWith(
        '/admin/comments',
        expect.objectContaining({ page: 2 }),
      ),
    )
  })

  it('test_comments_delete_refetches', async () => {
    const get = vi
      .spyOn(api, 'get')
      .mockResolvedValueOnce(page([comment, second]))
      .mockResolvedValue(page([second]))
    const del = vi.spyOn(api, 'delete').mockResolvedValue(undefined)
    renderComments()
    const row = await rowOf(comment.body)
    await userEvent.click(within(row).getByRole('button', { name: t('common.delete') }))
    const dialog = await screen.findByRole('dialog')
    expect(del).not.toHaveBeenCalled() // the confirmation comes first
    await userEvent.click(within(dialog).getByRole('button', { name: t('common.delete') }))
    await waitFor(() => expect(del).toHaveBeenCalledWith('/comments/101'))
    // The list is fetched again, so the deleted comment is gone.
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(screen.queryByText(comment.body)).not.toBeInTheDocument())
    expect(screen.getByText(second.body)).toBeInTheDocument()
  })

  it('test_comments_delete_error_shows_message', async () => {
    vi.spyOn(api, 'get').mockResolvedValue(page([comment]))
    const error = new ApiError(404, 'not_found')
    vi.spyOn(api, 'delete').mockRejectedValue(error)
    renderComments()
    const row = await rowOf(comment.body)
    await userEvent.click(within(row).getByRole('button', { name: t('common.delete') }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: t('common.delete') }))
    expect(await screen.findByRole('alert')).toHaveTextContent(errorMessage(error))
  })
})
