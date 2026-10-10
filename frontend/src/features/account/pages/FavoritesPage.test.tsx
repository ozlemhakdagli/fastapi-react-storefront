import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import FavoritesPage from '@/features/account/pages/FavoritesPage'
import AccountLayout from '@/layouts/AccountLayout'
import { api } from '@/lib/api'
import { t } from '@/lib/i18n'
import type { Page, ProductListItem } from '@/lib/types'
import { renderWithProviders, testCustomer } from '@/test/utils'

const product: ProductListItem = {
  id: 1,
  sku: 'KL-100',
  name: 'Mechanical Keyboard',
  short_description: 'Red switches',
  price: '1299.90',
  stock: 4,
  is_new: false,
  brand: null,
  category: null,
  image_url: '/api/media/placeholder.svg',
  rating_avg: null,
  rating_count: 0,
}

function favoritesPage(items: ProductListItem[], total = items.length): Page<ProductListItem> {
  return { items, total, page: 1, page_size: 20 }
}

function renderFavorites() {
  return renderWithProviders(<FavoritesPage />, {
    route: '/account/favorites',
    user: testCustomer,
  })
}

describe('FavoritesPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows the favourite products as cards that link to them', async () => {
    vi.spyOn(api, 'get').mockResolvedValue(
      favoritesPage([product, { ...product, id: 2, name: 'Cable' }]),
    )
    renderFavorites()
    expect(await screen.findByText('Mechanical Keyboard')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Cable/ })).toHaveAttribute('href', '/products/2')
    expect(api.get).toHaveBeenCalledWith('/me/favorites', { page: 1 })
  })

  it('shows an empty state with a link to the products', async () => {
    vi.spyOn(api, 'get').mockResolvedValue(favoritesPage([]))
    renderFavorites()
    expect(await screen.findByText(t('favorites.empty'))).toBeInTheDocument()
    expect(screen.getByRole('link', { name: t('favorites.browse_products') })).toHaveAttribute(
      'href',
      '/products',
    )
  })

  it('asks for the next page when the visitor goes on', async () => {
    const get = vi
      .spyOn(api, 'get')
      .mockResolvedValue({ items: [product], total: 45, page: 1, page_size: 20 })
    renderFavorites()
    await userEvent.click(await screen.findByRole('button', { name: t('common.next') }))
    expect(get).toHaveBeenLastCalledWith('/me/favorites', { page: 2 })
  })
})

describe('the account navigation', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('links to the favourites page by its name', async () => {
    vi.spyOn(api, 'get').mockResolvedValue(favoritesPage([]))
    renderWithProviders(
      <Routes>
        <Route path="account" element={<AccountLayout />}>
          <Route path="favorites" element={<FavoritesPage />} />
        </Route>
      </Routes>,
      { route: '/account/favorites', user: testCustomer },
    )
    await screen.findByText(t('favorites.empty'))
    expect(screen.getByRole('link', { name: t('layout.account_favorites') })).toHaveAttribute(
      'href',
      '/account/favorites',
    )
  })
})
