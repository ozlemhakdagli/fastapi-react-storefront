import { getLocale, type Locale } from '@/lib/i18n'
import type { Iso, Money } from '@/lib/types'

const INTL_LOCALE: Record<Locale, string> = { tr: 'tr-TR', en: 'en-US' }

const CURRENCY = 'USD' // the database stores plain amounts; change it here

interface Formatters {
  money: Intl.NumberFormat
  date: Intl.DateTimeFormat
  day: Intl.DateTimeFormat
  rating: Intl.NumberFormat
}

// Building an Intl formatter is slow, so each language gets its set once.
const formatters = new Map<Locale, Formatters>()

function current(): Formatters {
  const locale = getLocale()
  let set = formatters.get(locale)
  if (!set) {
    const intl = INTL_LOCALE[locale]
    set = {
      money: new Intl.NumberFormat(intl, { style: 'currency', currency: CURRENCY }),
      date: new Intl.DateTimeFormat(intl, { dateStyle: 'medium', timeStyle: 'short' }),
      day: new Intl.DateTimeFormat(intl, { day: 'numeric', month: 'short' }),
      rating: new Intl.NumberFormat(intl, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
    }
    formatters.set(locale, set)
  }
  return set
}

export function formatMoney(value: Money): string {
  return current().money.format(Number(value))
}

export function formatDate(iso: Iso): string {
  return current().date.format(new Date(iso))
}

/** "2026-09-26" becomes "Sep 26" or "26 Eyl". It is read as a calendar day, not as UTC midnight. */
export function formatDay(date: string): string {
  const [year, month, day] = date.split('-').map(Number)
  return current().day.format(new Date(year, month - 1, day))
}

/** An average of stars with one decimal: "4.3" or "4,3". */
export function formatRating(value: number): string {
  return current().rating.format(value)
}
