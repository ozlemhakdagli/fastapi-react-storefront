import { useCallback } from 'react'
import { useSearchParams } from 'react-router'

/**
 * The page number of a list. It lives in the `page` query parameter, so that Back from a detail
 * page returns to the same page. The setter keeps the other parameters and leaves page 1 out of
 * the URL.
 */
export function usePageParam(): [page: number, setPage: (next: number) => void] {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '', 10) || 1)
  const setPage = useCallback(
    (next: number) => {
      setSearchParams((previous) => {
        const params = new URLSearchParams(previous)
        if (next > 1) params.set('page', String(next))
        else params.delete('page')
        return params
      })
    },
    [setSearchParams],
  )
  return [page, setPage]
}
