import { screen, waitFor } from '@testing-library/react'
import { Route, Routes } from 'react-router'
import StoreLayout from '@/layouts/StoreLayout'
import { api } from '@/lib/api'
import type { SiteSettings } from '@/lib/types'
import { renderWithProviders } from '@/test/utils'

const site: SiteSettings = {
  site_name: 'Örnek Mağaza',
  description: '',
  address: '',
  phone: '',
  email: '',
  facebook: '',
  instagram: '',
  pinterest: '',
  about_text: '',
  contact_text: '',
}

function renderLayout() {
  return renderWithProviders(
    <Routes>
      <Route element={<StoreLayout />}>
        <Route index element={<div>home</div>} />
      </Route>
    </Routes>,
  )
}

describe('StoreLayout', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    document.title = ''
  })

  it('puts the shop name into the browser tab title', async () => {
    vi.spyOn(api, 'get').mockResolvedValue(site)
    renderLayout()
    await waitFor(() => expect(document.title).toBe('Örnek Mağaza'))
  })

  it('shows the site name in the header and the footer', async () => {
    vi.spyOn(api, 'get').mockResolvedValue(site)
    renderLayout()
    expect(await screen.findAllByText('Örnek Mağaza')).not.toHaveLength(0)
  })
})
