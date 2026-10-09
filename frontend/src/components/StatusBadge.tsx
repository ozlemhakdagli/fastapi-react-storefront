import { Badge } from '@/components/ui/badge'
import { t } from '@/lib/i18n'
import type { OrderStatus } from '@/lib/types'

type Variant = 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'info'

const VARIANTS: Record<OrderStatus, Variant> = {
  new: 'warning',
  approved: 'info',
  shipped: 'default',
  completed: 'success',
  rejected: 'destructive',
  cancelled: 'secondary',
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={VARIANTS[status]}>{t(`common.status_${status}`)}</Badge>
}
