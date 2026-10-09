import { Suspense } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { LoadingNotice } from '@/components/LoadingNotice'
import { useAuth } from '@/features/auth/AuthContext'

// These guards only decide what the browser shows. The real checks are in the API
// (`get_current_user` and `require_admin`), so a hidden page is never a security boundary.

/** Renders the nested routes for any logged-in user; anonymous visitors go to /login. */
export function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}

/** Renders the nested routes for admins; anonymous visitors go to /login, customers to /. */
export function RequireAdmin() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  if (user.role !== 'admin') return <Navigate to="/" replace />
  return (
    <Suspense fallback={<LoadingNotice />}>
      <Outlet />
    </Suspense>
  )
}
