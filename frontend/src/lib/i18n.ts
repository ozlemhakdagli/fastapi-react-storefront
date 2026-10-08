import { ApiError } from '@/lib/api'

// Every file in src/locales/tr/ is a namespace: `catalog.json` key `title` is t("catalog.title").
const files = import.meta.glob<Record<string, string>>('../locales/tr/*.json', {
  eager: true,
  import: 'default',
})

const messages: Record<string, string> = {}
for (const [path, dictionary] of Object.entries(files)) {
  const namespace = path.split('/').pop()!.replace(/\.json$/, '')
  for (const [key, value] of Object.entries(dictionary)) {
    messages[`${namespace}.${key}`] = value
  }
}

export function t(key: string, params?: Record<string, string | number>): string {
  let text = messages[key] ?? key
  for (const [name, value] of Object.entries(params ?? {})) {
    text = text.replaceAll(`{${name}}`, String(value))
  }
  return text
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const key = `errors.${error.code}`
    if (key in messages) return t(key)
  }
  return t('errors.unknown')
}
