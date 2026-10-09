import { render, screen } from '@testing-library/react'
import { Cable, HardDrive, MemoryStick, Package, Usb, Zap, type LucideIcon } from 'lucide-react'
import { categoryIcon, ProductImage } from '@/components/ProductImage'

describe('ProductImage', () => {
  it('renders a coloured placeholder labelled with the product name for the placeholder image', () => {
    render(<ProductImage name="Seagate 1 TB" imageUrl="/api/media/placeholder.svg" />)
    expect(screen.getByRole('img', { name: 'Seagate 1 TB' })).not.toHaveAttribute('src')
  })

  it('renders the real image with its source and the product name as alt text', () => {
    render(<ProductImage name="Seagate 1 TB" imageUrl="/api/media/abc.jpg" />)
    const image = screen.getByRole('img', { name: 'Seagate 1 TB' })
    expect(image).toHaveAttribute('src', '/api/media/abc.jpg')
    expect(image).toHaveAttribute('alt', 'Seagate 1 TB')
  })

  it('renders a 120-character name in the placeholder without breaking', () => {
    const longName = 'Seagate Barracuda 1 TB '.repeat(6).slice(0, 120)
    render(
      <ProductImage
        name={longName}
        imageUrl="/api/media/placeholder.svg"
        category={{ id: 3, name: 'SSD Diskler' }}
      />,
    )
    expect(screen.getByRole('img', { name: longName })).toBeInTheDocument()
  })

  it('loads the main photo eagerly and first', () => {
    render(<ProductImage name="Seagate 1 TB" imageUrl="/api/media/a.webp" priority />)
    const image = screen.getByRole('img', { name: 'Seagate 1 TB' })
    expect(image).toHaveAttribute('loading', 'eager')
    expect(image).toHaveAttribute('fetchpriority', 'high')
  })

  it('loads other photos lazily', () => {
    render(<ProductImage name="Seagate 1 TB" imageUrl="/api/media/a.webp" />)
    const image = screen.getByRole('img', { name: 'Seagate 1 TB' })
    expect(image).toHaveAttribute('loading', 'lazy')
    expect(image).toHaveAttribute('decoding', 'async')
    expect(image).not.toHaveAttribute('fetchpriority')
  })
})

describe('categoryIcon', () => {
  it.each<[string, LucideIcon]>([
    ['Harici Diskler', HardDrive],
    ['SSD Diskler', Zap],
    ['Bellek Kartları', MemoryStick],
    ['USB Bellekler', Usb],
    ['Aksesuarlar', Cable],
    ['Bilinmeyen', Package],
  ])('maps the category "%s" to its icon', (categoryName, icon) => {
    expect(categoryIcon(categoryName)).toBe(icon)
  })

  it('falls back to the package icon when there is no category name', () => {
    expect(categoryIcon(null)).toBe(Package)
    expect(categoryIcon(undefined)).toBe(Package)
  })
})
