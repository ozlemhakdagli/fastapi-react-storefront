import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Navigate, Route, Routes } from 'react-router'
import { AuthProvider } from '@/features/auth/AuthContext'
import LoginPage from '@/features/auth/pages/LoginPage'
import { api, ApiError } from '@/lib/api'
import { t } from '@/lib/i18n'
import type { TokenOut } from '@/lib/types'
import { renderWithProviders, testCustomer } from '@/test/utils'

const email = 'jane.doe@example.com'
const password = 'Passw0rd!x'
const tokenOut: TokenOut = { access_token: 'new-token', token_type: 'bearer', user: testCustomer }

// The real AuthProvider is rendered so that login goes through api.post('/auth/login').
function renderLogin(route: string) {
  return renderWithProviders(
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<div>home page</div>} />
        <Route path="/cart" element={<div>cart page</div>} />
        {/* RequireAuth sends an anonymous visitor of /cart here, with the location in state.from. */}
        <Route
          path="/redirect"
          element={
            <Navigate to="/login" replace state={{ from: { pathname: '/cart', search: '', hash: '' } }} />
          }
        />
      </Routes>
    </AuthProvider>,
    { route },
  )
}

async function submitLogin() {
  await userEvent.type(screen.getByLabelText(t('auth.login_email')), email)
  await userEvent.type(screen.getByLabelText(t('auth.login_password')), password)
  await userEvent.click(screen.getByRole('button', { name: t('auth.login_submit') }))
}

describe('LoginPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the login form with a link to registration', () => {
    renderLogin('/login')
    expect(screen.getByLabelText(t('auth.login_email'))).toBeInTheDocument()
    expect(screen.getByLabelText(t('auth.login_password'))).toBeInTheDocument()
    expect(screen.getByRole('link', { name: t('auth.login_register_link') })).toHaveAttribute(
      'href',
      '/register',
    )
  })

  it('test_login_success_navigates_to_from', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue(tokenOut)
    renderLogin('/redirect')
    await submitLogin()
    await waitFor(() => expect(post).toHaveBeenCalledWith('/auth/login', { email, password }))
    expect(await screen.findByText('cart page')).toBeInTheDocument()
  })

  it('goes to the home page after login when there is no from location', async () => {
    vi.spyOn(api, 'post').mockResolvedValue(tokenOut)
    renderLogin('/login')
    await submitLogin()
    expect(await screen.findByText('home page')).toBeInTheDocument()
  })

  it('test_login_invalid_credentials_shows_message', async () => {
    vi.spyOn(api, 'post').mockRejectedValue(new ApiError(401, 'invalid_credentials'))
    renderLogin('/login')
    await submitLogin()
    expect(await screen.findByRole('alert')).toHaveTextContent(t('errors.invalid_credentials'))
    expect(screen.getByRole('button', { name: t('auth.login_submit') })).toBeEnabled()
  })
})
