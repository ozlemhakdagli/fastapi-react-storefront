import { Star } from 'lucide-react'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'

interface RatingStarsProps {
  value: number | null
  count?: number
  className?: string
}

// Filled up to the rounded value; the number is shown with one decimal, the count in brackets.
export function RatingStars({ value, count, className }: RatingStarsProps) {
  if (value === null) {
    return <span className={cn('text-sm text-muted-foreground', className)}>{t('catalog.rating_none')}</span>
  }
  const shown = value.toLocaleString('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  const label =
    count === undefined
      ? t('catalog.rating_value', { value: shown })
      : t('catalog.rating_aria', { value: shown, count })
  const filled = Math.round(value)
  return (
    <span role="img" aria-label={label} className={cn('inline-flex items-center gap-1.5 text-sm', className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          aria-hidden="true"
          data-filled={star <= filled}
          className={cn('size-4', star <= filled ? 'fill-current text-warning' : 'text-muted-foreground/40')}
        />
      ))}
      <span>{count === undefined ? shown : `${shown} (${count})`}</span>
    </span>
  )
}
