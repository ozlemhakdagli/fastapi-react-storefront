import { useSyncExternalStore } from 'react'
import { ApiError } from '@/lib/api'

export type Locale = 'tr' | 'en'

// Every file in src/locales/{tr,en}/ is a namespace: `catalog.json` key `list_title` is t("catalog.list_title").
const trFiles = import.meta.glob<Record<string, string>>('../locales/tr/*.json', {
  eager: true,
  import: 'default',
})

const enFiles = import.meta.glob<Record<string, string>>('../locales/en/*.json', {
  eager: true,
  import: 'default',
})

const dictionaries: Record<Locale, Record<string, string>> = {
  tr: {},
  en: {},
}

function loadDictionary(
  target: Record<string, string>,
  files: Record<string, Record<string, string>>,
) {
  for (const [path, dictionary] of Object.entries(files)) {
    const namespace = path.split('/').pop()!.replace(/\.json$/, '')
    for (const [key, value] of Object.entries(dictionary)) {
      target[`${namespace}.${key}`] = value
    }
  }
}

loadDictionary(dictionaries.tr, trFiles)
loadDictionary(dictionaries.en, enFiles)

const STORAGE_KEY = 'ecommerce.lang'

function getInitialLocale(): Locale {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === 'tr' || stored === 'en') {
        return stored
      }
    }
  } catch {
    // Ignore storage errors in restricted environments
  }
  return 'tr'
}

let activeLocale: Locale = getInitialLocale()
const listeners = new Set<() => void>()

export function getLocale(): Locale {
  return activeLocale
}

export function setLocale(locale: Locale): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, locale)
    }
  } catch {
    // Ignore storage errors
  }
  if (activeLocale === locale) return
  activeLocale = locale
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useLocale(): {
  locale: Locale
  setLocale: (loc: Locale) => void
  t: typeof t
} {
  const locale = useSyncExternalStore<Locale>(subscribe, getLocale, () => 'tr')
  return {
    locale,
    setLocale,
    t,
  }
}

export function t(key: string, params?: Record<string, string | number>): string {
  const currentDict = dictionaries[activeLocale]
  let text = currentDict?.[key] ?? dictionaries.tr?.[key] ?? key
  for (const [name, value] of Object.entries(params ?? {})) {
    text = text.replaceAll(`{${name}}`, String(value))
  }
  return text
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const key = `errors.${error.code}`
    if (key in dictionaries.tr || key in dictionaries[activeLocale]) return t(key)
  }
  return t('errors.unknown')
}
