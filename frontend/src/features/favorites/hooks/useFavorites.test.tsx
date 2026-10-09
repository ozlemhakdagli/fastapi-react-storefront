import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { AuthContext, type AuthValue } from '@/features/auth/AuthContext'
import { useFavoriteIds, useToggleFavorite } from '@/features/favorites/hooks/useFavorites'
import { api, ApiError } from '@/lib/api'
import type { User } from '@/lib/types'
import { testCustomer } from '@/test/utils'

/** Renders a hook inside a fresh QueryClient and a fake auth value. `null` means anonymous. */
function renderFavoriteHook<T>(hook: () => T, user: User | null = testCustomer) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const auth: AuthValue = {
    user,
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
  }
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
      </QueryClientProvider>
    )
  }
  return { ...renderHook(hook, { wrapper: Wrapper }), queryClient }
}

describe('useFavoriteIds', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sends no request for an anonymous visitor', () => {
    const get = vi.spyOn(api, 'get')
    renderFavoriteHook(() => useFavoriteIds(), null)
    expect(get).not.toHaveBeenCalled()
  })

  it('gives the ids of the favourites as a plain list', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ ids: [7, 3] })
    const { result } = renderFavoriteHook(() => useFavoriteIds())
    await waitFor(() => expect(result.current.data).toEqual([7, 3]))
    expect(api.get).toHaveBeenCalledWith('/me/favorites/ids')
  })
})

describe('useToggleFavorite', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows the change at once and restores the list when the request fails', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ ids: [7] })
    let refuse: (error: unknown) => void = () => {}
    vi.spyOn(api, 'put').mockReturnValue(
      new Promise((_resolve, reject) => {
        refuse = reject
      }),
    )
    const { result } = renderFavoriteHook(() => ({
      ids: useFavoriteIds(),
      toggle: useToggleFavorite(),
    }))
    await waitFor(() => expect(result.current.ids.data).toEqual([7]))
    act(() => result.current.toggle.mutate({ productId: 3, favorite: true }))
    await waitFor(() => expect(result.current.ids.data).toEqual([3, 7]))
    act(() => refuse(new ApiError(500, 'unknown')))
    await waitFor(() => expect(result.current.ids.data).toEqual([7]))
  })

  it('fetches the ids again once the request has settled', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ ids: [] })
    vi.spyOn(api, 'put').mockResolvedValue(undefined)
    const { result } = renderFavoriteHook(() => ({
      ids: useFavoriteIds(),
      toggle: useToggleFavorite(),
    }))
    await waitFor(() => expect(result.current.ids.data).toEqual([]))
    act(() => result.current.toggle.mutate({ productId: 7, favorite: true }))
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2))
  })
})
