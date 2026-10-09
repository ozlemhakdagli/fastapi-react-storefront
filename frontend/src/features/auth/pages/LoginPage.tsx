import { Store } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import type { To } from 'react-router'
import { ErrorNotice } from '@/components/ErrorNotice'
import { FormField } from '@/components/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/features/auth/AuthContext'
import { t } from '@/lib/i18n'

// RequireAuth stores the location the visitor asked for in `state.from`.
interface LoginLocationState {
  from?: To
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const from = (location.state as LoginLocationState | null)?.from
    setBusy(true)
    setError(null)
    try {
      await login(email.trim(), password)
      navigate(from ?? '/', { replace: true })
    } catch (caught) {
      setError(caught)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-md gap-6 rounded-xl border bg-card p-6 shadow-sm sm:p-8">
      <div className="grid justify-items-center gap-3 text-center">
        <div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
          <Store aria-hidden="true" className="size-5" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('auth.login_title')}</h1>
      </div>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <FormField label={t('auth.login_email')} htmlFor="login-email">
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </FormField>
        <FormField label={t('auth.login_password')} htmlFor="login-password">
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </FormField>
        <ErrorNotice error={error} />
        <Button type="submit" className="w-full" disabled={busy}>
          {t('auth.login_submit')}
        </Button>
      </form>
      <p className="text-muted-foreground text-center text-sm">
        {t('auth.login_no_account')}{' '}
        <Link to="/register" className="text-primary font-medium underline underline-offset-4">
          {t('auth.login_register_link')}
        </Link>
      </p>
    </div>
  )
}
