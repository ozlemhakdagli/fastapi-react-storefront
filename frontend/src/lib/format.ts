import { getLocale, type Locale } from '@/lib/i18n'
import type { Iso, Money } from '@/lib/types'

const INTL_LOCALE: Record<Locale, string> = { tr: 'tr-TR', en: 'en-US' }

// Building an Intl formatter is slow, so each language gets its pair once.
const formatters = new Map<Locale, { money: Intl.NumberFormat; date: Intl.DateTimeFormat }>()

function current() {
  const locale = getLocale()
  let pair = formatters.get(locale)
  if (!pair) {
    pair = {
      money: new Intl.NumberFormat(INTL_LOCALE[locale], { style: 'currency', currency: 'TRY' }),
      date: new Intl.DateTimeFormat(INTL_LOCALE[locale], { dateStyle: 'medium', timeStyle: 'short' }),
    }
    formatters.set(locale, pair)
  }
  return pair
}

export function formatMoney(value: Money): string {
  return current().money.format(Number(value))
}

export function formatDate(iso: Iso): string {
  return current().date.format(new Date(iso))
}
