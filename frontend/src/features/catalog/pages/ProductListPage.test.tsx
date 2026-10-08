import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLocation } from 'react-router'
import ProductListPage from '@/features/catalog/pages/ProductListPage'
import { api, ApiError } from '@/lib/api'
import { errorMessage, t } from '@/lib/i18n'
import type { Page, ProductListItem, Taxonomy } from '@/lib/types'
import { renderWithProviders } from '@/test/utils'

const product: ProductListItem = {
  id: 1,
  sku: 'KL-100',
  name: 'Mekanik Klavye',
  short_description: 'Kırmızı anahtarlı',
  price: '1299.90',
  stock: 4,
  is_new: true,
  brand: { id: 7, name: 'Logitech' },
  category: { id: 1, name: 'Klavyeler' },
  image_url: '/api/media/placeholder.svg',
}

const products: Page<ProductListItem> = { items: [product], total: 45, page: 3, page_size: 20 }
const categories: Taxonomy[] = [
  { id: 1, name: 'Klavyeler', description: '' },
  { id: 2, name: 'Fareler', description: '' },
]
const brands: Taxonomy[] = [{ id: 7, name: 'Logitech', description: '' }]

/** Answers each GET by its path; an unexpected path fails the test. */
function mockGet(responses: Record<string, unknown>) {
  return vi.spyOn(api, 'get').mockImplementation(async (path: string) => {
    if (!(path in responses)) throw new Error(`unexpected GET ${path}`)
    return responses[path]
  })
}

/** Shows the router location so that tests can read the URL. */
function LocationProbe() {
  const location = useLocation()
  return <span data-testid="location">{`${location.pathname}${location.search}`}</span>
}

function renderList(route: string) {
  return renderWithProviders(
    <>
      <ProductListPage />
      <LocationProbe />
    </>,
    { route },
  )
}

describe('ProductListPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the products returned by the API', async () => {
    mockGet({ '/products': products, '/categories': categories, '/brands': brands })
    renderList('/products')
    expect(await screen.findByText('Mekanik Klavye')).toBeInTheDocument()
  })

  it('test_list_requests_use_url_params', async () => {
    const get = mockGet({ '/products': products, '/categories': categories, '/brands': brands })
    renderList('/products?category_id=1&brand_id=7&q=klavye&sort=price_asc&page=2')
    await waitFor(() =>
      expect(get).toHaveBeenCalledWith('/products', {
        category_id: 1,
        brand_id: 7,
        q: 'klavye',
        sort: 'price_asc',
        page: 2,
      }),
    )
  })

  it('test_changing_category_updates_url_and_resets_page', async () => {
    const get = mockGet({ '/products': products, '/categories': categories, '/brands': brands })
    renderList('/products?category_id=1&page=3')
    await screen.findByRole('option', { name: 'Fareler' })
    await userEvent.selectOptions(screen.getByLabelText(t('catalog.filter_category')), '2')
    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe('/products?category_id=2'),
    )
    expect(get).toHaveBeenCalledWith('/products', { category_id: 2, page: 1 })
  })

  it('submitting the search box puts q into the URL and resets the page', async () => {
    const get = mockGet({ '/products': products, '/categories': categories, '/brands': brands })
    renderList('/products?page=2')
    await userEvent.type(await screen.findByLabelText(t('catalog.filter_search')), 'klavye')
    await userEvent.click(screen.getByRole('button', { name: t('common.search') }))
    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('/products?q=klavye'))
    expect(get).toHaveBeenCalledWith('/products', { q: 'klavye', page: 1 })
  })

  it('shows the translated message when the products cannot be loaded', async () => {
    const error = new ApiError(0, 'network')
    vi.spyOn(api, 'get').mockImplementation(async (path: string) => {
      if (path === '/products') throw error
      return path === '/categories' ? categories : brands
    })
    renderList('/products')
    expect(await screen.findByRole('alert')).toHaveTextContent(errorMessage(error))
  })
})
