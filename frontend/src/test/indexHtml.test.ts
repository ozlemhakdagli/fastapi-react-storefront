import indexHtml from '../../index.html?raw'
import themeInit from '../../public/theme-init.js?raw'
import { LOCALE_STORAGE_KEY } from '@/lib/i18n'
import { THEME_STORAGE_KEY } from '@/lib/theme'

describe('index.html', () => {
  it('has no inline script, because the content security policy of nginx blocks it', () => {
    // nginx.conf sets "default-src 'self'" without script-src: only scripts loaded from a file run.
    const scriptTags = [...indexHtml.matchAll(/<script\b([^>]*)>/g)]
    const inline = scriptTags.filter(([, attributes]) => !/\bsrc=/.test(attributes))
    expect(inline).toEqual([])
  })

  it('loads the theme script from public/', () => {
    expect(indexHtml).toMatch(/<script src="\/theme-init\.js"><\/script>/)
  })
})

describe('theme-init.js', () => {
  afterEach(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.lang = 'tr'
  })

  it('applies the stored theme and language before the app starts', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    localStorage.setItem(LOCALE_STORAGE_KEY, 'en')
    new Function(themeInit)()
    expect(document.documentElement).toHaveClass('dark')
    expect(document.documentElement.lang).toBe('en')
  })

  it('stays light and Turkish when nothing is stored', () => {
    document.documentElement.classList.add('dark')
    new Function(themeInit)()
    expect(document.documentElement).not.toHaveClass('dark')
    expect(document.documentElement.lang).toBe('tr')
  })
})
