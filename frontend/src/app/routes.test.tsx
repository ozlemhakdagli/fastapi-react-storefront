import { screen, waitFor } from '@testing-library/react'
import { useLocation } from 'react-router'
import { AppRoutes } from '@/app/routes'
import { api } from '@/lib/api'
import { t } from '@/lib/i18n'
import type { SiteSettings } from '@/lib/types'
import { renderWithProviders, testAdmin, testCustomer } from '@/test/utils'
import type { User } from '@/lib/types'

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

// These tests check guards, redirects and layouts through the URL, not through page content,
// so they do not depend on page markup.
function Pathname() {
  return <div data-testid="pathname">{useLocation().pathname}</div>
}

function renderAt(route: string, user: User | null = null) {
  return renderWithProviders(
    <>
      <AppRoutes />
      <Pathname />
    </>,
    { route, user },
  )
}

describe('AppRoutes', () => {
  beforeEach(() => {
    // Only /site resolves. Every other request stays pending, so pages sit in their loading state.
    vi.spyOn(api, 'get').mockImplementation((path: string) =>
      path === '/site' ? Promise.resolve(site) : new Promise(() => {}),
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('serves the home page to an anonymous visitor inside the store layout', async () => {
    renderAt('/')
    expect(screen.getByTestId('pathname')).toHaveTextContent(/^\/$/)
    expect(await screen.findAllByText('Örnek Mağaza')).toHaveLength(2) // header and footer
  })

  it('puts the page title before the shop name in the tab, also on pages in the first download', async () => {
    renderAt('/products')
    await screen.findAllByText('Örnek Mağaza') // the site settings have arrived
    await waitFor(() =>
      expect(document.title).toBe(`${t('catalog.list_title')} | ${site.site_name}`),
    )
  })

  it('shows only the shop name in the tab on the home page', async () => {
    renderAt('/')
    await waitFor(() => expect(document.title).toBe(site.site_name))
  })

  it('sends an anonymous visitor of /admin/products to /login', () => {
    renderAt('/admin/products')
    expect(screen.getByTestId('pathname')).toHaveTextContent('/login')
  })

  it('sends an anonymous visitor of /cart to /login', async () => {
    renderAt('/cart')
    await waitFor(() => expect(screen.getByTestId('pathname')).toHaveTextContent('/login'))
  })

  it('sends a customer who opens /admin to the home page', () => {
    renderAt('/admin', testCustomer)
    expect(screen.getByTestId('pathname')).toHaveTextContent(/^\/$/)
  })

  it('keeps an admin on /admin/products inside the admin layout', async () => {
    renderAt('/admin/products', testAdmin)
    expect(screen.getByTestId('pathname')).toHaveTextContent('/admin/products')
    expect(await screen.findByRole('heading', { name: t('admin.title') })).toBeInTheDocument()
  })

  it('keeps a customer on /account/orders inside the account layout', async () => {
    renderAt('/account/orders', testCustomer)
    expect(screen.getByTestId('pathname')).toHaveTextContent('/account/orders')
    expect(
      await screen.findByRole('heading', { name: t('layout.account_title') }),
    ).toBeInTheDocument()
  })

  it('shows the favourites page inside the account layout', async () => {
    renderAt('/account/favorites', testCustomer)
    expect(screen.getByTestId('pathname')).toHaveTextContent('/account/favorites')
    expect(
      await screen.findByRole('heading', { name: t('layout.account_title') }),
    ).toBeInTheDocument()
  })

  it('sends an anonymous visitor of an invoice to /login', () => {
    renderAt('/account/orders/1/invoice')
    expect(screen.getByTestId('pathname')).toHaveTextContent('/login')
  })

  it('shows the customer invoice without the shop header', async () => {
    renderAt('/account/orders/1/invoice', testCustomer)
    expect(screen.getByTestId('pathname')).toHaveTextContent('/account/orders/1/invoice')
    expect(await screen.findByText(t('common.loading'))).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: t('layout.nav_products') })).not.toBeInTheDocument()
  })

  it('shows the admin invoice without the admin layout and keeps customers out', async () => {
    renderAt('/admin/orders/1/invoice', testAdmin)
    expect(screen.getByTestId('pathname')).toHaveTextContent('/admin/orders/1/invoice')
    expect(await screen.findByText(t('common.loading'))).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: t('admin.title') })).not.toBeInTheDocument()
  })

  it('sends a customer who opens an admin invoice to the home page', () => {
    renderAt('/admin/orders/1/invoice', testCustomer)
    expect(screen.getByTestId('pathname')).toHaveTextContent(/^\/$/)
  })

  it('keeps an unknown URL where it is and still shows the store layout', async () => {
    renderAt('/no/such/page')
    expect(screen.getByTestId('pathname')).toHaveTextContent('/no/such/page')
    expect(await screen.findAllByText('Örnek Mağaza')).toHaveLength(2) // header and footer
  })
})
