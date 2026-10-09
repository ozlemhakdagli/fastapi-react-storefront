import { screen } from '@testing-library/react'
import { ProductCard } from '@/features/catalog/components/ProductCard'
import { t } from '@/lib/i18n'
import type { ProductListItem } from '@/lib/types'
import { renderWithProviders } from '@/test/utils'

const product: ProductListItem = {
  id: 1,
  sku: 'KL-100',
  name: 'Mekanik Klavye',
  short_description: 'Kırmızı anahtarlı',
  price: '1299.90',
  stock: 4,
  is_new: false,
  brand: { id: 7, name: 'Logitech' },
  category: { id: 1, name: 'Klavyeler' },
  image_url: '/api/media/placeholder.svg',
  rating_avg: null,
  rating_count: 0,
}

describe('ProductCard', () => {
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
})
