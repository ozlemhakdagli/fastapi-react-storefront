import * as React from 'react'
import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLocale, type Locale } from '@/lib/i18n'
import { cn } from '@/lib/utils'

export interface LanguageSwitcherProps extends React.ComponentProps<'button'> {
  className?: string
}

export function LanguageSwitcher({ className, ...props }: LanguageSwitcherProps) {
  const { locale, setLocale } = useLocale()

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    props.onClick?.(e)
    if (e.defaultPrevented) return

    const target = e.target as HTMLElement
    const text = target.textContent?.trim().toUpperCase()
    if (text === 'TR') {
      setLocale('tr')
    } else if (text === 'EN') {
      setLocale('en')
    } else {
      setLocale(locale === 'tr' ? 'en' : 'tr')
    }
  }

  const nextLocale: Locale = locale === 'tr' ? 'en' : 'tr'
  const nextLabel = nextLocale === 'en' ? 'English' : 'Türkçe'
  const currentLabel = locale === 'tr' ? 'Türkçe' : 'English'

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      className={cn('inline-flex items-center gap-1.5 px-2 text-xs font-medium', className)}
      aria-label={`Current language: ${currentLabel}. Switch to ${nextLabel}`}
      title={`Switch to ${nextLabel}`}
      data-testid="language-switcher"
      data-locale={locale}
      {...props}
    >
      <Globe className="size-3.5 text-muted-foreground" aria-hidden="true" />
      <span className="flex items-center gap-1 font-semibold uppercase tracking-wider">
        <span
          className={cn(
            'transition-colors',
            locale === 'tr'
              ? 'text-foreground font-bold underline underline-offset-2'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          TR
        </span>
        <span className="text-muted-foreground/40 font-normal">|</span>
        <span
          className={cn(
            'transition-colors',
            locale === 'en'
              ? 'text-foreground font-bold underline underline-offset-2'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          EN
        </span>
      </span>
    </Button>
  )
}

export default LanguageSwitcher
