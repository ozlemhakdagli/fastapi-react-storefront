import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useMyRating, useRemoveRating, useSetRating } from '@/features/catalog/hooks/useRating'
import { api } from '@/lib/api'
import { renderWithProviders } from '@/test/utils'

function RatingProbe({ enabled }: { enabled: boolean }) {
  const { data } = useMyRating(7, enabled)
  return <p>{data ? `rating ${data.rating}, can_rate ${data.can_rate}` : 'no rating data'}</p>
}

function SetProbe() {
  const setRating = useSetRating(7)
  return <button onClick={() => setRating.mutate(4)}>Puanla</button>
}

function RemoveProbe() {
  const removeRating = useRemoveRating(7)
  return <button onClick={() => removeRating.mutate()}>Remove</button>
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useMyRating', () => {
  it('does not ask for the rating while disabled', () => {
    const get = vi.spyOn(api, 'get')
    renderWithProviders(<RatingProbe enabled={false} />)
    expect(get).not.toHaveBeenCalled()
  })

  it('loads the rating of the caller and whether they can rate', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ rating: 4, can_rate: true })
    renderWithProviders(<RatingProbe enabled />)
    expect(await screen.findByText('rating 4, can_rate true')).toBeInTheDocument()
    expect(get).toHaveBeenCalledWith('/me/ratings/7')
  })
})

describe('useSetRating', () => {
  it('puts the rating and refreshes the product and the list', async () => {
    const put = vi.spyOn(api, 'put').mockResolvedValue({ rating: 4, can_rate: true })
    const { queryClient } = renderWithProviders(<SetProbe />)
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    await userEvent.click(screen.getByRole('button', { name: 'Puanla' }))
    await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(2))
    expect(put).toHaveBeenCalledWith('/me/ratings/7', { rating: 4 })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['product', 7] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['products'] })
  })
})

describe('useRemoveRating', () => {
  it('deletes the rating and refreshes the same queries', async () => {
    const del = vi.spyOn(api, 'delete').mockResolvedValue(undefined)
    const { queryClient } = renderWithProviders(<RemoveProbe />)
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }))
    await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(2))
    expect(del).toHaveBeenCalledWith('/me/ratings/7')
  })
})
