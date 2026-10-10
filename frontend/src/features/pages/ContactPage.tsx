import { useState } from 'react'
import type { ChangeEvent, FormEvent, ReactNode } from 'react'
import { Mail, MapPin, Phone, type LucideIcon } from 'lucide-react'
import { ErrorNotice } from '@/components/ErrorNotice'
import { FormField } from '@/components/FormField'
import { LoadingNotice } from '@/components/LoadingNotice'
import { PageHeader } from '@/components/PageHeader'
import { RichTextViewer } from '@/components/RichTextViewer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/features/auth/AuthContext'
import { type ContactInput, useSendContact, useSite } from '@/features/pages/hooks/useSite'
import { t } from '@/lib/i18n'
import { useDocumentTitle } from '@/features/pages/hooks/useDocumentTitle'
import type { SiteSettings, User } from '@/lib/types'

// Same limits as the messages table and the ContactIn schema (docs/api.md).
const MAX_LENGTH = { name: 100, email: 254, phone: 30, subject: 200, body: 5000 } as const

const SOCIAL_NETWORKS = [
  { field: 'facebook', label: 'pages.social_facebook' },
  { field: 'instagram', label: 'pages.social_instagram' },
  { field: 'pinterest', label: 'pages.social_pinterest' },
] as const

// Only http(s) addresses become links, so a stored "javascript:" address can never run.
function isWebAddress(value: string): boolean {
  return /^https?:\/\//i.test(value)
}

export default function ContactPage() {
  useDocumentTitle(t('pages.contact_title'))
  const { user, loading } = useAuth()
  const site = useSite()

  return (
    <div className="grid gap-8">
      <PageHeader title={t('pages.contact_title')} />
      <div className="grid items-start gap-6 md:grid-cols-2">
        <div className="grid gap-6">
          <ErrorNotice error={site.error} />
          {site.isPending ? (
            <LoadingNotice />
          ) : null}
          {site.data ? <SiteDetails site={site.data} /> : null}
        </div>
        {/* Wait for the session check, so that a logged-in visitor's fields are prefilled. */}
        {loading ? (
          <LoadingNotice />
        ) : (
          <ContactForm user={user} />
        )}
      </div>
    </div>
  )
}

function SiteDetails({ site }: { site: SiteSettings }) {
  const socials = SOCIAL_NETWORKS.map(({ field, label }) => ({
    field,
    label: t(label),
    value: site[field].trim(),
  })).filter((network) => network.value !== '')

  return (
    <div className="grid gap-6 rounded-xl border bg-card p-6 sm:p-8">
      {site.contact_text ? (
        <RichTextViewer content={site.contact_text} />
      ) : null}
      <div className="grid gap-5">
        {site.address ? (
          <Detail label={t('pages.info_address')} icon={MapPin}>
            {site.address}
          </Detail>
        ) : null}
        {site.phone ? (
          <Detail label={t('pages.info_phone')} icon={Phone}>
            {site.phone}
          </Detail>
        ) : null}
        {site.email ? (
          <Detail label={t('pages.info_email')} icon={Mail}>
            {site.email}
          </Detail>
        ) : null}
        {socials.map(({ field, label, value }) => (
          <Detail key={field} label={label}>
            {isWebAddress(value) ? (
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4"
              >
                {value}
              </a>
            ) : (
              value
            )}
          </Detail>
        ))}
      </div>
    </div>
  )
}

interface DetailProps {
  label: string
  /** Shown in a tile beside the value; rows without one are indented to line up. */
  icon?: LucideIcon
  children: ReactNode
}

function Detail({ label, icon: Icon, children }: DetailProps) {
  const term = (
    <dl className="grid min-w-0 gap-1">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="wrap-break-word whitespace-pre-line">{children}</dd>
    </dl>
  )

  if (!Icon) return <div className="ps-12">{term}</div>

  return (
    <div className="flex items-start gap-3">
      <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
        <Icon aria-hidden="true" className="size-4" />
      </span>
      {term}
    </div>
  )
}

interface ContactFormValues {
  name: string
  email: string
  phone: string
  subject: string
  body: string
}

type FieldErrors = Partial<Record<keyof ContactFormValues, string>>

// The phone number is optional; every other field must contain text.
const REQUIRED_FIELDS: (keyof ContactFormValues)[] = ['name', 'email', 'subject', 'body']

function validate(values: ContactFormValues): FieldErrors {
  const errors: FieldErrors = {}
  for (const field of REQUIRED_FIELDS) {
    if (values[field].trim() === '') errors[field] = t('pages.field_required')
  }
  return errors
}

function ContactForm({ user }: { user: User | null }) {
  const send = useSendContact()
  const [values, setValues] = useState<ContactFormValues>(() => ({
    name: user?.full_name ?? '',
    email: user?.email ?? '',
    phone: '',
    subject: '',
    body: '',
  }))
  // Field errors appear after the first submit attempt, then follow the inputs.
  const [attempted, setAttempted] = useState(false)
  const errors: FieldErrors = attempted ? validate(values) : {}

  function update(field: keyof ContactFormValues) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { value } = event.target
      setValues((current) => ({ ...current, [field]: value }))
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (send.isPending) return // a second submit must not send a second message
    setAttempted(true)
    if (Object.keys(validate(values)).length > 0) return
    const phone = values.phone.trim()
    const input: ContactInput = {
      name: values.name.trim(),
      email: values.email.trim(),
      subject: values.subject.trim(),
      body: values.body.trim(),
      // An empty phone is left out of the body rather than sent as an empty string.
      ...(phone ? { phone } : {}),
    }
    send.mutate(input)
  }

  if (send.isSuccess) {
    return (
      <div className="rounded-xl border bg-card p-6 sm:p-8">
        <p role="status" className="leading-7">
          {t('pages.form_thanks')}
        </p>
      </div>
    )
  }

  return (
    <section className="grid content-start gap-4 rounded-xl border bg-card p-6 sm:p-8">
      <h2 className="text-lg font-semibold">{t('pages.contact_form_title')}</h2>
      {/* noValidate: the messages come from our own validation, not from the browser. */}
      <form className="grid gap-4" noValidate onSubmit={handleSubmit}>
        <FormField label={t('pages.form_name')} htmlFor="contact-name" error={errors.name}>
          <Input
            id="contact-name"
            name="name"
            autoComplete="name"
            required
            maxLength={MAX_LENGTH.name}
            value={values.name}
            onChange={update('name')}
          />
        </FormField>
        <FormField label={t('pages.form_email')} htmlFor="contact-email" error={errors.email}>
          <Input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={MAX_LENGTH.email}
            value={values.email}
            onChange={update('email')}
          />
        </FormField>
        <FormField label={t('pages.form_phone')} htmlFor="contact-phone">
          <Input
            id="contact-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            maxLength={MAX_LENGTH.phone}
            value={values.phone}
            onChange={update('phone')}
          />
        </FormField>
        <FormField label={t('pages.form_subject')} htmlFor="contact-subject" error={errors.subject}>
          <Input
            id="contact-subject"
            name="subject"
            required
            maxLength={MAX_LENGTH.subject}
            value={values.subject}
            onChange={update('subject')}
          />
        </FormField>
        <FormField label={t('pages.form_body')} htmlFor="contact-body" error={errors.body}>
          <Textarea
            id="contact-body"
            name="body"
            required
            rows={6}
            maxLength={MAX_LENGTH.body}
            value={values.body}
            onChange={update('body')}
          />
        </FormField>
        <ErrorNotice error={send.error} />
        <Button type="submit" disabled={send.isPending}>
          {t('pages.form_submit')}
        </Button>
      </form>
    </section>
  )
}
