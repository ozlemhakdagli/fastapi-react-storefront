import { Store } from 'lucide-react'
import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { ErrorNotice } from '@/components/ErrorNotice'
import { FormField } from '@/components/FormField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/features/auth/AuthContext'
import { useRegister } from '@/features/auth/hooks/useRegister'
import type { RegisterInput } from '@/features/auth/hooks/useRegister'
import { t } from '@/lib/i18n'

const EMPTY_FORM = {
  email: '',
  password: '',
  confirm: '',
  full_name: '',
  phone: '',
  address: '',
}

type FormValues = typeof EMPTY_FORM

export default function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const register = useRegister()
  const [values, setValues] = useState<FormValues>(EMPTY_FORM)
  const [attempted, setAttempted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const mismatch = values.password !== values.confirm

  function setField(field: keyof FormValues) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { value } = event.target
      setValues((current) => ({ ...current, [field]: value }))
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAttempted(true)
    setError(null)
    if (mismatch) return

    const email = values.email.trim()
    const phone = values.phone.trim()
    const address = values.address.trim()
    // Empty optional fields are left out of the body rather than sent as empty strings.
    const body: RegisterInput = {
      email,
      password: values.password,
      full_name: values.full_name.trim(),
      ...(phone ? { phone } : {}),
      ...(address ? { address } : {}),
    }
    setBusy(true)
    try {
      await register.mutateAsync(body)
      await login(email, values.password)
      navigate('/', { replace: true })
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
        <h1 className="text-2xl font-semibold tracking-tight">{t('auth.register_title')}</h1>
      </div>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <FormField label={t('auth.register_email')} htmlFor="register-email">
          <Input
            id="register-email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            value={values.email}
            onChange={setField('email')}
          />
        </FormField>
        <FormField label={t('auth.register_password')} htmlFor="register-password">
          <Input
            id="register-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
            value={values.password}
            onChange={setField('password')}
          />
        </FormField>
        <FormField
          label={t('auth.register_confirm')}
          htmlFor="register-confirm"
          error={attempted && mismatch ? t('auth.password_mismatch') : undefined}
        >
          <Input
            id="register-confirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
            value={values.confirm}
            onChange={setField('confirm')}
          />
        </FormField>
        <FormField label={t('auth.register_full_name')} htmlFor="register-full-name">
          <Input
            id="register-full-name"
            autoComplete="name"
            required
            maxLength={100}
            value={values.full_name}
            onChange={setField('full_name')}
          />
        </FormField>
        <FormField label={t('auth.register_phone')} htmlFor="register-phone">
          <Input
            id="register-phone"
            type="tel"
            autoComplete="tel"
            maxLength={30}
            value={values.phone}
            onChange={setField('phone')}
          />
        </FormField>
        <FormField label={t('auth.register_address')} htmlFor="register-address">
          <Textarea
            id="register-address"
            autoComplete="street-address"
            maxLength={500}
            value={values.address}
            onChange={setField('address')}
          />
        </FormField>
        <ErrorNotice error={error} />
        <Button type="submit" className="w-full" disabled={busy}>
          {t('auth.register_submit')}
        </Button>
      </form>
      <p className="text-muted-foreground text-center text-sm">
        {t('auth.register_has_account')}{' '}
        <Link to="/login" className="text-primary font-medium underline underline-offset-4">
          {t('auth.register_login_link')}
        </Link>
      </p>
    </div>
  )
}
