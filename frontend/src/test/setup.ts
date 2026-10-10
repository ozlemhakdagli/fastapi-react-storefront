import '@testing-library/jest-dom/vitest'

// Component tests and the API layer read and write the token; start every test clean.
afterEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
  Reflect.deleteProperty(window, 'matchMedia') // jsdom has none; mockSystemTheme adds a fake
})
