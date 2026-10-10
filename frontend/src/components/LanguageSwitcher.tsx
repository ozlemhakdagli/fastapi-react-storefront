import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { setLocale, t, useLocale, type Locale } from '@/lib/i18n'
import { cn } from '@/lib/utils'

// Each language is written in itself, so a visitor can find it whatever language is shown.
const NAMES: Record<Locale, string> = { tr: 'Türkçe', en: 'English' }

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale } = useLocale()
  const next: Locale = locale === 'tr' ? 'en' : 'tr'
  const label = t('common.language_switch', { language: NAMES[next] })
  const code = (value: Locale) => (
    <span className={value === locale ? 'font-bold underline underline-offset-2' : 'text-muted-foreground'}>
      {value.toUpperCase()}
    </span>
  )

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn('gap-1.5 px-2 text-xs font-semibold tracking-wider', className)}
      aria-label={label}
      title={label}
      onClick={() => setLocale(next)}
    >
      <Globe className="size-3.5 text-muted-foreground" aria-hidden="true" />
      {code('tr')}
      <span className="text-muted-foreground/40 font-normal" aria-hidden="true">
        |
      </span>
      {code('en')}
    </Button>
  )
}
