import '@testing-library/jest-dom/vitest'

// Component tests and the API layer read and write the token; start every test clean.
afterEach(() => {
  localStorage.clear()
})
