import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Cart } from '@/lib/types'

export const cartQueryKey = ['cart'] as const

/** The logged-in user's cart. The server owns it; the browser only caches the last answer. */
export function useCart() {
  return useQuery({
    queryKey: cartQueryKey,
    queryFn: () => api.get<Cart>('/cart'),
  })
}

/** Sets the absolute quantity of one cart line. The server answers with the whole cart. */
export function useSetCartQuantity() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: number; quantity: number }) =>
      api.put<Cart>(`/cart/items/${productId}`, { quantity }),
    onSuccess: (cart) => {
      queryClient.setQueryData(cartQueryKey, cart)
    },
  })
}

/** Removes one cart line. The server answers with the whole cart. */
export function useRemoveCartItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (productId: number) => api.delete<Cart>(`/cart/items/${productId}`),
    onSuccess: (cart) => {
      queryClient.setQueryData(cartQueryKey, cart)
    },
  })
}
