import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Taxonomy } from '@/lib/types'

/**
 * All categories and brands for the product form and the product filters. The keys start with
 * ['admin'], so they never share cache entries with the customer queries ['categories'] and
 * ['brands'].
 */
export function useAdminTaxonomyOptions() {
  const categories = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => api.get<Taxonomy[]>('/admin/categories'),
  })
  const brands = useQuery({
    queryKey: ['admin', 'brands'],
    queryFn: () => api.get<Taxonomy[]>('/admin/brands'),
  })
  return { categories, brands }
}
