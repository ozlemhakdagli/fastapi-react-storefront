import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/AuthContext'
import { api } from '@/lib/api'
import { t } from '@/lib/i18n'
import type { SiteSettings } from '@/lib/types'

const navClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'

export default function StoreLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { data: site } = useQuery({
    queryKey: ['site'],
    queryFn: () => api.get<SiteSettings>('/site'),
    staleTime: 5 * 60 * 1000,
  })

  // The browser tab shows the shop name from the site settings.
  useEffect(() => {
    if (site?.site_name) document.title = site.site_name
  }, [site?.site_name])

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-6 px-4 py-3">
          <Link to="/" className="text-lg font-semibold">
            {site?.site_name || t('layout.nav_home')}
          </Link>
          <nav className="flex flex-1 flex-wrap items-center gap-4 text-sm">
            <NavLink to="/products" className={navClass}>
              {t('layout.nav_products')}
            </NavLink>
            <NavLink to="/about" className={navClass}>
              {t('layout.nav_about')}
            </NavLink>
            <NavLink to="/contact" className={navClass}>
              {t('layout.nav_contact')}
            </NavLink>
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <NavLink to="/cart" className={navClass}>
              {t('layout.nav_cart')}
            </NavLink>
            {user ? (
              <>
                {user.role === 'admin' ? (
                  <NavLink to="/admin" className={navClass}>
                    {t('layout.nav_admin')}
                  </NavLink>
                ) : null}
                <NavLink to="/account" className={navClass}>
                  {t('layout.nav_account')}
                </NavLink>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    logout()
                    navigate('/')
                  }}
                >
                  {t('layout.nav_logout')}
                </Button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={navClass}>
                  {t('layout.nav_login')}
                </NavLink>
                <Button asChild size="sm">
                  <Link to="/register">{t('layout.nav_register')}</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t">
        <div className="text-muted-foreground mx-auto grid max-w-6xl gap-1 px-4 py-6 text-sm">
          <p className="text-foreground font-medium">{site?.site_name}</p>
          {site?.address ? <p>{site.address}</p> : null}
          {site?.phone ? <p>{site.phone}</p> : null}
          {site?.email ? <p>{site.email}</p> : null}
          <p>{t('layout.footer_rights')}</p>
        </div>
      </footer>
    </div>
  )
}
