import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderResult } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { AuthContext, type AuthValue } from '@/features/auth/AuthContext'
import { formatMoney } from '@/lib/format'
import type { User } from '@/lib/types'

export const testCustomer: User = {
  id: 2,
  email: 'ayse@example.com',
  full_name: 'Ayşe Yılmaz',
  phone: '05320000000',
  address: 'Moda Cad. 1, Kadıköy, İstanbul',
  role: 'customer',
  is_active: true,
  created_at: '2026-10-08T12:00:00Z',
}

export const testAdmin: User = { ...testCustomer, id: 1, email: 'admin@example.com', role: 'admin' }

interface Options {
  /** Initial URL of the in-memory router. Default `/`. */
  route?: string
  /** Wrap `ui` in `<Route path={path}>` so that `useParams` works, e.g. `/products/:id`. */
  path?: string
  /** The logged-in user. `null` (default) means anonymous. */
  user?: User | null
  /** Override single fields of the fake auth value, e.g. `{ loading: true }`. */
  auth?: Partial<AuthValue>
}

export interface RenderWithProvidersResult extends RenderResult {
  queryClient: QueryClient
  auth: AuthValue
}

/**
 * Renders `ui` inside a fresh QueryClient (no retries), an in-memory router and a fake auth
 * context. Mock the network with `vi.spyOn(api, 'get').mockResolvedValue(...)` (keeps the real
 * `ApiError` class, unlike `vi.mock('@/lib/api')`).
 */
export function renderWithProviders(
  ui: ReactElement,
  { route = '/', path, user = null, auth: authOverrides }: Options = {},
): RenderWithProvidersResult {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const auth: AuthValue = {
    user,
    loading: false,
    login: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn(),
    refresh: vi.fn().mockResolvedValue(undefined),
    ...authOverrides,
  }
  const content = path ? (
    <Routes>
      <Route path={path} element={ui} />
    </Routes>
  ) : (
    ui
  )
  const result = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <AuthContext.Provider value={auth}>{content}</AuthContext.Provider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return { ...result, queryClient, auth }
}

// Intl may put a non-breaking space before the lira sign. The default text matcher only
// collapses ordinary whitespace, so the expected text is normalized the same way.
export function price(value: string): string {
  return formatMoney(value).replace(/\s/g, ' ')
}
