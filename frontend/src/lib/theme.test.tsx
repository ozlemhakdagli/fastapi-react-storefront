import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockSystemTheme } from '@/test/matchMedia'
import { THEME_STORAGE_KEY, ThemeProvider, useTheme } from './theme'

function Consumer() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button onClick={() => setTheme('light')}>Set Light</button>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
    </div>
  )
}

function renderConsumer() {
  render(
    <ThemeProvider>
      <Consumer />
    </ThemeProvider>,
  )
}

const isDark = () => document.documentElement.classList.contains('dark')

describe('ThemeProvider', () => {
  it('follows a light system when nothing is stored', () => {
    mockSystemTheme(false)
    renderConsumer()
    expect(screen.getByTestId('theme')).toHaveTextContent('system')
    expect(screen.getByTestId('resolved')).toHaveTextContent('light')
    expect(isDark()).toBe(false)
  })

  it('follows a dark system when nothing is stored', () => {
    mockSystemTheme(true)
    renderConsumer()
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark')
    expect(isDark()).toBe(true)
  })

  it('starts from the stored choice', () => {
    mockSystemTheme(false)
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    renderConsumer()
    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    expect(isDark()).toBe(true)
  })

  it('stores a choice and sets the dark class on the page', async () => {
    mockSystemTheme(false)
    renderConsumer()

    await userEvent.click(screen.getByRole('button', { name: 'Set Dark' }))
    expect(isDark()).toBe(true)
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')

    await userEvent.click(screen.getByRole('button', { name: 'Set Light' }))
    expect(isDark()).toBe(false)
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
  })

  it('follows the system while the theme is system', () => {
    const system = mockSystemTheme(false)
    renderConsumer()

    act(() => system.change(true))
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark')
    expect(isDark()).toBe(true)

    act(() => system.change(false))
    expect(screen.getByTestId('resolved')).toHaveTextContent('light')
    expect(isDark()).toBe(false)
  })

  it('ignores the system after an explicit choice', async () => {
    const system = mockSystemTheme(false)
    renderConsumer()
    await userEvent.click(screen.getByRole('button', { name: 'Set Dark' }))

    act(() => system.change(false))
    expect(isDark()).toBe(true)
  })

  it('throws outside a ThemeProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Consumer />)).toThrow('useTheme must be used within a ThemeProvider')
    spy.mockRestore()
  })
})
