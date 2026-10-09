import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/lib/theme'
import { t } from '@/lib/i18n'

export interface ThemeToggleProps extends React.ComponentProps<typeof Button> {}

export function ThemeToggle({
  variant = 'ghost',
  size = 'icon',
  className,
  children,
  onClick,
  ...props
}: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  const handleToggle = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event)
    if (!event.defaultPrevented) {
      setTheme(isDark ? 'light' : 'dark')
    }
  }

  const label = isDark ? t('common.theme_light') : t('common.theme_dark')

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      aria-label={props['aria-label'] ?? label}
      title={props.title ?? label}
      onClick={handleToggle}
      {...props}
    >
      {children ?? (
        <>
          {isDark ? (
            <Sun className="size-4" aria-hidden="true" data-testid="sun-icon" />
          ) : (
            <Moon className="size-4" aria-hidden="true" data-testid="moon-icon" />
          )}
          <span className="sr-only">{label}</span>
        </>
      )}
    </Button>
  )
}
