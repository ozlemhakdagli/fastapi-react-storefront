import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router'
import { RequireAdmin, RequireAuth } from '@/components/guards'
import { renderWithProviders, testAdmin, testCustomer } from '@/test/utils'
import type { User } from '@/lib/types'

function renderAt(route: string, user: User | null, loading = false) {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<div>login page</div>} />
      <Route path="/" element={<div>home page</div>} />
      <Route element={<RequireAuth />}>
        <Route path="/cart" element={<div>cart page</div>} />
      </Route>
      <Route element={<RequireAdmin />}>
        <Route path="/admin" element={<div>admin page</div>} />
      </Route>
    </Routes>,
    { route, user, auth: { loading } },
  )
}

describe('guards', () => {
  it('RequireAuth redirects an anonymous user to /login', () => {
    renderAt('/cart', null)
    expect(screen.getByText('login page')).toBeInTheDocument()
  })

  it('RequireAuth renders the page for a logged-in user', () => {
    renderAt('/cart', testCustomer)
    expect(screen.getByText('cart page')).toBeInTheDocument()
  })

  it('RequireAdmin redirects an anonymous user to /login', () => {
    renderAt('/admin', null)
    expect(screen.getByText('login page')).toBeInTheDocument()
  })

  it('RequireAdmin redirects a customer to /', () => {
    renderAt('/admin', testCustomer)
    expect(screen.getByText('home page')).toBeInTheDocument()
  })

  it('RequireAdmin renders the page for an admin', () => {
    renderAt('/admin', testAdmin)
    expect(screen.getByText('admin page')).toBeInTheDocument()
  })

  it('renders nothing while the session is still loading', () => {
    renderAt('/cart', null, true)
    expect(screen.queryByText('login page')).not.toBeInTheDocument()
    expect(screen.queryByText('cart page')).not.toBeInTheDocument()
  })
})
