import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes, useLocation } from 'react-router'
import ProductDetailPage from '@/features/catalog/pages/ProductDetailPage'
import { api, ApiError } from '@/lib/api'
import { errorMessage, t } from '@/lib/i18n'
import type { Cart, Comment, Page, ProductDetail, User } from '@/lib/types'
import { renderWithProviders, testCustomer } from '@/test/utils'

const product: ProductDetail = {
  id: 5,
  sku: 'KL-100',
  name: 'Mekanik Klavye',
  short_description: 'Kırmızı anahtarlı',
  price: '1299.90',
  stock: 10,
  is_new: true,
  brand: { id: 7, name: 'Logitech' },
  category: { id: 1, name: 'Klavyeler' },
  image_url: '/api/media/k1.jpg',
  description: 'Uzun açıklama',
  images: [
    { id: 1, url: '/api/media/k1.jpg', position: 0 },
    { id: 2, url: '/api/media/k2.jpg', position: 1 },
  ],
  created_at: '2026-10-08T12:00:00Z',
}

const emptyCart: Cart = { items: [], total: '0.00' }

function comment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: 1,
    product_id: 5,
    user_id: 9,
    author_name: 'Mehmet Kaya',
    body: 'Çok memnun kaldım',
    created_at: '2026-10-08T12:00:00Z',
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

/** Shows the router location and the path the guest was sent from, so that tests can read them. */
function LocationProbe() {
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname
  return (
    <>
      <span data-testid="location">{location.pathname}</span>
      <span data-testid="from">{from ?? ''}</span>
    </>
  )
}

function renderDetail(options: { user?: User | null } = {}) {
  return renderWithProviders(<ProductDetailPage />, {
    route: '/products/5',
    path: '/products/:id',
    user: options.user ?? null,
  })
}

describe('ProductDetailPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the product from the API', async () => {
    mockGet({ '/products/5': product, '/products/5/comments': commentsPage([]) })
    renderDetail()
    expect(await screen.findByRole('heading', { name: 'Mekanik Klavye' })).toBeInTheDocument()
    expect(screen.getByText(/1\.299,90/)).toBeInTheDocument()
    expect(screen.getByText('Uzun açıklama')).toBeInTheDocument()
  })

  it('shows the chosen thumbnail as the main image', async () => {
    mockGet({ '/products/5': product, '/products/5/comments': commentsPage([]) })
    renderDetail()
    await userEvent.click(
      await screen.findByRole('button', { name: t('catalog.thumbnail', { number: 2 }) }),
    )
    expect(screen.getByRole('img', { name: 'Mekanik Klavye' })).toHaveAttribute(
      'src',
      '/api/media/k2.jpg',
    )
  })

  it('test_detail_add_to_cart_posts_product_and_quantity', async () => {
    mockGet({ '/products/5': product, '/products/5/comments': commentsPage([]) })
    const post = vi.spyOn(api, 'post').mockResolvedValue(emptyCart)
    renderDetail({ user: testCustomer })
    const quantity = await screen.findByLabelText(t('catalog.quantity'))
    await userEvent.clear(quantity)
    await userEvent.type(quantity, '2')
    await userEvent.click(screen.getByRole('button', { name: t('catalog.add_to_cart') }))
    await waitFor(() => expect(post).toHaveBeenCalledWith('/cart/items', { product_id: 5, quantity: 2 }))
  })

  it('test_guest_add_to_cart_redirects_to_login', async () => {
    mockGet({ '/products/5': product, '/products/5/comments': commentsPage([]) })
    const post = vi.spyOn(api, 'post').mockResolvedValue(emptyCart)
    renderWithProviders(
      <Routes>
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/login" element={<LocationProbe />} />
      </Routes>,
      { route: '/products/5' },
    )
    await userEvent.click(await screen.findByRole('button', { name: t('catalog.add_to_cart') }))
    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/login'))
    expect(screen.getByTestId('from').textContent).toBe('/products/5')
    expect(post).not.toHaveBeenCalled()
  })

  it('test_out_of_stock_disables_add_button', async () => {
    mockGet({
      '/products/5': { ...product, stock: 0 },
      '/products/5/comments': commentsPage([]),
    })
    renderDetail({ user: testCustomer })
    expect(await screen.findByRole('button', { name: t('catalog.add_to_cart') })).toBeDisabled()
    expect(screen.getByText(t('catalog.out_of_stock'))).toBeInTheDocument()
  })

  it('test_comment_markup_renders_as_text', async () => {
    const payload = '<img src=x onerror=alert(1)>'
    mockGet({
      '/products/5': product,
      '/products/5/comments': commentsPage([comment({ body: payload })]),
    })
    renderDetail()
    expect(await screen.findByText(payload)).toBeInTheDocument()
    expect(document.querySelectorAll('img[src="x"]')).toHaveLength(0)
  })

  it('test_own_comment_has_delete_button_others_do_not', async () => {
    mockGet({
      '/products/5': product,
      '/products/5/comments': commentsPage([
        comment({ id: 1, user_id: testCustomer.id, author_name: 'Ayşe Yılmaz', body: 'Benim yorumum' }),
        comment({ id: 2, user_id: 9, author_name: 'Mehmet Kaya', body: 'Başkasının yorumu' }),
      ]),
    })
    renderDetail({ user: testCustomer })
    const own = (await screen.findByText('Benim yorumum')).closest('li')!
    const other = screen.getByText('Başkasının yorumu').closest('li')!
    expect(within(own).getByRole('button', { name: t('common.delete') })).toBeInTheDocument()
    expect(within(other).queryByRole('button', { name: t('common.delete') })).not.toBeInTheDocument()
  })

  it('deletes an own comment after confirmation', async () => {
    mockGet({
      '/products/5': product,
      '/products/5/comments': commentsPage([
        comment({ id: 1, user_id: testCustomer.id, body: 'Benim yorumum' }),
      ]),
    })
    const del = vi.spyOn(api, 'delete').mockResolvedValue(undefined)
    renderDetail({ user: testCustomer })
    const own = (await screen.findByText('Benim yorumum')).closest('li')!
    await userEvent.click(within(own).getByRole('button', { name: t('common.delete') }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: t('common.delete') }))
    await waitFor(() => expect(del).toHaveBeenCalledWith('/comments/1'))
  })

  it('posts the trimmed comment body for a logged-in user', async () => {
    mockGet({ '/products/5': product, '/products/5/comments': commentsPage([]) })
    const post = vi.spyOn(api, 'post').mockResolvedValue(comment({ user_id: testCustomer.id }))
    renderDetail({ user: testCustomer })
    await userEvent.type(await screen.findByLabelText(t('catalog.comment_body')), '  Harika ürün  ')
    await userEvent.click(screen.getByRole('button', { name: t('catalog.comment_submit') }))
    await waitFor(() =>
      expect(post).toHaveBeenCalledWith('/products/5/comments', { body: 'Harika ürün' }),
    )
  })

  it('hides the comment form from guests', async () => {
    mockGet({ '/products/5': product, '/products/5/comments': commentsPage([comment()]) })
    renderDetail()
    expect(await screen.findByText('Çok memnun kaldım')).toBeInTheDocument()
    expect(screen.queryByLabelText(t('catalog.comment_body'))).not.toBeInTheDocument()
  })

  it('shows the translated message when the product cannot be loaded', async () => {
    const error = new ApiError(404, 'not_found')
    vi.spyOn(api, 'get').mockImplementation(async (path: string) => {
      if (path === '/products/5') throw error
      return commentsPage([])
    })
    renderDetail()
    expect(await screen.findByRole('alert')).toHaveTextContent(errorMessage(error))
  })
})
