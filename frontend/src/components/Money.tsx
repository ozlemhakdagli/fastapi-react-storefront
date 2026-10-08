import { formatMoney } from '@/lib/format'
import type { Money as MoneyValue } from '@/lib/types'

export function Money({ value, className }: { value: MoneyValue; className?: string }) {
  return <span className={className}>{formatMoney(value)}</span>
}
