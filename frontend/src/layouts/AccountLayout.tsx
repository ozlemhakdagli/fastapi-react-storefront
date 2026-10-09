import { Heart, Mail, MessageCircle, ShoppingBag, User } from 'lucide-react'
import { Suspense } from 'react'
import { NavLink, Outlet } from 'react-router'
import { cn } from '@/lib/utils'
import { LoadingNotice } from '@/components/LoadingNotice'
import { t, useLocale } from '@/lib/i18n'

const links = [
  { to: '/account', label: 'layout.account_profile', end: true, icon: User },
  { to: '/account/orders', label: 'layout.account_orders', end: false, icon: ShoppingBag },
  { to: '/account/comments', label: 'layout.account_comments', end: false, icon: MessageCircle },
  { to: '/account/messages', label: 'layout.account_messages', end: false, icon: Mail },
  { to: '/account/favorites', label: 'layout.account_favorites', end: false, icon: Heart },
]

// A vertical menu beside the content from md up. Below md it is one row that scrolls sideways
// inside itself, so the page itself never scrolls sideways.
export default function AccountLayout() {
  useLocale()
  return (
    <div className="grid gap-6 md:grid-cols-[14rem_minmax(0,1fr)] md:gap-8">
      <aside className="min-w-0">
        <h2 className="mb-3 text-lg font-semibold">{t('layout.account_title')}</h2>
        <nav
          aria-label={t('layout.account_title')}
          className="-mx-1 flex gap-1 overflow-x-auto px-1 py-1 text-sm md:mx-0 md:flex-col md:overflow-visible md:p-0"
        >
          {links.map(({ to, label, end, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex shrink-0 items-center gap-2 rounded-md px-3 py-2 transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent/40 hover:text-foreground',
                )
              }
            >
              <Icon aria-hidden="true" className="size-4 shrink-0" />
              {t(label)}
            </NavLink>
          ))}
        </nav>
      </aside>
      <section className="min-w-0">
        <Suspense fallback={<LoadingNotice />}>
          <Outlet />
        </Suspense>
      </section>
    </div>
  )
}
