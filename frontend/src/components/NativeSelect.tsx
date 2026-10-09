import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

/**
 * A plain browser `<select>` that looks like the shadcn Input. It is used instead of the shadcn
 * Select, which needs browser APIs that the test environment (jsdom) does not have.
 */
export function NativeSelect({ className, ...props }: ComponentProps<'select'>) {
  return (
    <select
      className={cn(
        'border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full min-w-0 rounded-lg border bg-transparent px-2.5 text-sm outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
