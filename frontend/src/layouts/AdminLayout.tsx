import { Link, NavLink, Outlet } from 'react-router'
import { t } from '@/lib/i18n'

const links = [
  { to: '/admin', label: 'admin.nav_dashboard', end: true },
  { to: '/admin/products', label: 'admin.nav_products', end: false },
  { to: '/admin/categories', label: 'admin.nav_categories', end: false },
  { to: '/admin/brands', label: 'admin.nav_brands', end: false },
  { to: '/admin/orders', label: 'admin.nav_orders', end: false },
  { to: '/admin/users', label: 'admin.nav_users', end: false },
  { to: '/admin/messages', label: 'admin.nav_messages', end: false },
  { to: '/admin/comments', label: 'admin.nav_comments', end: false },
  { to: '/admin/settings', label: 'admin.nav_settings', end: false },
]

export default function AdminLayout() {
  return (
    <div className="grid min-h-screen md:grid-cols-[15rem_1fr]">
      <aside className="bg-muted/40 border-r p-4">
        <h2 className="mb-4 text-lg font-semibold">{t('admin.title')}</h2>
        <nav className="grid gap-1 text-sm">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 ${isActive ? 'bg-background font-medium shadow-sm' : 'hover:bg-background/60'}`
              }
            >
              {t(link.label)}
            </NavLink>
          ))}
        </nav>
        <Link to="/" className="text-muted-foreground mt-6 block text-sm hover:underline">
          {t('admin.back_to_store')}
        </Link>
      </aside>
      <section className="p-6">
        <Outlet />
      </section>
    </div>
  )
}
