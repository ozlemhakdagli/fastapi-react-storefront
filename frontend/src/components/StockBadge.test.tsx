import { render, screen } from '@testing-library/react'
import { StockBadge } from '@/components/StockBadge'
import { t } from '@/lib/i18n'

describe('StockBadge', () => {
  it.each<[number, string, string]>([
    [40, t('common.stock_in'), 'success'],
    [6, t('common.stock_in'), 'success'],
    [5, t('common.stock_low', { count: 5 }), 'warning'],
    [3, t('common.stock_low', { count: 3 }), 'warning'],
    [1, t('common.stock_low', { count: 1 }), 'warning'],
    [0, t('common.stock_out'), 'destructive'],
  ])('shows stock %i as "%s" with the %s variant', (stock, label, variant) => {
    render(<StockBadge stock={stock} />)
    expect(screen.getByText(label)).toHaveAttribute('data-variant', variant)
  })
})
