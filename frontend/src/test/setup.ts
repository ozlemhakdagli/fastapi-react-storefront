import '@testing-library/jest-dom/vitest'
import { setLocale } from '@/lib/i18n'

// The screen starts in English, but the tests assert Turkish texts: pin Turkish for every test.
setLocale('tr')
beforeEach(() => setLocale('tr'))

// Component tests and the API layer read and write the token; start every test clean.
afterEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
  Reflect.deleteProperty(window, 'matchMedia') // jsdom has none; mockSystemTheme adds a fake
})
