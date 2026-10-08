import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes, useLocation } from 'react-router'
import CheckoutPage from '@/features/cart/pages/CheckoutPage'
import { api, ApiError } from '@/lib/api'
import { errorMessage, t } from '@/lib/i18n'
import type { Order } from '@/lib/types'
import { renderWithProviders, testCustomer } from '@/test/utils'

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname + location.search}</div>
}

// The checkout page at /checkout, next to the pages it can navigate to.
function renderCheckout() {
  return renderWithProviders(
    <>
      <LocationProbe />
      <Routes>
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/cart" element={<div>cart route</div>} />
        <Route path="/account/orders/:id" element={<div>order route</div>} />
      </Routes>
    </>,
    { route: '/checkout', user: testCustomer },
  )
}

function makeOrder(id: number): Order {
  return {
    id,
    status: 'new',
    total: '2599.80',
    item_count: 2,
    created_at: '2026-10-08T12:00:00Z',
    ship_name: testCustomer.full_name,
    ship_phone: '05320000000',
    ship_address: 'Moda Cad. 1, Kadıköy, İstanbul',
    cargo_company: null,
    tracking_no: null,
    updated_at: '2026-10-08T12:00:00Z',
    items: [],
  }
}

describe('CheckoutPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('test_checkout_prefills_from_user', () => {
    renderCheckout()
    expect(screen.getByLabelText(t('cart.checkout_name'))).toHaveValue(testCustomer.full_name)
    expect(screen.getByLabelText(t('cart.checkout_phone'))).toHaveValue(testCustomer.phone)
    expect(screen.getByLabelText(t('cart.checkout_address'))).toHaveValue(testCustomer.address)
    // Same limits as the database columns (ship_name 100, ship_phone 30, ship_address 500).
    expect(screen.getByLabelText(t('cart.checkout_name'))).toHaveAttribute('maxLength', '100')
    expect(screen.getByLabelText(t('cart.checkout_phone'))).toHaveAttribute('maxLength', '30')
    expect(screen.getByLabelText(t('cart.checkout_address'))).toHaveAttribute('maxLength', '500')
  })

  it('test_checkout_posts_exact_body_and_navigates', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue(makeOrder(42))
    renderCheckout()
    await userEvent.click(screen.getByRole('button', { name: t('cart.checkout_submit') }))
    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe('/account/orders/42?placed=1'),
    )
    expect(post).toHaveBeenCalledTimes(1)
    expect(post).toHaveBeenCalledWith('/orders', {
      ship_name: testCustomer.full_name,
      ship_phone: testCustomer.phone,
      ship_address: testCustomer.address,
    })
  })

  it('refreshes the cart and the order lists after an order is placed', async () => {
    vi.spyOn(api, 'post').mockResolvedValue(makeOrder(42))
    const { queryClient } = renderCheckout()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    await userEvent.click(screen.getByRole('button', { name: t('cart.checkout_submit') }))
    await waitFor(() => expect(invalidate).toHaveBeenCalledWith({ queryKey: ['cart'] }))
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['orders'] })
  })

  it('test_checkout_disables_button_while_pending', async () => {
    const post = vi.spyOn(api, 'post').mockReturnValue(new Promise(() => {}))
    const { container } = renderCheckout()
    const submit = screen.getByRole('button', { name: t('cart.checkout_submit') })
    await userEvent.click(submit)
    await waitFor(() => expect(submit).toBeDisabled())
    await userEvent.click(submit)
    // A submit event that bypasses the disabled button must not send a second request either.
    const form = container.querySelector('form')
    expect(form).not.toBeNull()
    fireEvent.submit(form!)
    expect(post).toHaveBeenCalledTimes(1)
  })

  it('test_checkout_insufficient_stock_shows_error_and_cart_link', async () => {
    const error = new ApiError(409, 'insufficient_stock', { product_id: 5 })
    vi.spyOn(api, 'post').mockRejectedValue(error)
    renderCheckout()
    await userEvent.click(screen.getByRole('button', { name: t('cart.checkout_submit') }))
    expect(await screen.findByRole('alert')).toHaveTextContent(errorMessage(error))
    expect(screen.getByRole('link', { name: t('cart.checkout_back_to_cart') })).toHaveAttribute(
      'href',
      '/cart',
    )
  })

  it('test_checkout_empty_cart_redirects_to_cart', async () => {
    vi.spyOn(api, 'post').mockRejectedValue(new ApiError(400, 'empty_cart'))
    renderCheckout()
    await userEvent.click(screen.getByRole('button', { name: t('cart.checkout_submit') }))
    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/cart'))
  })

  it('test_checkout_requires_every_field', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue(makeOrder(42))
    renderCheckout()
    await userEvent.clear(screen.getByLabelText(t('cart.checkout_name')))
    await userEvent.click(screen.getByRole('button', { name: t('cart.checkout_submit') }))
    expect(await screen.findByText(t('cart.checkout_required'))).toBeInTheDocument()
    expect(post).not.toHaveBeenCalled()
  })
})
