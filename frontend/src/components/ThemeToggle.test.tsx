import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { THEME_STORAGE_KEY, ThemeProvider } from '@/lib/theme'
import { setLocale, t } from '@/lib/i18n'
import { ThemeToggle } from './ThemeToggle'

function setupMatchMedia(initialMatches = false) {
  let matches = initialMatches
  const listeners = new Set<(event: MediaQueryListEvent) => void>()

  const mql = {
    get matches() {
      return matches
    },
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addListener: vi.fn((cb: (e: MediaQueryListEvent) => void) => listeners.add(cb)),
    removeListener: vi.fn((cb: (e: MediaQueryListEvent) => void) => listeners.delete(cb)),
    addEventListener: vi.fn((_event: string, cb: (e: MediaQueryListEvent) => void) =>
      listeners.add(cb)
    ),
    removeEventListener: vi.fn((_event: string, cb: (e: MediaQueryListEvent) => void) =>
      listeners.delete(cb)
    ),
    dispatchEvent: vi.fn(),
  }

  const matchMedia = vi.fn().mockImplementation(() => mql)
  window.matchMedia = matchMedia as unknown as typeof window.matchMedia
  return { matchMedia }
}

describe('ThemeToggle', () => {
  beforeEach(() => {
    setupMatchMedia(false)
    document.documentElement.classList.remove('dark')
    localStorage.clear()
    setLocale('tr')
  })

  afterEach(() => {
    document.documentElement.classList.remove('dark')
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('renders button with accessible label and icon in light mode', () => {
    render(
      <ThemeProvider defaultTheme="light">
        <ThemeToggle />
      </ThemeProvider>
    )

    const button = screen.getByRole('button', { name: t('common.theme_dark') })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('title', t('common.theme_dark'))
    expect(screen.getByTestId('moon-icon')).toBeInTheDocument()
    expect(screen.queryByTestId('sun-icon')).not.toBeInTheDocument()
  })

  it('renders button with accessible label and icon in dark mode', () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <ThemeToggle />
      </ThemeProvider>
    )

    const button = screen.getByRole('button', { name: t('common.theme_light') })
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('title', t('common.theme_light'))
    expect(screen.getByTestId('sun-icon')).toBeInTheDocument()
    expect(screen.queryByTestId('moon-icon')).not.toBeInTheDocument()
  })

  it('toggles theme from light to dark on button click', async () => {
    const user = userEvent.setup()

    render(
      <ThemeProvider defaultTheme="light">
        <ThemeToggle />
      </ThemeProvider>
    )

    const button = screen.getByRole('button', { name: t('common.theme_dark') })
    expect(document.documentElement.classList.contains('dark')).toBe(false)

    await user.click(button)

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    expect(screen.getByRole('button', { name: t('common.theme_light') })).toBeInTheDocument()
    expect(screen.getByTestId('sun-icon')).toBeInTheDocument()

    // Toggle back to light
    await user.click(screen.getByRole('button', { name: t('common.theme_light') }))
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
    expect(screen.getByTestId('moon-icon')).toBeInTheDocument()
  })

  it('toggles theme when starting from system dark theme', async () => {
    setupMatchMedia(true) // System prefers dark
    const user = userEvent.setup()

    render(
      <ThemeProvider defaultTheme="system">
        <ThemeToggle />
      </ThemeProvider>
    )

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    const button = screen.getByRole('button', { name: t('common.theme_light') })
    expect(button).toBeInTheDocument()

    await user.click(button)

    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
    expect(screen.getByRole('button', { name: t('common.theme_dark') })).toBeInTheDocument()
  })

  it('calls custom onClick prop while still toggling theme', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()

    render(
      <ThemeProvider defaultTheme="light">
        <ThemeToggle onClick={handleClick} className="custom-class" />
      </ThemeProvider>
    )

    const button = screen.getByRole('button', { name: t('common.theme_dark') })
    expect(button).toHaveClass('custom-class')

    await user.click(button)

    expect(handleClick).toHaveBeenCalledTimes(1)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('supports English locale translations', () => {
    setLocale('en')

    render(
      <ThemeProvider defaultTheme="light">
        <ThemeToggle />
      </ThemeProvider>
    )

    expect(screen.getByRole('button', { name: 'Dark Theme' })).toBeInTheDocument()
  })
})
