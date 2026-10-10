import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Taxonomy } from '@/lib/types'

/** The two admin taxonomy lists. Both have the same shape (/api/admin/categories and /api/admin/brands). */
export type TaxonomyEndpoint = '/admin/categories' | '/admin/brands'

interface TaxonomyInput {
  name: string
  description: string
}

const RESOURCE: Record<TaxonomyEndpoint, 'categories' | 'brands'> = {
  '/admin/categories': 'categories',
  '/admin/brands': 'brands',
}

// Admin keys start with ["admin"] so that they never collide with customer keys. The storefront
// reads the same lists under ["categories"] and ["brands"] (catalog/hooks/useTaxonomy.ts), so a
// change here refreshes those too.
function invalidateTaxonomy(queryClient: QueryClient, endpoint: TaxonomyEndpoint) {
  void queryClient.invalidateQueries({ queryKey: ['admin', RESOURCE[endpoint]] })
  void queryClient.invalidateQueries({ queryKey: [RESOURCE[endpoint]] })
}

/** GET /admin/categories or /admin/brands: every row, sorted by name (not paged). */
export function useAdminTaxonomy(endpoint: TaxonomyEndpoint) {
  return useQuery({
    queryKey: ['admin', RESOURCE[endpoint]],
    queryFn: () => api.get<Taxonomy[]>(endpoint),
  })
}

/** POST creates a row (id null); PUT /<endpoint>/<id> replaces its name and description. */
export function useSaveTaxonomy(endpoint: TaxonomyEndpoint) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: TaxonomyInput }) =>
      id === null
        ? api.post<Taxonomy>(endpoint, input)
        : api.put<Taxonomy>(`${endpoint}/${id}`, input),
    onSuccess: () => invalidateTaxonomy(queryClient, endpoint),
  })
}

/** DELETE /<endpoint>/<id>. The server answers 409 has_dependencies while rows still use the row. */
export function useDeleteTaxonomy(endpoint: TaxonomyEndpoint) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`${endpoint}/${id}`),
    onSuccess: () => invalidateTaxonomy(queryClient, endpoint),
  })
}
