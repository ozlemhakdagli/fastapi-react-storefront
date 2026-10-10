/**
 * Gives the page a fake dark-mode media query; jsdom has no window.matchMedia. setup.ts removes
 * the fake after every test. `change` plays the user switching the system theme: call it inside act().
 */
export function mockSystemTheme(prefersDark: boolean) {
  let matches = prefersDark
  const listeners = new Set<(event: MediaQueryListEvent) => void>()
  const query = {
    get matches() {
      return matches
    },
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) =>
      listeners.add(listener),
    removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) =>
      listeners.delete(listener),
  }
  window.matchMedia = (() => query) as unknown as typeof window.matchMedia
  return {
    change(next: boolean) {
      matches = next
      listeners.forEach((listener) => listener({ matches: next } as MediaQueryListEvent))
    },
  }
}
