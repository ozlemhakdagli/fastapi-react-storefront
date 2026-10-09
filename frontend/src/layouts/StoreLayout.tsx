import { cn } from '@/lib/utils'
import { ShoppingCart, Store } from 'lucide-react'
import { Suspense, useEffect } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { LoadingNotice } from '@/components/LoadingNotice'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/AuthContext'
import { useCartCount } from '@/features/cart/hooks/useCart'
import { useSite } from '@/features/pages/hooks/useSite'
import { t } from '@/lib/i18n'

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'inline-flex items-center gap-2 rounded-md px-3 py-1.5 transition-colors',
    isActive
      ? 'bg-accent font-medium text-accent-foreground'
      : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
  )

export default function StoreLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { data: site } = useSite()
  const { data: cartCount = 0 } = useCartCount(Boolean(user))
  // Only a logged-in customer sees a count (the cart cache is also cleared on logout).
  const itemsInCart = user ? cartCount : 0

  // The browser tab shows the shop name from the site settings.
  useEffect(() => {
    if (site?.site_name) document.title = site.site_name
  }, [site?.site_name])

  return (
    <div className="flex min-h-screen flex-col">
      <header className="md:sticky md:top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
          <Link to="/" className="flex min-w-0 items-center gap-2.5 text-lg font-semibold">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Store aria-hidden="true" className="size-4" />
            </span>
            <span className="break-words">{site?.site_name || t('layout.nav_home')}</span>
          </Link>
          <nav
            className="flex basis-full flex-wrap items-center gap-1 text-sm md:basis-auto md:grow"
          >
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
          <div className="ml-auto flex flex-wrap items-center gap-2 text-sm">
            {/* The label is explicit: the visible text is hidden below sm, and hidden text
                is left out of the accessible name. */}
            <NavLink
              to="/cart"
              className={navClass}
              aria-label={
                itemsInCart > 0
                  ? t('layout.cart_with_count', { count: itemsInCart })
                  : t('layout.nav_cart')
              }
            >
              <span className="relative flex">
                <ShoppingCart aria-hidden="true" className="size-4" />
                {itemsInCart > 0 ? (
                  <span
                    aria-hidden="true"
                    className="absolute -top-2 -right-2.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-none font-semibold text-primary-foreground ring-2 ring-background"
                  >
                    {itemsInCart > 99 ? '99+' : itemsInCart}
                  </span>
                ) : null}
              </span>
              <span className="hidden sm:inline">{t('layout.nav_cart')}</span>
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
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Suspense fallback={<LoadingNotice />}>
          <Outlet />
        </Suspense>
      </main>

      <footer className="bg-sidebar text-sm text-sidebar-foreground">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="grid gap-6 md:grid-cols-2">
            <p className="text-base font-semibold text-sidebar-accent-foreground">
              {site?.site_name}
            </p>
            <div className="grid gap-1">
              {site?.address ? <p>{site.address}</p> : null}
              {site?.phone ? <p>{site.phone}</p> : null}
              {site?.email ? <p>{site.email}</p> : null}
            </div>
          </div>
          <p className="mt-8 border-t border-sidebar-border pt-6 text-sidebar-foreground/70">
            {t('layout.footer_rights')}
          </p>
        </div>
      </footer>
    </div>
  )
}
