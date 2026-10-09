import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { THEME_STORAGE_KEY, ThemeProvider, useTheme } from './theme'

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

  const setMatches = (newMatches: boolean) => {
    matches = newMatches
    listeners.forEach((cb) => {
      cb({ matches: newMatches } as MediaQueryListEvent)
    })
  }

  const matchMedia = vi.fn().mockImplementation(() => mql)
  window.matchMedia = matchMedia as unknown as typeof window.matchMedia

  return { matchMedia, setMatches, listeners }
}

function Consumer() {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button onClick={() => setTheme('light')}>Set Light</button>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
      <button onClick={() => setTheme('system')}>Set System</button>
      <button onClick={toggleTheme}>Toggle</button>
    </div>
  )
}

describe('Theme Context and Provider', () => {
  let mmHelper: ReturnType<typeof setupMatchMedia>

  beforeEach(() => {
    mmHelper = setupMatchMedia(false)
    document.documentElement.classList.remove('dark')
    localStorage.clear()
  })

  afterEach(() => {
    document.documentElement.classList.remove('dark')
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('defaults to system theme when localStorage is empty', () => {
    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme').textContent).toBe('system')
    expect(screen.getByTestId('resolved').textContent).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('defaults to system dark when system prefers dark and localStorage is empty', () => {
    mmHelper = setupMatchMedia(true)

    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme').textContent).toBe('system')
    expect(screen.getByTestId('resolved').textContent).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('defaults to stored value from localStorage', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')

    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme').textContent).toBe('dark')
    expect(screen.getByTestId('resolved').textContent).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('toggling theme updates documentElement classList and localStorage', async () => {
    const user = userEvent.setup()

    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>
    )

    expect(document.documentElement.classList.contains('dark')).toBe(false)

    // Set to dark
    await user.click(screen.getByRole('button', { name: 'Set Dark' }))
    expect(screen.getByTestId('theme').textContent).toBe('dark')
    expect(screen.getByTestId('resolved').textContent).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')

    // Set to light
    await user.click(screen.getByRole('button', { name: 'Set Light' }))
    expect(screen.getByTestId('theme').textContent).toBe('light')
    expect(screen.getByTestId('resolved').textContent).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')

    // Use toggleTheme
    await user.click(screen.getByRole('button', { name: 'Toggle' }))
    expect(screen.getByTestId('theme').textContent).toBe('dark')
    expect(screen.getByTestId('resolved').textContent).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
  })

  it('system listener responds to media query changes when theme is system', () => {
    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme').textContent).toBe('system')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(mmHelper.listeners.size).toBe(1)

    // Simulate system preference change to dark
    act(() => {
      mmHelper.setMatches(true)
    })

    expect(screen.getByTestId('resolved').textContent).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    // Simulate system preference change back to light
    act(() => {
      mmHelper.setMatches(false)
    })

    expect(screen.getByTestId('resolved').textContent).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('removes system change listener when theme switches to explicit dark/light', async () => {
    const user = userEvent.setup()

    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>
    )

    expect(mmHelper.listeners.size).toBe(1)

    await user.click(screen.getByRole('button', { name: 'Set Dark' }))
    expect(mmHelper.listeners.size).toBe(0)

    // System changes should no longer affect documentElement
    act(() => {
      mmHelper.setMatches(false)
    })
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('throws an error when useTheme is called outside ThemeProvider', () => {
    // Suppress console.error for expected react error boundary / exception
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Consumer />)).toThrow(
      'useTheme must be used within a ThemeProvider'
    )
    spy.mockRestore()
  })
})
