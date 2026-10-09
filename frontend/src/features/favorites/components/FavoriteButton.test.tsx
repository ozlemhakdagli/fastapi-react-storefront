import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes, useLocation } from 'react-router'
import { FavoriteButton } from '@/features/favorites/components/FavoriteButton'
import { api, ApiError } from '@/lib/api'
import { t } from '@/lib/i18n'
import { renderWithProviders, testCustomer } from '@/test/utils'

const name = 'Mekanik Klavye'
const addLabel = t('favorites.add', { name })
const removeLabel = t('favorites.remove', { name })

/** Stands in for the login page: shows the page the visitor came from, which LoginPage reads. */
function LoginProbe() {
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } } | null)?.from
  return <p>{`login, came from ${from?.pathname}`}</p>
}

describe('FavoriteButton', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sends a logged-out visitor to the login page and sends no request', async () => {
    const get = vi.spyOn(api, 'get')
    const put = vi.spyOn(api, 'put')
    const remove = vi.spyOn(api, 'delete')
    renderWithProviders(
      <>
        <FavoriteButton productId={7} name={name} />
        <Routes>
          <Route path="/login" element={<LoginProbe />} />
        </Routes>
      </>,
      { route: '/products/7' },
    )
    await userEvent.click(screen.getByRole('button', { name: addLabel }))
    expect(await screen.findByText('login, came from /products/7')).toBeInTheDocument()
    expect(get).not.toHaveBeenCalled()
    expect(put).not.toHaveBeenCalled()
    expect(remove).not.toHaveBeenCalled()
  })

  it('stays disabled while the session is still being read', () => {
    const get = vi.spyOn(api, 'get')
    renderWithProviders(<FavoriteButton productId={7} name={name} />, {
      user: null,
      auth: { loading: true },
    })
    expect(screen.getByRole('button', { name: addLabel })).toBeDisabled()
    expect(get).not.toHaveBeenCalled()
  })

  it('shows whether each product is a favourite', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ ids: [7] })
    renderWithProviders(
      <>
        <FavoriteButton productId={7} name={name} />
        <FavoriteButton productId={3} name="Kablo" />
      </>,
      { user: testCustomer },
    )
    expect(await screen.findByRole('button', { name: removeLabel })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    const kablo = screen.getByRole('button', { name: t('favorites.add', { name: 'Kablo' }) })
    expect(kablo).toHaveAttribute('aria-pressed', 'false')
  })

  it('adds with PUT and removes with DELETE, and shows each change at once', async () => {
    // A fake server: PUT adds the product, DELETE removes it, GET answers with the current list.
    let favorites: number[] = []
    vi.spyOn(api, 'get').mockImplementation(async () => ({ ids: favorites }))
    const put = vi.spyOn(api, 'put').mockImplementation(async () => {
      favorites = [7]
    })
    const remove = vi.spyOn(api, 'delete').mockImplementation(async () => {
      favorites = []
    })
    renderWithProviders(<FavoriteButton productId={7} name={name} />, { user: testCustomer })

    await userEvent.click(await screen.findByRole('button', { name: addLabel }))
    expect(await screen.findByRole('button', { name: removeLabel })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await waitFor(() => expect(put).toHaveBeenCalledWith('/me/favorites/7'))
    await waitFor(() => expect(screen.getByRole('button', { name: removeLabel })).toBeEnabled())

    await userEvent.click(screen.getByRole('button', { name: removeLabel }))
    await waitFor(() => expect(remove).toHaveBeenCalledWith('/me/favorites/7'))
    expect(await screen.findByRole('button', { name: addLabel })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('takes the change back when the server refuses it', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ ids: [] })
    let refuse: (error: unknown) => void = () => {}
    vi.spyOn(api, 'put').mockReturnValue(
      new Promise((_resolve, reject) => {
        refuse = reject
      }),
    )
    renderWithProviders(<FavoriteButton productId={7} name={name} />, { user: testCustomer })

    await userEvent.click(await screen.findByRole('button', { name: addLabel }))
    expect(await screen.findByRole('button', { name: removeLabel })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    refuse(new ApiError(500, 'unknown'))
    expect(await screen.findByRole('button', { name: addLabel })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('sends one request for two quick clicks', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ ids: [] })
    let finish: () => void = () => {}
    const put = vi.spyOn(api, 'put').mockReturnValue(
      new Promise((resolve) => {
        finish = () => resolve(undefined)
      }),
    )
    renderWithProviders(<FavoriteButton productId={7} name={name} />, { user: testCustomer })

    const button = await screen.findByRole('button', { name: addLabel })
    await userEvent.click(button)
    await userEvent.click(button)
    expect(put).toHaveBeenCalledTimes(1)
    finish()
    await waitFor(() => expect(button).toBeEnabled())
  })
})
