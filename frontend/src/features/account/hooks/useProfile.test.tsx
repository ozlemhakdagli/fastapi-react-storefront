import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { useChangePassword } from '@/features/account/hooks/useProfile'
import { AuthContext, type AuthValue } from '@/features/auth/AuthContext'
import { api } from '@/lib/api'
import { testCustomer } from '@/test/utils'

describe('useChangePassword', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('stores the token of the answer and refreshes the session', async () => {
    localStorage.setItem('ecommerce.token', 'old-token')
    vi.spyOn(api, 'post').mockResolvedValue({
      access_token: 'new-token',
      token_type: 'bearer',
      user: testCustomer,
    })
    const auth: AuthValue = {
      user: testCustomer,
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refresh: vi.fn().mockResolvedValue(undefined),
    }
    const queryClient = new QueryClient()
    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
        </QueryClientProvider>
      )
    }

    const { result } = renderHook(() => useChangePassword(), { wrapper: Wrapper })
    await act(async () => {
      await result.current.mutateAsync({
        current_password: 'EskiPassw0rd',
        new_password: 'YeniPassw0rd',
      })
    })

    expect(localStorage.getItem('ecommerce.token')).toBe('new-token')
    expect(auth.refresh).toHaveBeenCalledOnce()
  })
})
