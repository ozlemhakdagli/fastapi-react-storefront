import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLocation } from 'react-router'
import ProductsPage from '@/features/admin/pages/ProductsPage'
import { api, ApiError } from '@/lib/api'
import { errorMessage, t } from '@/lib/i18n'
import type { AdminProduct, Page, Taxonomy } from '@/lib/types'
import { renderWithProviders, testAdmin } from '@/test/utils'

const product: AdminProduct = {
  id: 5,
  sku: 'KL-100',
  name: 'Mekanik Klavye',
  short_description: 'Kırmızı anahtarlı',
  description: 'Tam boyut klavye.',
  price: '1299.90',
  cost_price: '800.00',
  stock: 4,
  is_new: true,
  is_active: true,
  brand: { id: 7, name: 'Logitech' },
  category: { id: 1, name: 'Klavyeler' },
  image_url: '/api/media/placeholder.svg',
  rating_avg: null,
  rating_count: 0,
  images: [],
  created_at: '2026-10-08T12:00:00Z',
  updated_at: '2026-10-08T12:00:00Z',
}

const listing: Page<AdminProduct> = { items: [product], total: 1, page: 1, page_size: 20 }
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
      <ProductsPage />
      <LocationProbe />
    </>,
    { route, user: testAdmin },
  )
}

describe('ProductsPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the products returned by the API', async () => {
    mockGet({
      '/admin/products': listing,
      '/admin/categories': categories,
      '/admin/brands': brands,
    })
    renderList('/admin/products')
    expect(await screen.findByText('Mekanik Klavye')).toBeInTheDocument()
    expect(screen.getByText('KL-100')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: t('common.edit') })).toHaveAttribute(
      'href',
      '/admin/products/5',
    )
  })

  it('test_list_filters_call_api_with_params', async () => {
    const get = mockGet({
      '/admin/products': listing,
      '/admin/categories': categories,
      '/admin/brands': brands,
    })
    renderList('/admin/products?q=klavye&category_id=1&brand_id=7&is_active=false&page=2')
    await waitFor(() =>
      expect(get).toHaveBeenCalledWith('/admin/products', {
        page: 2,
        q: 'klavye',
        category_id: 1,
        brand_id: 7,
        is_active: false,
      }),
    )
  })

  it('choosing a status filter asks for the first page with that filter', async () => {
    const get = mockGet({
      '/admin/products': listing,
      '/admin/categories': categories,
      '/admin/brands': brands,
    })
    renderList('/admin/products?page=3')
    await screen.findByRole('option', { name: 'Fareler' })
    await userEvent.selectOptions(screen.getByLabelText(t('adminproducts.filter_active')), 'false')
    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe('/admin/products?is_active=false'),
    )
    expect(get).toHaveBeenCalledWith('/admin/products', { page: 1, is_active: false })
  })

  it('shows the translated message when the products cannot be loaded', async () => {
    const error = new ApiError(403, 'forbidden')
    vi.spyOn(api, 'get').mockImplementation(async (path: string) => {
      if (path === '/admin/products') throw error
      return path === '/admin/categories' ? categories : brands
    })
    renderList('/admin/products')
    expect(await screen.findByRole('alert')).toHaveTextContent(errorMessage(error))
  })
})
