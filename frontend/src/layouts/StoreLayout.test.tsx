import { screen, waitFor, within } from '@testing-library/react'
import { Route, Routes } from 'react-router'
import { cartQueryKey } from '@/features/cart/hooks/useCart'
import StoreLayout from '@/layouts/StoreLayout'
import { api } from '@/lib/api'
import type { Cart, CartItem, SiteSettings, User } from '@/lib/types'
import { renderWithProviders, testCustomer } from '@/test/utils'

const site: SiteSettings = {
  site_name: 'Örnek Mağaza',
  description: '',
  address: '',
  phone: '',
  email: '',
  facebook: '',
  instagram: '',
  pinterest: '',
  about_text: '',
  contact_text: '',
}

function cartItem(productId: number, quantity: number): CartItem {
  return {
    product_id: productId,
    name: `Ürün ${productId}`,
    unit_price: '100.00',
    quantity,
    line_total: (100 * quantity).toFixed(2),
    stock: 500,
    available: true,
    image_url: '/api/media/placeholder.svg',
  }
}

function cartWith(items: CartItem[]): Cart {
  return { items, total: '0.00' }
}

// Answers the requests the layout makes: the site settings and, for a logged-in user, the cart.
function mockApi(cart: Cart) {
  return vi.spyOn(api, 'get').mockImplementation(async (path: string) => {
    if (path === '/site') return site
    if (path === '/cart') return cart
    throw new Error(`unexpected GET ${path}`)
  })
}

function renderLayout(user: User | null = null) {
  return renderWithProviders(
    <Routes>
      <Route element={<StoreLayout />}>
        <Route index element={<div>home</div>} />
      </Route>
    </Routes>,
    { user },
  )
}

describe('StoreLayout', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    document.title = ''
  })

  it('puts the shop name into the browser tab title', async () => {
    vi.spyOn(api, 'get').mockResolvedValue(site)
    renderLayout()
    await waitFor(() => expect(document.title).toBe('Örnek Mağaza'))
  })

  it('shows the site name in the header and the footer', async () => {
    vi.spyOn(api, 'get').mockResolvedValue(site)
    renderLayout()
    expect(await screen.findAllByText('Örnek Mağaza')).toHaveLength(2) // header and footer
  })

  it('shows the number of items on the cart link for a logged-in customer', async () => {
    mockApi(cartWith([cartItem(1, 2), cartItem(2, 1)]))
    renderLayout(testCustomer)
    const cartLink = await screen.findByRole('link', { name: 'Sepetim, 3 ürün' })
    expect(within(cartLink).getByText('3')).toBeInTheDocument()
  })

  it('does not load the cart for an anonymous visitor', async () => {
    const get = mockApi(cartWith([cartItem(1, 2)]))
    renderLayout()
    expect(await screen.findAllByText('Örnek Mağaza')).toHaveLength(2) // the site has loaded
    expect(get).not.toHaveBeenCalledWith('/cart')
    expect(screen.getByRole('link', { name: 'Sepetim' })).toBeInTheDocument()
  })

  it('caps the badge at 99+ and gives screen readers the exact count', async () => {
    mockApi(cartWith([cartItem(1, 100), cartItem(2, 20)]))
    renderLayout(testCustomer)
    expect(await screen.findByText('99+')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Sepetim, 120 ürün' })).toBeInTheDocument()
  })

  it('shows the plain cart link and no badge when the cart is empty', async () => {
    mockApi(cartWith([]))
    const { queryClient } = renderLayout(testCustomer)
    await waitFor(() => expect(queryClient.getQueryState(cartQueryKey)?.status).toBe('success'))
    expect(screen.getByRole('link', { name: 'Sepetim' })).toHaveTextContent(/^Sepetim$/)
  })
})
