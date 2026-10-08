import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Cart, ProductDetail } from '@/lib/types'

export function useProduct(id: number) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => api.get<ProductDetail>(`/products/${id}`),
    enabled: Number.isInteger(id) && id > 0,
  })
}

/** Adds to the cart; the cart queries (key `['cart']`) are refetched afterwards. */
export function useAddToCart() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { productId: number; quantity: number }) =>
      api.post<Cart>('/cart/items', { product_id: input.productId, quantity: input.quantity }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  })
}
