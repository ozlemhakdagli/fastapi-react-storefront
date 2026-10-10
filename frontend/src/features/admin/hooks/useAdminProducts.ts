import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { AdminProduct, Page, ProductImage } from '@/lib/types'

// Every admin product query starts with ['admin', 'products'], so one invalidation refreshes
// the list, the open product and its images.
const PRODUCTS_KEY = ['admin', 'products']

function refreshProducts(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY })
}

/** Body of POST and PUT /admin/products (backend/app/schemas/products.py). Money is sent as a string. */
export interface ProductInput {
  sku: string
  name: string
  brand_id: number | null
  category_id: number | null
  short_description: string
  description: string
  price: string
  cost_price: string | null
  stock: number
  is_new: boolean
  is_active: boolean
  /** PUT only: the `updated_at` the form was loaded with. A mismatch is a 409 product_changed. */
  expected_updated_at?: string
}

// Query parameters of GET /admin/products. A type alias, not an interface, so that it is
// assignable to the api params type.
export type AdminProductQuery = {
  page?: number
  q?: string
  category_id?: number
  brand_id?: number
  is_active?: boolean
}

export function useAdminProducts(query: AdminProductQuery) {
  return useQuery({
    queryKey: [...PRODUCTS_KEY, query],
    queryFn: () => api.get<Page<AdminProduct>>('/admin/products', query),
  })
}

/** One product for the edit page. Disabled while `id` is undefined (the create page). */
export function useAdminProduct(id: number | undefined) {
  return useQuery({
    queryKey: [...PRODUCTS_KEY, id],
    queryFn: () => api.get<AdminProduct>(`/admin/products/${id}`),
    enabled: id !== undefined,
  })
}

/** Creates the product when `id` is undefined; otherwise replaces all of its fields (PUT). */
export function useSaveAdminProduct(id: number | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ProductInput) =>
      id === undefined
        ? api.post<AdminProduct>('/admin/products', input)
        : api.put<AdminProduct>(`/admin/products/${id}`, input),
    onSuccess: () => refreshProducts(queryClient),
  })
}

/** Deletes a product. The server answers has_dependencies when an order contains it. */
export function useDeleteAdminProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/admin/products/${id}`),
    onSuccess: () => refreshProducts(queryClient),
  })
}

/** Appends an image to a product. The file goes in the multipart field `file`. */
export function useUploadProductImage(productId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return api.upload<ProductImage>(`/admin/products/${productId}/images`, form)
    },
    onSuccess: () => refreshProducts(queryClient),
  })
}

/** Sets the display order. `imageIds` must list every image of the product exactly once. */
export function useReorderProductImages(productId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (imageIds: number[]) =>
      api.put<AdminProduct>(`/admin/products/${productId}/images/order`, { image_ids: imageIds }),
    onSuccess: () => refreshProducts(queryClient),
  })
}

/** Deletes one image of a product. The server also deletes the image file. */
export function useDeleteProductImage(productId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (imageId: number) =>
      api.delete<void>(`/admin/products/${productId}/images/${imageId}`),
    onSuccess: () => refreshProducts(queryClient),
  })
}
