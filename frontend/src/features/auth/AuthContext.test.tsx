import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from '@/features/auth/AuthContext'
import { api, ApiError } from '@/lib/api'
import type { TokenOut, User } from '@/lib/types'

const user: User = {
  id: 2,
  email: 'ayse@example.com',
  full_name: 'Ayşe Yılmaz',
  phone: null,
  address: null,
  role: 'customer',
  is_active: true,
  created_at: '2026-10-08T12:00:00Z',
}

function Probe() {
  const { user: current, loading, login, logout } = useAuth()
  return (
    <div>
      <span data-testid="state">{loading ? 'loading' : (current?.email ?? 'anonymous')}</span>
      <button onClick={() => void login('ayse@example.com', 'secret123')}>login</button>
      <button onClick={logout}>logout</button>
    </div>
  )
}

function setup() {
  const queryClient = new QueryClient()
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Probe />
      </AuthProvider>
    </QueryClientProvider>,
  )
  return queryClient
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('loads the user from /auth/me when a token is stored', async () => {
    localStorage.setItem('ecommerce.token', 'stored')
    const get = vi.spyOn(api, 'get').mockResolvedValue(user)
    setup()
    expect(screen.getByTestId('state')).toHaveTextContent('loading')
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('ayse@example.com'))
    expect(get).toHaveBeenCalledWith('/auth/me')
  })

  it('stays anonymous without calling the API when no token is stored', async () => {
    const get = vi.spyOn(api, 'get')
    setup()
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('anonymous'))
    expect(get).not.toHaveBeenCalled()
  })

  it('falls back to anonymous when /auth/me fails', async () => {
    localStorage.setItem('ecommerce.token', 'stale')
    vi.spyOn(api, 'get').mockRejectedValue(new ApiError(401, 'unauthorized'))
    setup()
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('anonymous'))
  })

  it('login stores the token and sets the user', async () => {
    const response: TokenOut = { access_token: 'new-token', token_type: 'bearer', user }
    const post = vi.spyOn(api, 'post').mockResolvedValue(response)
    setup()
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('anonymous'))
    await userEvent.click(screen.getByText('login'))
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('ayse@example.com'))
    expect(post).toHaveBeenCalledWith('/auth/login', {
      email: 'ayse@example.com',
      password: 'secret123',
    })
    expect(localStorage.getItem('ecommerce.token')).toBe('new-token')
  })

  it('logout clears the token, the user and the query cache', async () => {
    localStorage.setItem('ecommerce.token', 'stored')
    vi.spyOn(api, 'get').mockResolvedValue(user)
    const queryClient = setup()
    queryClient.setQueryData(['cart'], { items: [] })
    await waitFor(() => expect(screen.getByTestId('state')).toHaveTextContent('ayse@example.com'))
    await userEvent.click(screen.getByText('logout'))
    expect(screen.getByTestId('state')).toHaveTextContent('anonymous')
    expect(localStorage.getItem('ecommerce.token')).toBeNull()
    expect(queryClient.getQueryData(['cart'])).toBeUndefined()
  })
})
