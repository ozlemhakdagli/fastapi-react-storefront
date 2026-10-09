import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductComments } from '@/features/catalog/components/ProductComments'
import { api, ApiError } from '@/lib/api'
import { errorMessage, t } from '@/lib/i18n'
import type { Comment, Page } from '@/lib/types'
import { renderWithProviders, testCustomer } from '@/test/utils'

function comment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: 1,
    product_id: 5,
    user_id: 9,
    author_name: 'Mehmet Kaya',
    body: 'Çok memnun kaldım',
    created_at: '2026-10-08T12:00:00Z',
    rating: null,
    ...overrides,
  }
}

function commentsPage(items: Comment[]): Page<Comment> {
  return { items, total: items.length, page: 1, page_size: 20 }
}

/** Answers each GET by its path; an unexpected path fails the test. */
function mockGet(responses: Record<string, unknown>) {
  return vi.spyOn(api, 'get').mockImplementation(async (path: string) => {
    if (!(path in responses)) throw new Error(`unexpected GET ${path}`)
    return responses[path]
  })
}

describe('ProductComments', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('offers the rating input to a logged-in buyer who can rate', async () => {
    mockGet({
      '/products/5/comments': commentsPage([]),
      '/me/ratings/5': { rating: null, can_rate: true },
    })
    renderWithProviders(<ProductComments productId={5} />, { user: testCustomer })
    expect(
      await screen.findByRole('radiogroup', { name: t('catalog.rating_your') }),
    ).toBeInTheDocument()
    expect(screen.queryByText(t('catalog.rating_purchase_hint'))).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: t('catalog.rating_remove') })).not.toBeInTheDocument()
  })

  it('shows the purchase hint instead of the input to a logged-in user who cannot rate', async () => {
    mockGet({
      '/products/5/comments': commentsPage([]),
      '/me/ratings/5': { rating: null, can_rate: false },
    })
    renderWithProviders(<ProductComments productId={5} />, { user: testCustomer })
    expect(await screen.findByText(t('catalog.rating_purchase_hint'))).toBeInTheDocument()
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
  })

  it('shows neither the input nor the hint to a visitor, and asks for no rating', async () => {
    const get = mockGet({ '/products/5/comments': commentsPage([]) })
    renderWithProviders(<ProductComments productId={5} />)
    expect(await screen.findByText(t('catalog.comments_empty'))).toBeInTheDocument()
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
    expect(screen.queryByText(t('catalog.rating_purchase_hint'))).not.toBeInTheDocument()
    expect(get).not.toHaveBeenCalledWith('/me/ratings/5')
  })

  it('sends the chosen stars to the server', async () => {
    mockGet({
      '/products/5/comments': commentsPage([]),
      '/me/ratings/5': { rating: null, can_rate: true },
    })
    const put = vi.spyOn(api, 'put').mockResolvedValue({ rating: 4, can_rate: true })
    renderWithProviders(<ProductComments productId={5} />, { user: testCustomer })
    await userEvent.click(
      await screen.findByRole('radio', { name: t('catalog.rating_input_star', { count: 4 }) }),
    )
    await waitFor(() => expect(put).toHaveBeenCalledWith('/me/ratings/5', { rating: 4 }))
  })

  it('removes the rating when the buyer asks for it', async () => {
    mockGet({
      '/products/5/comments': commentsPage([]),
      '/me/ratings/5': { rating: 4, can_rate: true },
    })
    const del = vi.spyOn(api, 'delete').mockResolvedValue(undefined)
    renderWithProviders(<ProductComments productId={5} />, { user: testCustomer })
    await userEvent.click(await screen.findByRole('button', { name: t('catalog.rating_remove') }))
    await waitFor(() => expect(del).toHaveBeenCalledWith('/me/ratings/5'))
  })

  it('shows the message when the server refuses a rating', async () => {
    const error = new ApiError(403, 'purchase_required')
    mockGet({
      '/products/5/comments': commentsPage([]),
      '/me/ratings/5': { rating: null, can_rate: true },
    })
    vi.spyOn(api, 'put').mockRejectedValue(error)
    renderWithProviders(<ProductComments productId={5} />, { user: testCustomer })
    await userEvent.click(
      await screen.findByRole('radio', { name: t('catalog.rating_input_star', { count: 2 }) }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(errorMessage(error))
  })

  it('shows the stars of the author of each comment that has a rating', async () => {
    mockGet({
      '/products/5/comments': commentsPage([
        comment({ id: 1, author_name: 'Mehmet Kaya', body: 'Güzel ürün', rating: 4 }),
        comment({ id: 2, author_name: 'Zeynep Demir', body: 'Kargo ne zaman?', rating: null }),
      ]),
    })
    renderWithProviders(<ProductComments productId={5} />)
    const rated = (await screen.findByText('Güzel ürün')).closest('li')!
    expect(
      within(rated).getByRole('img', { name: t('catalog.rating_value', { value: '4,0' }) }),
    ).toBeInTheDocument()
    const unrated = screen.getByText('Kargo ne zaman?').closest('li')!
    expect(within(unrated).queryByRole('img')).not.toBeInTheDocument()
  })
})
