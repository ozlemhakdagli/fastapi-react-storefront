import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { AuthProvider } from '@/features/auth/AuthContext'
import RegisterPage from '@/features/auth/pages/RegisterPage'
import { api, ApiError } from '@/lib/api'
import { t } from '@/lib/i18n'
import type { TokenOut } from '@/lib/types'
import { renderWithProviders, testCustomer } from '@/test/utils'

const password = 'Passw0rd!x'
const tokenOut: TokenOut = { access_token: 'new-token', token_type: 'bearer', user: testCustomer }
const complete = {
  email: 'ayse@example.com',
  password,
  confirm: password,
  full_name: 'Ayşe Yılmaz',
  phone: '05320000000',
  address: 'Moda Cad. 1, Kadıköy, İstanbul',
}

type Field = keyof typeof complete

const LABELS: Record<Field, string> = {
  email: 'auth.register_email',
  password: 'auth.register_password',
  confirm: 'auth.register_confirm',
  full_name: 'auth.register_full_name',
  phone: 'auth.register_phone',
  address: 'auth.register_address',
}

async function fill(values: Partial<Record<Field, string>>) {
  for (const field of Object.keys(values) as Field[]) {
    await userEvent.type(screen.getByLabelText(t(LABELS[field])), values[field] ?? '')
  }
}

// The real AuthProvider is rendered so that the login after registration calls api.post('/auth/login').
function renderRegister() {
  return renderWithProviders(
    <AuthProvider>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<div>home page</div>} />
      </Routes>
    </AuthProvider>,
    { route: '/register' },
  )
}

async function submitRegister() {
  await userEvent.click(screen.getByRole('button', { name: t('auth.register_submit') }))
}

describe('RegisterPage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the registration form with a link to login', () => {
    renderRegister()
    for (const field of Object.keys(LABELS) as Field[]) {
      expect(screen.getByLabelText(t(LABELS[field]))).toBeInTheDocument()
    }
    expect(screen.getByRole('link', { name: t('auth.register_login_link') })).toHaveAttribute(
      'href',
      '/login',
    )
  })

  it('test_register_posts_exact_body_and_logs_in', async () => {
    const post = vi
      .spyOn(api, 'post')
      .mockResolvedValueOnce(testCustomer)
      .mockResolvedValueOnce(tokenOut)
    renderRegister()
    await fill(complete)
    await submitRegister()
    await waitFor(() => expect(post).toHaveBeenCalledTimes(2))
    expect(post).toHaveBeenNthCalledWith(1, '/auth/register', {
      email: complete.email,
      password,
      full_name: complete.full_name,
      phone: complete.phone,
      address: complete.address,
    })
    expect(post).toHaveBeenNthCalledWith(2, '/auth/login', { email: complete.email, password })
    expect(await screen.findByText('home page')).toBeInTheDocument()
  })

  it('omits empty optional fields from the request body', async () => {
    const post = vi
      .spyOn(api, 'post')
      .mockResolvedValueOnce(testCustomer)
      .mockResolvedValueOnce(tokenOut)
    renderRegister()
    await fill({ email: complete.email, password, confirm: password, full_name: complete.full_name })
    await submitRegister()
    await waitFor(() => expect(post).toHaveBeenCalledTimes(2))
    const body = post.mock.calls[0][1] as Record<string, unknown>
    expect(body).toEqual({ email: complete.email, password, full_name: complete.full_name })
    expect(body).not.toHaveProperty('phone')
    expect(body).not.toHaveProperty('address')
    expect(await screen.findByText('home page')).toBeInTheDocument()
  })

  it('test_register_password_mismatch_blocks_request', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue(undefined)
    renderRegister()
    await fill({ ...complete, confirm: 'Passw0rd!y' })
    await submitRegister()
    expect(await screen.findByText(t('auth.password_mismatch'))).toBeInTheDocument()
    expect(post).not.toHaveBeenCalled()
  })

  it('shows the message when the email is already registered', async () => {
    vi.spyOn(api, 'post').mockRejectedValueOnce(new ApiError(409, 'email_taken'))
    renderRegister()
    await fill(complete)
    await submitRegister()
    expect(await screen.findByRole('alert')).toHaveTextContent(t('errors.email_taken'))
  })
})
