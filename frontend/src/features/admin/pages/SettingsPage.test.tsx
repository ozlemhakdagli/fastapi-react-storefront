import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import SettingsPage from '@/features/admin/pages/SettingsPage'
import { api, ApiError } from '@/lib/api'
import { t } from '@/lib/i18n'
import type { SiteSettings } from '@/lib/types'
import { renderWithProviders, testAdmin } from '@/test/utils'

const site: SiteSettings = {
  site_name: 'Örnek Mağaza',
  description: 'Elle yapılmış ürünler',
  address: 'Moda Cad. 1, Kadıköy, İstanbul',
  phone: '02160000000',
  email: 'destek@example.com',
  facebook: 'https://facebook.com/ornek-magaza',
  instagram: 'https://instagram.com/ornek-magaza',
  pinterest: 'https://pinterest.com/ornek-magaza',
  about_text: 'Mağazamız 2010 yılında kuruldu.',
  contact_text: 'Bize her gün ulaşabilirsiniz.',
}

function renderSettings() {
  return renderWithProviders(<SettingsPage />, { route: '/admin/settings', user: testAdmin })
}

describe('SettingsPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('test_settings_loads_all_tabs_values', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue(site)
    renderSettings()
    expect(await screen.findByLabelText(t('adminsettings.site_name'))).toHaveValue(site.site_name)
    expect(screen.getByLabelText(t('adminsettings.description'))).toHaveValue(site.description)
    expect(get).toHaveBeenCalledWith('/admin/site')

    await userEvent.click(screen.getByRole('tab', { name: t('adminsettings.tab_contact') }))
    expect(screen.getByLabelText(t('adminsettings.address'))).toHaveValue(site.address)
    expect(screen.getByLabelText(t('adminsettings.phone'))).toHaveValue(site.phone)
    expect(screen.getByLabelText(t('adminsettings.email'))).toHaveValue(site.email)

    await userEvent.click(screen.getByRole('tab', { name: t('adminsettings.tab_social') }))
    expect(screen.getByLabelText(t('adminsettings.facebook'))).toHaveValue(site.facebook)
    expect(screen.getByLabelText(t('adminsettings.instagram'))).toHaveValue(site.instagram)
    expect(screen.getByLabelText(t('adminsettings.pinterest'))).toHaveValue(site.pinterest)

    await userEvent.click(screen.getByRole('tab', { name: t('adminsettings.tab_about') }))
    expect(screen.getByLabelText(t('adminsettings.about_text'))).toHaveValue(site.about_text)

    await userEvent.click(screen.getByRole('tab', { name: t('adminsettings.tab_contact_text') }))
    expect(screen.getByLabelText(t('adminsettings.contact_text'))).toHaveValue(site.contact_text)
  })

  it('test_settings_save_puts_full_object', async () => {
    vi.spyOn(api, 'get').mockResolvedValue(site)
    const put = vi.spyOn(api, 'put').mockResolvedValue({ ...site, site_name: 'Yeni Mağaza' })
    const { queryClient } = renderSettings()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    const name = await screen.findByLabelText(t('adminsettings.site_name'))
    await userEvent.clear(name)
    await userEvent.type(name, 'Yeni Mağaza')
    await userEvent.click(screen.getByRole('button', { name: t('common.save') }))
    // One PUT with every field, including the tabs the admin did not touch.
    await waitFor(() =>
      expect(put).toHaveBeenCalledWith('/admin/site', { ...site, site_name: 'Yeni Mağaza' }),
    )
    expect(await screen.findByRole('status')).toHaveTextContent(t('adminsettings.saved'))
    // The storefront reads the public settings under ["site"].
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['site'] })
  })

  it('shows the translated message when the save fails', async () => {
    vi.spyOn(api, 'get').mockResolvedValue(site)
    vi.spyOn(api, 'put').mockRejectedValue(new ApiError(422, 'validation_error'))
    renderSettings()
    await userEvent.click(await screen.findByRole('button', { name: t('common.save') }))
    expect(await screen.findByRole('alert')).toHaveTextContent(t('errors.validation_error'))
  })

  it('does not start the form from a copy cached by an earlier visit', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    vi.spyOn(api, 'get')
      .mockResolvedValueOnce(site)
      .mockResolvedValue({ ...site, site_name: 'Yeni Mağaza' })
    const first = render(
      <QueryClientProvider client={queryClient}>
        <SettingsPage />
      </QueryClientProvider>,
    )
    expect(await screen.findByLabelText(t('adminsettings.site_name'))).toHaveValue(site.site_name)
    first.unmount()
    // The page was left; the server now holds a newer copy of the settings.
    await waitFor(() => expect(queryClient.getQueryData(['admin', 'site'])).toBeUndefined())
    render(
      <QueryClientProvider client={queryClient}>
        <SettingsPage />
      </QueryClientProvider>,
    )
    expect(await screen.findByLabelText(t('adminsettings.site_name'))).toHaveValue('Yeni Mağaza')
  })
})
