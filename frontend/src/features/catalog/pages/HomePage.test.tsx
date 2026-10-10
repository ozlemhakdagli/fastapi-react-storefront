import { screen } from '@testing-library/react'
import HomePage from '@/features/catalog/pages/HomePage'
import { api, ApiError } from '@/lib/api'
import { errorMessage, t } from '@/lib/i18n'
import type { Page, ProductListItem, Taxonomy } from '@/lib/types'
import { renderWithProviders } from '@/test/utils'

const newProduct: ProductListItem = {
  id: 1,
  sku: 'KL-100',
  name: 'Mechanical Keyboard',
  short_description: 'Red switches',
  price: '1299.90',
  stock: 4,
  is_new: true,
  brand: { id: 7, name: 'Logitech' },
  category: { id: 3, name: 'Keyboards' },
  image_url: '/api/media/placeholder.svg',
  rating_avg: null,
  rating_count: 0,
}

const newProducts: Page<ProductListItem> = { items: [newProduct], total: 1, page: 1, page_size: 8 }
const categories: Taxonomy[] = [{ id: 3, name: 'Keyboards', description: '' }]
const brands: Taxonomy[] = [{ id: 7, name: 'Logitech', description: '' }]

/** Answers each GET by its path; an unexpected path fails the test. */
function mockGet(responses: Record<string, unknown>) {
  return vi.spyOn(api, 'get').mockImplementation(async (path: string) => {
    if (!(path in responses)) throw new Error(`unexpected GET ${path}`)
    return responses[path]
  })
}

describe('HomePage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('test_home_renders_new_products', async () => {
    const get = mockGet({ '/products': newProducts, '/categories': categories, '/brands': brands })
    renderWithProviders(<HomePage />)
    expect(await screen.findByText('Mechanical Keyboard')).toBeInTheDocument()
    expect(get).toHaveBeenCalledWith('/products', { is_new: true, page_size: 8 })
  })

  it('links each category and brand to the filtered product list', async () => {
    mockGet({ '/products': newProducts, '/categories': categories, '/brands': brands })
    renderWithProviders(<HomePage />)
    expect(await screen.findByRole('link', { name: 'Keyboards' })).toHaveAttribute(
      'href',
      '/products?category_id=3',
    )
    expect(screen.getByRole('link', { name: 'Logitech' })).toHaveAttribute(
      'href',
      '/products?brand_id=7',
    )
  })

  it('shows the hero heading and the two calls to action', async () => {
    mockGet({ '/products': newProducts, '/categories': categories, '/brands': brands })
    renderWithProviders(<HomePage />)
    await screen.findByText('Mechanical Keyboard')
    expect(
      screen.getByRole('heading', { level: 1, name: t('catalog.hero_title') }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: t('catalog.hero_cta_products') })).toHaveAttribute(
      'href',
      '/products',
    )
    expect(screen.getByRole('link', { name: t('catalog.hero_cta_contact') })).toHaveAttribute(
      'href',
      '/contact',
    )
  })

  it('links every category card to its filtered product list', async () => {
    const twoCategories: Taxonomy[] = [...categories, { id: 4, name: 'Mice', description: '' }]
    mockGet({ '/products': newProducts, '/categories': twoCategories, '/brands': brands })
    renderWithProviders(<HomePage />)
    expect(await screen.findByRole('link', { name: 'Keyboards' })).toHaveAttribute(
      'href',
      '/products?category_id=3',
    )
    expect(screen.getByRole('link', { name: 'Mice' })).toHaveAttribute(
      'href',
      '/products?category_id=4',
    )
  })

  it('shows the translated message when the new products cannot be loaded', async () => {
    const error = new ApiError(0, 'network')
    vi.spyOn(api, 'get').mockImplementation(async (path: string) => {
      if (path === '/products') throw error
      return path === '/categories' ? categories : brands
    })
    renderWithProviders(<HomePage />)
    expect(await screen.findByRole('alert')).toHaveTextContent(errorMessage(error))
  })
})
