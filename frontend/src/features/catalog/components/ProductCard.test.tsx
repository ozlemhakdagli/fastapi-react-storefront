import { screen } from '@testing-library/react'
import { ProductCard } from '@/features/catalog/components/ProductCard'
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
}

describe('ProductCard', () => {
  it('shows the Yeni badge with the warning variant for a new product', () => {
    renderWithProviders(<ProductCard product={{ ...product, is_new: true }} />)
    expect(screen.getByText('Yeni')).toHaveAttribute('data-variant', 'warning')
  })

  it('shows the sold-out badge when the stock is 0', () => {
    renderWithProviders(<ProductCard product={{ ...product, stock: 0 }} />)
    expect(screen.getByText('Tükendi')).toHaveAttribute('data-variant', 'destructive')
  })

  it('keeps the link and the image for a product without category and with a 120-character name', () => {
    const longName = `${'A'.repeat(60)} ${'B'.repeat(59)}`
    expect(longName).toHaveLength(120)
    renderWithProviders(<ProductCard product={{ ...product, name: longName, category: null }} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/products/1')
    expect(screen.getByRole('img', { name: longName })).toBeInTheDocument()
  })
})
