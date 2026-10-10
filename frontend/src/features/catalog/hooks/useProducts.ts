import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Page, ProductListItem } from '@/lib/types'

export type ProductSort = 'newest' | 'price_asc' | 'price_desc'

// Query parameters of GET /products (backend/app/routers/products.py).
// A type alias, not an interface, so that it is assignable to the api params type.
export type ProductQuery = {
  page?: number
  page_size?: number
  category_id?: number
  brand_id?: number
  q?: string
  sort?: ProductSort
  is_new?: boolean
}

export function useProducts(query: ProductQuery) {
  return useQuery({
    queryKey: ['products', query],
    queryFn: () => api.get<Page<ProductListItem>>('/products', query),
    // Keep showing the last list while a new filter, sort or page loads, so the grid does not blink.
    placeholderData: keepPreviousData,
  })
}
