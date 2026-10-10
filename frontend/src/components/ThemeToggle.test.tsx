import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeToggle } from '@/components/ThemeToggle'
import { setLocale, t } from '@/lib/i18n'
import { THEME_STORAGE_KEY, ThemeProvider } from '@/lib/theme'
import { mockSystemTheme } from '@/test/matchMedia'

function renderToggle() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  )
}

const isDark = () => document.documentElement.classList.contains('dark')

describe('ThemeToggle', () => {
  afterEach(() => setLocale('tr'))

  it('offers the dark theme in light mode and the light theme in dark mode', () => {
    mockSystemTheme(false)
    localStorage.setItem(THEME_STORAGE_KEY, 'light')
    const { unmount } = renderToggle()
    expect(screen.getByRole('button', { name: t('common.theme_dark') })).toBeInTheDocument()
    unmount()

    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    renderToggle()
    expect(screen.getByRole('button', { name: t('common.theme_light') })).toBeInTheDocument()
  })

  it('switches the theme of the page with every click and remembers it', async () => {
    mockSystemTheme(false)
    renderToggle()

    await userEvent.click(screen.getByRole('button', { name: t('common.theme_dark') }))
    expect(isDark()).toBe(true)
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')

    await userEvent.click(screen.getByRole('button', { name: t('common.theme_light') }))
    expect(isDark()).toBe(false)
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
  })

  it('chooses light when it is clicked on a dark system', async () => {
    mockSystemTheme(true)
    renderToggle()
    expect(isDark()).toBe(true)

    await userEvent.click(screen.getByRole('button', { name: t('common.theme_light') }))
    expect(isDark()).toBe(false)
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
  })

  it('speaks English when the language is English', () => {
    mockSystemTheme(false)
    setLocale('en')
    renderToggle()
    expect(screen.getByRole('button', { name: 'Dark Theme' })).toBeInTheDocument()
  })
})
