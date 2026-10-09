import { Check } from 'lucide-react'
import { cn } from 'cn'
import { StatusBadge } from '@/components/StatusBadge'
import { t } from '@/lib/i18n'
import type { OrderStatus } from '@/lib/types'

type ProgressStatus = Exclude<OrderStatus, 'rejected' | 'cancelled'>

const STEPS: readonly ProgressStatus[] = ['new', 'approved', 'shipped', 'completed']

/**
 * Where an order stands: the steps up to the current one are reached. A rejected or cancelled
 * order has no steps, so it is shown as a single state. Connector lines are decorative and sit in
 * the gaps between the steps: vertical below `sm`, horizontal from `sm` up.
 */
export function OrderTimeline({ status }: { status: OrderStatus }) {
  if (status === 'rejected' || status === 'cancelled') return <StatusBadge status={status} />

  const current = STEPS.indexOf(status)
  return (
    <ol
      aria-label={t('account.order_progress')}
      className="flex flex-col gap-6 text-sm sm:flex-row sm:gap-0"
    >
      {STEPS.map((step, index) => {
        const isReached = index <= current
        const isCurrent = index === current
        return (
          <li
            key={step}
            aria-current={isCurrent ? 'step' : undefined}
            className={cn(
              'relative flex items-center gap-3 sm:flex-1 sm:flex-col sm:gap-2 sm:text-center',
              isReached ? 'text-foreground' : 'text-muted-foreground',
              isCurrent && 'font-medium',
            )}
          >
            {index > 0 ? (
              <span
                aria-hidden="true"
                className={cn(
                  'absolute -top-6 left-[calc(1rem_-_1px)] h-6 w-0.5 sm:-left-1/2 sm:top-[calc(1rem_-_1px)] sm:right-1/2 sm:h-0.5 sm:w-auto',
                  isReached ? 'bg-primary' : 'bg-border',
                )}
              />
            ) : null}
            <span
              className={cn(
                'relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full',
                isReached ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
              )}
            >
              {index < current ? (
                <Check aria-hidden="true" className="size-4" />
              ) : isCurrent ? (
                <span aria-hidden="true" className="size-2 rounded-full bg-current" />
              ) : null}
            </span>
            <span>{t(`common.status_${step}`)}</span>
          </li>
        )
      })}
    </ol>
  )
}
