import { useParams } from 'react-router'
import { useOrder } from '@/features/account/hooks/useOrders'
import { InvoiceView } from '@/features/orders/components/InvoiceView'

export default function InvoicePage() {
  const orderId = Number(useParams().id)
  return <InvoiceView order={useOrder(orderId)} backTo={`/account/orders/${orderId}`} />
}
