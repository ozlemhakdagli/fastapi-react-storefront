import type { ReactNode } from 'react'

/** One label and value of a details list. The value is plain text, never markup. */
export function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="whitespace-pre-line">{children}</dd>
    </div>
  )
}
