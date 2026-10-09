import { useParams } from 'react-router'
import { useAdminOrder } from '@/features/admin/hooks/useAdminOrders'
import { InvoiceView } from '@/features/orders/components/InvoiceView'

export default function AdminInvoicePage() {
  const orderId = Number(useParams().id)
  return <InvoiceView order={useAdminOrder(orderId)} backTo={`/admin/orders/${orderId}`} />
}
