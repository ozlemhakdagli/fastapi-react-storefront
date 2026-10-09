// Mirrors the JSON shapes of the API (docs/api.md). Keep both in sync.

export type Money = string // two-decimal string, for example "1299.90"
export type Iso = string // ISO-8601 UTC timestamp

export interface Page<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

export interface Named {
  id: number
  name: string
}

export interface User {
  id: number
  email: string
  full_name: string
  phone: string | null
  address: string | null
  role: 'customer' | 'admin'
  is_active: boolean
  created_at: Iso
}

export interface TokenOut {
  access_token: string
  token_type: 'bearer'
  user: User
}

// Categories and brands share this shape.
export interface Taxonomy {
  id: number
  name: string
  description: string
}

export interface ProductImage {
  id: number
  url: string
  thumb_url: string
  position: number
}

export interface ProductListItem {
  id: number
  sku: string
  name: string
  short_description: string
  price: Money
  stock: number
  is_new: boolean
  brand: Named | null
  category: Named | null
  image_url: string
}

export interface ProductDetail extends ProductListItem {
  description: string
  images: ProductImage[]
  created_at: Iso
}

export interface AdminProduct extends ProductDetail {
  cost_price: Money | null
  is_active: boolean
  updated_at: Iso
}

export interface CartItem {
  product_id: number
  name: string
  unit_price: Money
  quantity: number
  line_total: Money
  stock: number
  /** False when the product was deactivated after it was added; such a line blocks checkout. */
  available: boolean
  image_url: string
}

export interface Cart {
  items: CartItem[]
  total: Money
}

export type OrderStatus = 'new' | 'approved' | 'rejected' | 'cancelled' | 'shipped' | 'completed'

export const ORDER_STATUSES: readonly OrderStatus[] = [
  'new',
  'approved',
  'rejected',
  'cancelled',
  'shipped',
  'completed',
]

export interface OrderItem {
  product_id: number
  product_name: string
  unit_price: Money
  quantity: number
  line_total: Money
}

export interface OrderListItem {
  id: number
  status: OrderStatus
  total: Money
  item_count: number
  created_at: Iso
}

export interface Order extends OrderListItem {
  ship_name: string
  ship_phone: string
  ship_address: string
  cargo_company: string | null
  tracking_no: string | null
  updated_at: Iso
  items: OrderItem[]
}

interface Customer {
  id: number
  email: string
  full_name: string
}

export interface AdminOrderListItem extends OrderListItem {
  customer: Customer
}

export interface AdminOrder extends Order {
  customer: Customer
  admin_note: string | null
}

export interface Comment {
  id: number
  product_id: number
  user_id: number
  author_name: string
  body: string
  created_at: Iso
}

export interface MyComment extends Comment {
  product_name: string
}

export interface AdminComment extends MyComment {
  author_email: string
}

export interface Message {
  id: number
  direction: 'inbound' | 'outbound'
  subject: string
  body: string
  status: 'new' | 'read'
  name: string
  email: string
  created_at: Iso
}

export interface AdminMessage extends Message {
  phone: string | null
  user_id: number | null
  admin_note: string | null
}

export interface SiteSettings {
  site_name: string
  description: string
  address: string
  phone: string
  email: string
  facebook: string
  instagram: string
  pinterest: string
  about_text: string
  contact_text: string
}
