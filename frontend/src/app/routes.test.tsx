import { screen, waitFor } from '@testing-library/react'
import { AppRoutes } from '@/app/routes'
import { api } from '@/lib/api'
import type { SiteSettings } from '@/lib/types'
import { renderWithProviders, testAdmin, testCustomer } from '@/test/utils'

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

describe('AppRoutes', () => {
  beforeEach(() => {
    vi.spyOn(api, 'get').mockResolvedValue(site)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the home page for an anonymous visitor inside the store layout', async () => {
    renderWithProviders(<AppRoutes />, { route: '/' })
    expect(screen.getByText('HomePage')).toBeInTheDocument()
    await waitFor(() => expect(screen.getAllByText('Örnek Mağaza').length).toBeGreaterThan(0))
  })

  it('sends an anonymous visitor of /admin/products to the login page', () => {
    renderWithProviders(<AppRoutes />, { route: '/admin/products' })
    expect(screen.getByText('LoginPage')).toBeInTheDocument()
  })

  it('sends an anonymous visitor of /account to the login page', () => {
    renderWithProviders(<AppRoutes />, { route: '/account' })
    expect(screen.getByText('LoginPage')).toBeInTheDocument()
  })

  it('sends a customer who opens /admin to the home page', () => {
    renderWithProviders(<AppRoutes />, { route: '/admin', user: testCustomer })
    expect(screen.getByText('HomePage')).toBeInTheDocument()
  })

  it('shows the admin page for an admin', () => {
    renderWithProviders(<AppRoutes />, { route: '/admin/products', user: testAdmin })
    expect(screen.getByText('ProductsPage')).toBeInTheDocument()
  })

  it('shows the account page for a customer', () => {
    renderWithProviders(<AppRoutes />, { route: '/account/orders', user: testCustomer })
    expect(screen.getByText('OrdersPage')).toBeInTheDocument()
  })

  it('renders the not-found page for an unknown URL', () => {
    renderWithProviders(<AppRoutes />, { route: '/no/such/page' })
    expect(screen.getByText('NotFoundPage')).toBeInTheDocument()
  })
})
