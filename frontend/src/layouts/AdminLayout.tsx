import {
  Award,
  ClipboardList,
  LayoutDashboard,
  MessageCircle,
  MessageSquare,
  Package,
  Settings,
  Tags,
  Users,
} from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router'
import { t } from '@/lib/i18n'

const links = [
  { to: '/admin', label: 'admin.nav_dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'admin.nav_products', icon: Package, end: false },
  { to: '/admin/categories', label: 'admin.nav_categories', icon: Tags, end: false },
  { to: '/admin/brands', label: 'admin.nav_brands', icon: Award, end: false },
  { to: '/admin/orders', label: 'admin.nav_orders', icon: ClipboardList, end: false },
  { to: '/admin/users', label: 'admin.nav_users', icon: Users, end: false },
  { to: '/admin/messages', label: 'admin.nav_messages', icon: MessageSquare, end: false },
  { to: '/admin/comments', label: 'admin.nav_comments', icon: MessageCircle, end: false },
  { to: '/admin/settings', label: 'admin.nav_settings', icon: Settings, end: false },
]

// The focus ring is light, because the sidebar is dark.
const LINK_BASE =
  'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-accent-foreground'

export default function AdminLayout() {
  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[15rem_minmax(0,1fr)]">
      {/* Below md the sidebar is a top bar: its links wrap, so the page never scrolls sideways. */}
      <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border flex flex-col border-b p-4 md:border-r md:border-b-0">
        <h2 className="mb-3 px-3 text-lg font-semibold md:mb-4">{t('admin.title')}</h2>
        <nav className="flex flex-wrap gap-1 md:grid">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `${LINK_BASE} ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60'
                }`
              }
            >
              <Icon aria-hidden="true" className="size-4 shrink-0" />
              {t(label)}
            </NavLink>
          ))}
        </nav>
        <Link
          to="/"
          className={`${LINK_BASE} text-sidebar-foreground/80 hover:bg-sidebar-accent/60 mt-3 md:mt-auto`}
        >
          {t('admin.back_to_store')}
        </Link>
      </aside>
      <section className="bg-background min-w-0 p-6">
        <Outlet />
      </section>
    </div>
  )
}
