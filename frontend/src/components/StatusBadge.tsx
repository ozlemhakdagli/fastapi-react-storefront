import { Badge } from '@/components/ui/badge'
import { t } from '@/lib/i18n'
import type { OrderStatus } from '@/lib/types'

const VARIANTS: Record<OrderStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  new: 'default',
  approved: 'secondary',
  shipped: 'secondary',
  completed: 'outline',
  rejected: 'destructive',
  cancelled: 'destructive',
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={VARIANTS[status]}>{t(`common.status_${status}`)}</Badge>
}
