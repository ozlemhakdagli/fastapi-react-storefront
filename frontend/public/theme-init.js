// Runs before the first paint (loaded from index.html). It sets the stored theme and language, so
// that the page does not flash light or Turkish first. It is a file and not an inline script,
// because the content security policy of nginx only allows scripts from the same origin.
// The keys are THEME_STORAGE_KEY in src/lib/theme.tsx and LOCALE_STORAGE_KEY in src/lib/i18n.ts.
;(function () {
  try {
    var theme = localStorage.getItem('ecommerce.theme')
    var dark =
      theme === 'dark' ||
      (theme !== 'light' &&
        window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', Boolean(dark))
    document.documentElement.lang = localStorage.getItem('ecommerce.lang') === 'en' ? 'en' : 'tr'
  } catch (_) {
    // Storage can be blocked; the app then starts with its defaults.
  }
})()
