import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cartQueryKey } from '@/features/cart/hooks/useCart'
import { api } from '@/lib/api'
import type { Order } from '@/lib/types'

export interface ShippingDetails {
  ship_name: string
  ship_phone: string
  ship_address: string
}

/** Places an order from the current cart. The server empties the cart when the order is created. */
export function useCheckout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (shipping: ShippingDetails) => api.post<Order>('/orders', shipping),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: cartQueryKey })
      void queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}
