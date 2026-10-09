import { Badge } from '@/components/ui/badge'
import { t } from '@/lib/i18n'

// Plenty (above 5) is green, low (1 to 5) is amber, sold out (0 or less) is red.
export function StockBadge({ stock, className }: { stock: number; className?: string }) {
  if (stock > 5) {
    return (
      <Badge variant="success" className={className}>
        {t('common.stock_in')}
      </Badge>
    )
  }
  if (stock > 0) {
    return (
      <Badge variant="warning" className={className}>
        {t('common.stock_low', { count: stock })}
      </Badge>
    )
  }
  return (
    <Badge variant="destructive" className={className}>
      {t('common.stock_out')}
    </Badge>
  )
}
