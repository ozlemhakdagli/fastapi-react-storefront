import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CartPage from '@/features/cart/pages/CartPage'
import { api, ApiError } from '@/lib/api'
import { errorMessage, t } from '@/lib/i18n'
import type { Cart, CartItem } from '@/lib/types'
import { price, renderWithProviders, testCustomer } from '@/test/utils'

function line(overrides: Partial<CartItem> = {}): CartItem {
  return {
    product_id: 5,
    name: 'Mekanik Klavye',
    unit_price: '1299.90',
    quantity: 2,
    line_total: '2599.80',
    stock: 10,
    available: true,
    image_url: '/api/media/klavye.jpg',
    ...overrides,
  }
}

const cart: Cart = { items: [line()], total: '2599.80' }

describe('CartPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('test_cart_renders_lines_from_api', async () => {
    vi.spyOn(api, 'get').mockResolvedValue(cart)
    renderWithProviders(<CartPage />, { user: testCustomer })
    expect(await screen.findByText('Mekanik Klavye')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Mekanik Klavye' })).toHaveAttribute(
      'src',
      '/api/media/klavye.jpg',
    )
    expect(screen.getByText(price('1299.90'))).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/cart')
  })

  it('test_cart_quantity_change_calls_put_with_absolute_quantity', async () => {
    vi.spyOn(api, 'get').mockResolvedValue(cart)
    const put = vi.spyOn(api, 'put').mockResolvedValue({
      items: [line({ quantity: 3, line_total: '3899.70' })],
      total: '3899.70',
    })
    renderWithProviders(<CartPage />, { user: testCustomer })
    await userEvent.click(await screen.findByRole('button', { name: t('cart.increase') }))
    expect(put).toHaveBeenCalledTimes(1)
    expect(put).toHaveBeenCalledWith('/cart/items/5', { quantity: 3 })
  })

  it('test_cart_remove_calls_delete', async () => {
    vi.spyOn(api, 'get').mockResolvedValue(cart)
    const remove = vi.spyOn(api, 'delete').mockResolvedValue({ items: [], total: '0.00' })
    renderWithProviders(<CartPage />, { user: testCustomer })
    await userEvent.click(await screen.findByRole('button', { name: t('cart.remove') }))
    expect(remove).toHaveBeenCalledWith('/cart/items/5')
  })

  it('test_cart_shows_server_total', async () => {
    // The line totals add up to 1399.90, but the server says 1499.90.
    // The page must show the server's total as given and never recompute it.
    vi.spyOn(api, 'get').mockResolvedValue({
      items: [
        line({ unit_price: '1299.90', quantity: 1, line_total: '1299.90' }),
        line({
          product_id: 6,
          name: 'Kablo',
          unit_price: '100.00',
          quantity: 1,
          line_total: '100.00',
        }),
      ],
      total: '1499.90',
    })
    renderWithProviders(<CartPage />, { user: testCustomer })
    expect(await screen.findByText(price('1499.90'))).toBeInTheDocument()
  })

  it('test_cart_empty_state', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ items: [], total: '0.00' })
    renderWithProviders(<CartPage />, { user: testCustomer })
    expect(await screen.findByText(t('cart.empty'))).toBeInTheDocument()
    expect(screen.getByRole('link', { name: t('cart.continue_shopping') })).toHaveAttribute(
      'href',
      '/products',
    )
  })

  it('test_cart_links_to_checkout', async () => {
    vi.spyOn(api, 'get').mockResolvedValue(cart)
    renderWithProviders(<CartPage />, { user: testCustomer })
    expect(await screen.findByRole('link', { name: t('cart.checkout') })).toHaveAttribute(
      'href',
      '/checkout',
    )
  })

  it('test_cart_warns_when_quantity_exceeds_stock', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({
      items: [
        line({ quantity: 3, stock: 2, line_total: '3899.70' }),
        line({
          product_id: 6,
          name: 'Kablo',
          unit_price: '100.00',
          quantity: 1,
          stock: 5,
          line_total: '100.00',
        }),
      ],
      total: '3999.70',
    })
    renderWithProviders(<CartPage />, { user: testCustomer })
    expect(await screen.findByText(t('cart.stock_warning', { stock: 2 }))).toBeInTheDocument()
    expect(screen.queryByText(t('cart.stock_warning', { stock: 5 }))).not.toBeInTheDocument()
  })

  it('test_cart_flags_unavailable_lines_and_blocks_checkout', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({
      items: [line(), line({ product_id: 6, name: 'Eski Fare', available: false })],
      total: '3899.70',
    })
    renderWithProviders(<CartPage />, { user: testCustomer })
    expect(await screen.findByText('Eski Fare')).toBeInTheDocument()
    expect(screen.getAllByText(t('cart.unavailable_warning'))).toHaveLength(1)
    // The checkout link is replaced by an explanation until the line is removed.
    expect(screen.queryByRole('link', { name: t('cart.checkout') })).not.toBeInTheDocument()
    expect(screen.getByText(t('cart.checkout_blocked'))).toBeInTheDocument()
  })

  it('test_cart_without_unavailable_lines_keeps_the_checkout_link', async () => {
    vi.spyOn(api, 'get').mockResolvedValue(cart)
    renderWithProviders(<CartPage />, { user: testCustomer })
    expect(await screen.findByRole('link', { name: t('cart.checkout') })).toHaveAttribute(
      'href',
      '/checkout',
    )
    expect(screen.queryByText(t('cart.checkout_blocked'))).not.toBeInTheDocument()
  })

  it('test_cart_stepper_respects_one_and_stock', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({
      items: [line({ quantity: 1, stock: 1, line_total: '1299.90' })],
      total: '1299.90',
    })
    renderWithProviders(<CartPage />, { user: testCustomer })
    expect(await screen.findByRole('button', { name: t('cart.decrease') })).toBeDisabled()
    expect(screen.getByRole('button', { name: t('cart.increase') })).toBeDisabled()
  })

  it('test_cart_update_error_shows_message', async () => {
    vi.spyOn(api, 'get').mockResolvedValue(cart)
    const error = new ApiError(409, 'insufficient_stock', { product_id: 5 })
    vi.spyOn(api, 'put').mockRejectedValue(error)
    renderWithProviders(<CartPage />, { user: testCustomer })
    await userEvent.click(await screen.findByRole('button', { name: t('cart.increase') }))
    expect(await screen.findByRole('alert')).toHaveTextContent(errorMessage(error))
  })
})
