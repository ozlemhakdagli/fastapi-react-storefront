import { screen } from '@testing-library/react'
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
// so they keep passing when a page is redesigned.
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
    expect(await screen.findAllByText('Örnek Mağaza')).not.toHaveLength(0)
  })

  it('sends an anonymous visitor of /admin/products to /login', () => {
    renderAt('/admin/products')
    expect(screen.getByTestId('pathname')).toHaveTextContent('/login')
  })

  it('sends an anonymous visitor of /account to /login', () => {
    renderAt('/account')
    expect(screen.getByTestId('pathname')).toHaveTextContent('/login')
  })

  it('sends an anonymous visitor of /cart to /login', () => {
    renderAt('/cart')
    expect(screen.getByTestId('pathname')).toHaveTextContent('/login')
  })

  it('sends a customer who opens /admin to the home page', () => {
    renderAt('/admin', testCustomer)
    expect(screen.getByTestId('pathname')).toHaveTextContent(/^\/$/)
  })

  it('keeps an admin on /admin/products inside the admin layout', () => {
    renderAt('/admin/products', testAdmin)
    expect(screen.getByTestId('pathname')).toHaveTextContent('/admin/products')
    expect(screen.getByRole('heading', { name: t('admin.title') })).toBeInTheDocument()
  })

  it('keeps a customer on /account/orders inside the account layout', () => {
    renderAt('/account/orders', testCustomer)
    expect(screen.getByTestId('pathname')).toHaveTextContent('/account/orders')
    expect(screen.getByRole('heading', { name: t('layout.account_title') })).toBeInTheDocument()
  })

  it('keeps an unknown URL where it is and still shows the store layout', async () => {
    renderAt('/no/such/page')
    expect(screen.getByTestId('pathname')).toHaveTextContent('/no/such/page')
    expect(await screen.findAllByText('Örnek Mağaza')).not.toHaveLength(0)
  })
})
