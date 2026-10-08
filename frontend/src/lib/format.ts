import type { Iso, Money } from '@/lib/types'

const moneyFormat = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' })
const dateFormat = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })

export function formatMoney(value: Money): string {
  return moneyFormat.format(Number(value))
}

export function formatDate(iso: Iso): string {
  return dateFormat.format(new Date(iso))
}
