import { useState } from 'react'
import type { FormEvent } from 'react'
import { ErrorNotice } from '@/components/ErrorNotice'
import { FormField } from '@/components/FormField'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/features/auth/AuthContext'
import { useChangePassword, useUpdateProfile } from '@/features/account/hooks/useProfile'
import { t } from '@/lib/i18n'
import type { User } from '@/lib/types'

export default function ProfilePage() {
  const { user } = useAuth()
  if (!user) return null
  return (
    <div className="grid gap-10">
      <PageHeader title={t('profile.title')} />
      <ProfileForm user={user} />
      <PasswordForm />
    </div>
  )
}

function ProfileForm({ user }: { user: User }) {
  const { refresh } = useAuth()
  const updateProfile = useUpdateProfile()
  const [fullName, setFullName] = useState(user.full_name)
  const [phone, setPhone] = useState(user.phone ?? '')
  const [address, setAddress] = useState(user.address ?? '')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<unknown>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaved(false)
    setError(null)
    try {
      // An empty phone or address is sent as null so that the stored value is cleared.
      await updateProfile.mutateAsync({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
      })
      await refresh()
      setSaved(true)
    } catch (caught) {
      setError(caught)
    }
  }

  return (
    <section className="grid max-w-xl gap-4">
      <h2 className="text-lg font-semibold">{t('profile.info_title')}</h2>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <FormField label={t('profile.email')} htmlFor="profile-email">
          <Input id="profile-email" type="email" value={user.email} readOnly />
        </FormField>
        <FormField label={t('profile.full_name')} htmlFor="profile-full-name">
          <Input
            id="profile-full-name"
            autoComplete="name"
            required
            maxLength={100}
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
        </FormField>
        <FormField label={t('profile.phone')} htmlFor="profile-phone">
          <Input
            id="profile-phone"
            type="tel"
            autoComplete="tel"
            maxLength={30}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </FormField>
        <FormField label={t('profile.address')} htmlFor="profile-address">
          <Textarea
            id="profile-address"
            autoComplete="street-address"
            maxLength={500}
            value={address}
            onChange={(event) => setAddress(event.target.value)}
          />
        </FormField>
        <ErrorNotice error={error} />
        {saved ? (
          <p role="status" className="text-sm">
            {t('profile.saved')}
          </p>
        ) : null}
        <Button type="submit" className="justify-self-start" disabled={updateProfile.isPending}>
          {t('common.save')}
        </Button>
      </form>
    </section>
  )
}

function PasswordForm() {
  const changePassword = useChangePassword()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [attempted, setAttempted] = useState(false)
  const [changed, setChanged] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const mismatch = next !== confirm

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAttempted(true)
    setChanged(false)
    setError(null)
    if (mismatch) return
    try {
      await changePassword.mutateAsync({ current_password: current, new_password: next })
      setCurrent('')
      setNext('')
      setConfirm('')
      setChanged(true)
    } catch (caught) {
      setError(caught)
    }
  }

  return (
    <section className="grid max-w-xl gap-4">
      <h2 className="text-lg font-semibold">{t('profile.password_title')}</h2>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <FormField label={t('profile.current_password')} htmlFor="profile-current-password">
          <Input
            id="profile-current-password"
            type="password"
            autoComplete="current-password"
            required
            value={current}
            onChange={(event) => setCurrent(event.target.value)}
          />
        </FormField>
        <FormField label={t('profile.new_password')} htmlFor="profile-new-password">
          <Input
            id="profile-new-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
            value={next}
            onChange={(event) => setNext(event.target.value)}
          />
        </FormField>
        <FormField
          label={t('profile.new_password_confirm')}
          htmlFor="profile-new-password-confirm"
          error={attempted && mismatch ? t('profile.password_mismatch') : undefined}
        >
          <Input
            id="profile-new-password-confirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
        </FormField>
        <ErrorNotice error={error} />
        {changed ? (
          <p role="status" className="text-sm">
            {t('profile.password_changed')}
          </p>
        ) : null}
        <Button type="submit" className="justify-self-start" disabled={changePassword.isPending}>
          {t('profile.password_submit')}
        </Button>
      </form>
    </section>
  )
}
