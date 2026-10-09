import { render, screen } from '@testing-library/react'
import { StockBadge } from '@/components/StockBadge'

describe('StockBadge', () => {
  it.each<[number, string, string]>([
    [40, 'Stokta', 'success'],
    [6, 'Stokta', 'success'],
    [5, 'Son 5 adet', 'warning'],
    [3, 'Son 3 adet', 'warning'],
    [1, 'Son 1 adet', 'warning'],
    [0, 'Tükendi', 'destructive'],
  ])('shows stock %i as "%s" with the %s variant', (stock, label, variant) => {
    render(<StockBadge stock={stock} />)
    expect(screen.getByText(label)).toHaveAttribute('data-variant', variant)
  })
})
