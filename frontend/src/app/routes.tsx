import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router'
import { RequireAdmin, RequireAuth } from '@/components/guards'
import { LoadingNotice } from '@/components/LoadingNotice'
import LoginPage from '@/features/auth/pages/LoginPage'
import RegisterPage from '@/features/auth/pages/RegisterPage'
import HomePage from '@/features/catalog/pages/HomePage'
import ProductDetailPage from '@/features/catalog/pages/ProductDetailPage'
import ProductListPage from '@/features/catalog/pages/ProductListPage'
import StoreLayout from '@/layouts/StoreLayout'
import AboutPage from '@/features/pages/AboutPage'
import ContactPage from '@/features/pages/ContactPage'
import NotFoundPage from '@/features/pages/NotFoundPage'

// The storefront pages are in the first download. The account, cart, checkout and admin screens are
// loaded the first time someone opens them, so visitors who only browse do not pay for them.
const MyCommentsPage = lazy(() => import('@/features/account/pages/MyCommentsPage'))
const MyMessagesPage = lazy(() => import('@/features/account/pages/MyMessagesPage'))
const AccountOrderDetailPage = lazy(() => import('@/features/account/pages/OrderDetailPage'))
const AccountOrdersPage = lazy(() => import('@/features/account/pages/OrdersPage'))
const ProfilePage = lazy(() => import('@/features/account/pages/ProfilePage'))
const AdminBrandsPage = lazy(() => import('@/features/admin/pages/BrandsPage'))
const AdminCategoriesPage = lazy(() => import('@/features/admin/pages/CategoriesPage'))
const AdminCommentsPage = lazy(() => import('@/features/admin/pages/CommentsPage'))
const AdminDashboardPage = lazy(() => import('@/features/admin/pages/DashboardPage'))
const AdminMessagesPage = lazy(() => import('@/features/admin/pages/MessagesPage'))
const AdminOrderDetailPage = lazy(() => import('@/features/admin/pages/OrderDetailPage'))
const AdminOrdersPage = lazy(() => import('@/features/admin/pages/OrdersPage'))
const AdminProductFormPage = lazy(() => import('@/features/admin/pages/ProductFormPage'))
const AdminProductsPage = lazy(() => import('@/features/admin/pages/ProductsPage'))
const AdminSettingsPage = lazy(() => import('@/features/admin/pages/SettingsPage'))
const AdminUsersPage = lazy(() => import('@/features/admin/pages/UsersPage'))
const CartPage = lazy(() => import('@/features/cart/pages/CartPage'))
const CheckoutPage = lazy(() => import('@/features/cart/pages/CheckoutPage'))
const FavoritesPage = lazy(() => import('@/features/account/pages/FavoritesPage'))
const InvoicePage = lazy(() => import('@/features/account/pages/InvoicePage'))
const AdminInvoicePage = lazy(() => import('@/features/admin/pages/AdminInvoicePage'))
const AccountLayout = lazy(() => import('@/layouts/AccountLayout'))
const AdminLayout = lazy(() => import('@/layouts/AdminLayout'))

// Browser URL -> page. This is React Router; it is unrelated to the FastAPI routers, which map
// HTTP requests to Python functions.
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<StoreLayout />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<ProductListPage />} />
        <Route path="products/:id" element={<ProductDetailPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route element={<RequireAuth />}>
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="account" element={<AccountLayout />}>
            <Route index element={<ProfilePage />} />
            <Route path="orders" element={<AccountOrdersPage />} />
            <Route path="orders/:id" element={<AccountOrderDetailPage />} />
            <Route path="comments" element={<MyCommentsPage />} />
            <Route path="messages" element={<MyMessagesPage />} />
            <Route path="favorites" element={<FavoritesPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* The invoice views are printed, so they sit outside the shop and admin layouts. */}
      <Route element={<RequireAuth />}>
        <Route
          path="account/orders/:id/invoice"
          element={
            <Suspense fallback={<LoadingNotice />}>
              <InvoicePage />
            </Suspense>
          }
        />
      </Route>

      <Route path="admin" element={<RequireAdmin />}>
        <Route path="orders/:id/invoice" element={<AdminInvoicePage />} />
        <Route element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="products/new" element={<AdminProductFormPage />} />
          <Route path="products/:id" element={<AdminProductFormPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="brands" element={<AdminBrandsPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="orders/:id" element={<AdminOrderDetailPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="messages" element={<AdminMessagesPage />} />
          <Route path="comments" element={<AdminCommentsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
