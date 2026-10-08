import { NavLink, Outlet } from 'react-router'
import { t } from '@/lib/i18n'

const links = [
  { to: '/account', label: 'layout.account_profile', end: true },
  { to: '/account/orders', label: 'layout.account_orders', end: false },
  { to: '/account/comments', label: 'layout.account_comments', end: false },
  { to: '/account/messages', label: 'layout.account_messages', end: false },
]

export default function AccountLayout() {
  return (
    <div className="grid gap-8 md:grid-cols-[14rem_1fr]">
      <aside>
        <h2 className="mb-3 text-lg font-semibold">{t('layout.account_title')}</h2>
        <nav className="grid gap-1 text-sm">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 ${isActive ? 'bg-muted font-medium' : 'hover:bg-muted/60'}`
              }
            >
              {t(link.label)}
            </NavLink>
          ))}
        </nav>
      </aside>
      <section>
        <Outlet />
      </section>
    </div>
  )
}
