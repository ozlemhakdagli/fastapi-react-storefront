import { screen } from '@testing-library/react'
import AboutPage from '@/features/pages/AboutPage'
import { api, ApiError } from '@/lib/api'
import { errorMessage } from '@/lib/i18n'
import type { SiteSettings } from '@/lib/types'
import { renderWithProviders } from '@/test/utils'

const site: SiteSettings = {
  site_name: 'Örnek Mağaza',
  description: '',
  address: 'Moda Cad. 1, Kadıköy, İstanbul',
  phone: '02160000000',
  email: 'info@example.com',
  facebook: '',
  instagram: '',
  pinterest: '',
  about_text:
    'Kuruluşumuz 2010 yılında kuruldu.\n' +
    '<b>Kalın</b> yazı HTML olarak değil, düz metin olarak görünür.',
  contact_text: '',
}

function renderAbout() {
  return renderWithProviders(<AboutPage />, { route: '/about' })
}

describe('AboutPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('test_about_renders_site_text_as_plain_text', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue(site)
    renderAbout()
    const paragraph = await screen.findByText(/Kuruluşumuz 2010/)
    // The line break is kept and the tags are shown as written, never parsed as HTML.
    expect(paragraph).toHaveTextContent(site.about_text, { normalizeWhitespace: false })
    expect(paragraph.textContent).toBe(site.about_text)
    expect(paragraph.querySelector('b')).toBeNull()
    expect(get).toHaveBeenCalledWith('/site')
  })

  it('shows the translated message when the site text cannot be loaded', async () => {
    const error = new ApiError(0, 'network')
    vi.spyOn(api, 'get').mockRejectedValue(error)
    renderAbout()
    expect(await screen.findByRole('alert')).toHaveTextContent(errorMessage(error))
  })
})
