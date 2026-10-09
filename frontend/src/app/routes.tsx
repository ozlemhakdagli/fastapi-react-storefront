import { Route, Routes } from 'react-router'
import { RequireAdmin, RequireAuth } from '@/components/guards'
import MyCommentsPage from '@/features/account/pages/MyCommentsPage'
import MyMessagesPage from '@/features/account/pages/MyMessagesPage'
import AccountOrderDetailPage from '@/features/account/pages/OrderDetailPage'
import AccountOrdersPage from '@/features/account/pages/OrdersPage'
import ProfilePage from '@/features/account/pages/ProfilePage'
import AdminBrandsPage from '@/features/admin/pages/BrandsPage'
import AdminCategoriesPage from '@/features/admin/pages/CategoriesPage'
import AdminCommentsPage from '@/features/admin/pages/CommentsPage'
import AdminDashboardPage from '@/features/admin/pages/DashboardPage'
import AdminMessagesPage from '@/features/admin/pages/MessagesPage'
import AdminOrderDetailPage from '@/features/admin/pages/OrderDetailPage'
import AdminOrdersPage from '@/features/admin/pages/OrdersPage'
import AdminProductFormPage from '@/features/admin/pages/ProductFormPage'
import AdminProductsPage from '@/features/admin/pages/ProductsPage'
import AdminSettingsPage from '@/features/admin/pages/SettingsPage'
import AdminUsersPage from '@/features/admin/pages/UsersPage'
import LoginPage from '@/features/auth/pages/LoginPage'
import RegisterPage from '@/features/auth/pages/RegisterPage'
import CartPage from '@/features/cart/pages/CartPage'
import CheckoutPage from '@/features/cart/pages/CheckoutPage'
import HomePage from '@/features/catalog/pages/HomePage'
import ProductDetailPage from '@/features/catalog/pages/ProductDetailPage'
import ProductListPage from '@/features/catalog/pages/ProductListPage'
import AccountLayout from '@/layouts/AccountLayout'
import AdminLayout from '@/layouts/AdminLayout'
import StoreLayout from '@/layouts/StoreLayout'
import AboutPage from '@/features/pages/AboutPage'
import ContactPage from '@/features/pages/ContactPage'
import NotFoundPage from '@/features/pages/NotFoundPage'

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
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route path="admin" element={<RequireAdmin />}>
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
