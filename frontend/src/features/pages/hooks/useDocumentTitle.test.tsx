import { act, render, waitFor } from '@testing-library/react'
import { StrictMode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useDocumentTitle } from '@/features/pages/hooks/useDocumentTitle'
import { useSite } from '@/features/pages/hooks/useSite'
import { api } from '@/lib/api'
import type { SiteSettings } from '@/lib/types'

const fakeSite: SiteSettings = {
  site_name: 'Test Store',
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

function TestComponent({ title }: { title?: string | null }) {
  useDocumentTitle(title)
  return <div>content</div>
}

describe('useDocumentTitle', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
    document.title = ''
  })

  afterEach(() => {
    document.title = ''
  })

  it('sets document.title to title when site cache is empty', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent title="My Cart" />
      </QueryClientProvider>,
    )

    await waitFor(() => {
      expect(document.title).toBe('My Cart')
    })
  })

  it('sets document.title to ${title} | ${siteName} when site is in cache', async () => {
    queryClient.setQueryData(['site'], fakeSite)

    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent title="Product ABC" />
      </QueryClientProvider>,
    )

    await waitFor(() => {
      expect(document.title).toBe('Product ABC | Test Store')
    })
  })

  it('updates document.title reactively when site cache updates', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent title="Checkout" />
      </QueryClientProvider>,
    )

    expect(document.title).toBe('Checkout')

    act(() => {
      queryClient.setQueryData(['site'], fakeSite)
    })

    await waitFor(() => {
      expect(document.title).toBe('Checkout | Test Store')
    })
  })

  it('leaves the settings refetchable for the layout that loads them', async () => {
    // A page only reads the settings; the shop name must still follow a refetch (a window focus,
    // or the admin saving the site settings), which a query without its fetch function breaks.
    vi.spyOn(api, 'get')
      .mockResolvedValueOnce({ ...fakeSite, site_name: 'First' })
      .mockResolvedValue({ ...fakeSite, site_name: 'Second' })
    function Layout() {
      useSite()
      return <TestComponent title="Cart" />
    }
    render(
      <QueryClientProvider client={queryClient}>
        <Layout />
      </QueryClientProvider>,
    )
    await waitFor(() => expect(document.title).toBe('Cart | First'))

    await act(() => queryClient.invalidateQueries({ queryKey: ['site'] }))

    await waitFor(() => expect(document.title).toBe('Cart | Second'))
    expect(queryClient.getQueryState(['site'])?.status).toBe('success')
  })

  it('logs no error when it reads the settings, also in StrictMode as the dev server runs it', async () => {
    // A query without its fetch function logs "No queryFn was passed" as soon as something fetches.
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(api, 'get').mockResolvedValue(fakeSite)
    function Layout() {
      useSite()
      return <TestComponent title="Cart" />
    }
    render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <Layout />
        </QueryClientProvider>
      </StrictMode>,
    )
    await waitFor(() => expect(document.title).toBe('Cart | Test Store'))
    await act(() => queryClient.invalidateQueries({ queryKey: ['site'] }))

    expect(logged).not.toHaveBeenCalled()
  })
})
