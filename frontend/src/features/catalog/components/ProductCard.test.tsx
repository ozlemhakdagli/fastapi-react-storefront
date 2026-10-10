import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLocation } from 'react-router'
import { ProductCard } from '@/features/catalog/components/ProductCard'
import { api } from '@/lib/api'
import { t } from '@/lib/i18n'
import type { ProductListItem } from '@/lib/types'
import { renderWithProviders, testCustomer } from '@/test/utils'

const product: ProductListItem = {
  id: 1,
  sku: 'KL-100',
  name: 'Mechanical Keyboard',
  short_description: 'Red switches',
  price: '1299.90',
  stock: 4,
  is_new: false,
  brand: { id: 7, name: 'Logitech' },
  category: { id: 1, name: 'Keyboards' },
  image_url: '/api/media/placeholder.svg',
  rating_avg: null,
  rating_count: 0,
}

/** Shows the router location, so that a test can see whether a click navigated. */
function LocationProbe() {
  const location = useLocation()
  return <span data-testid="location">{location.pathname}</span>
}

describe('ProductCard', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows the Yeni badge for a new product', () => {
    renderWithProviders(<ProductCard product={{ ...product, is_new: true }} />)
    expect(screen.getByText(t('catalog.card_new'))).toBeInTheDocument()
  })

  it('shows the sold-out badge when the stock is 0', () => {
    renderWithProviders(<ProductCard product={{ ...product, stock: 0 }} />)
    expect(screen.getByText(t('common.stock_out'))).toBeInTheDocument()
  })

  it('links a product without a category to its page', () => {
    renderWithProviders(<ProductCard product={{ ...product, category: null }} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/products/1')
  })

  it('shows the average and the number of ratings under the name', () => {
    renderWithProviders(<ProductCard product={{ ...product, rating_avg: 4.3, rating_count: 12 }} />)
    expect(
      screen.getByRole('img', { name: t('catalog.rating_aria', { value: '4,3', count: 12 }) }),
    ).toBeInTheDocument()
  })

  it('shows no rating for a product without ratings', () => {
    renderWithProviders(<ProductCard product={product} />)
    expect(screen.queryByRole('img', { name: /üzerinden/ })).not.toBeInTheDocument()
    expect(screen.queryByText(t('catalog.rating_none'))).not.toBeInTheDocument()
  })

  it('puts the favourite button beside the link, labelled with the product name', () => {
    renderWithProviders(<ProductCard product={product} />)
    const heart = screen.getByRole('button', { name: t('favorites.add', { name: product.name }) })
    expect(screen.getByRole('link')).not.toContainElement(heart)
  })

  it('favourites the product when the heart is clicked, without opening the product page', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ ids: [] })
    const put = vi.spyOn(api, 'put').mockResolvedValue(undefined)
    renderWithProviders(
      <>
        <ProductCard product={product} />
        <LocationProbe />
      </>,
      { route: '/products', user: testCustomer },
    )
    await userEvent.click(
      await screen.findByRole('button', { name: t('favorites.add', { name: product.name }) }),
    )
    await waitFor(() => expect(put).toHaveBeenCalledWith('/me/favorites/1'))
    expect(screen.getByTestId('location').textContent).toBe('/products')
  })
})
