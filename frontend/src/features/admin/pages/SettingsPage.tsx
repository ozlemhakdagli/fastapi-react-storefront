import { useState } from 'react'
import type { FormEvent } from 'react'
import { LoadingNotice } from '@/components/LoadingNotice'
import { ErrorNotice } from '@/components/ErrorNotice'
import { FormField } from '@/components/FormField'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useAdminSite, useSaveAdminSite } from '@/features/admin/hooks/useAdminSite'
import { t } from '@/lib/i18n'
import type { SiteSettings } from '@/lib/types'

// Each settings tab is one bordered card.
const PANEL = 'grid gap-4 rounded-xl border bg-card p-4'

export default function SettingsPage() {
  const site = useAdminSite()
  return (
    <div className="grid grid-cols-1 gap-6">
      <PageHeader title={t('adminsettings.title')} />
      {site.isPending ? <LoadingNotice /> : null}
      {site.isError ? <ErrorNotice error={site.error} /> : null}
      {site.data ? <SettingsForm initial={site.data} /> : null}
    </div>
  )
}

// Mounted once the settings are loaded, so `initial` is read once and later refetches do not
// overwrite what the admin is typing.
function SettingsForm({ initial }: { initial: SiteSettings }) {
  const save = useSaveAdminSite()
  const [values, setValues] = useState<SiteSettings>(initial)
  const [saved, setSaved] = useState(false)

  function update(field: keyof SiteSettings, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (save.isPending) return
    setSaved(false)
    save.mutate(trimmed(values), { onSuccess: () => setSaved(true) })
  }

  return (
    // noValidate: the API checks the values and its messages are shown by ErrorNotice.
    <form className="grid max-w-2xl grid-cols-1 gap-6" noValidate onSubmit={handleSubmit}>
      <Tabs defaultValue="general">
        <div className="max-w-full overflow-x-auto">
          <TabsList>
            <TabsTrigger value="general">{t('adminsettings.tab_general')}</TabsTrigger>
            <TabsTrigger value="contact">{t('adminsettings.tab_contact')}</TabsTrigger>
            <TabsTrigger value="social">{t('adminsettings.tab_social')}</TabsTrigger>
            <TabsTrigger value="about">{t('adminsettings.tab_about')}</TabsTrigger>
            <TabsTrigger value="contact-text">{t('adminsettings.tab_contact_text')}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="general" className={PANEL}>
          <FormField label={t('adminsettings.site_name')} htmlFor="site-name">
            <Input
              id="site-name"
              maxLength={100}
              value={values.site_name}
              onChange={(event) => update('site_name', event.target.value)}
            />
          </FormField>
          <FormField label={t('adminsettings.description')} htmlFor="site-description">
            <Textarea
              id="site-description"
              rows={3}
              maxLength={500}
              value={values.description}
              onChange={(event) => update('description', event.target.value)}
            />
          </FormField>
        </TabsContent>

        <TabsContent value="contact" className={PANEL}>
          <FormField label={t('adminsettings.address')} htmlFor="site-address">
            <Textarea
              id="site-address"
              rows={3}
              maxLength={500}
              value={values.address}
              onChange={(event) => update('address', event.target.value)}
            />
          </FormField>
          <FormField label={t('adminsettings.phone')} htmlFor="site-phone">
            <Input
              id="site-phone"
              type="tel"
              maxLength={30}
              value={values.phone}
              onChange={(event) => update('phone', event.target.value)}
            />
          </FormField>
          <FormField label={t('adminsettings.email')} htmlFor="site-email">
            <Input
              id="site-email"
              type="email"
              maxLength={254}
              value={values.email}
              onChange={(event) => update('email', event.target.value)}
            />
          </FormField>
        </TabsContent>

        <TabsContent value="social" className={PANEL}>
          <FormField label={t('adminsettings.facebook')} htmlFor="site-facebook">
            <Input
              id="site-facebook"
              maxLength={200}
              value={values.facebook}
              onChange={(event) => update('facebook', event.target.value)}
            />
          </FormField>
          <FormField label={t('adminsettings.instagram')} htmlFor="site-instagram">
            <Input
              id="site-instagram"
              maxLength={200}
              value={values.instagram}
              onChange={(event) => update('instagram', event.target.value)}
            />
          </FormField>
          <FormField label={t('adminsettings.pinterest')} htmlFor="site-pinterest">
            <Input
              id="site-pinterest"
              maxLength={200}
              value={values.pinterest}
              onChange={(event) => update('pinterest', event.target.value)}
            />
          </FormField>
        </TabsContent>

        <TabsContent value="about" className={PANEL}>
          <FormField label={t('adminsettings.about_text')} htmlFor="site-about-text">
            <Textarea
              id="site-about-text"
              rows={10}
              maxLength={20000}
              value={values.about_text}
              onChange={(event) => update('about_text', event.target.value)}
            />
          </FormField>
        </TabsContent>

        <TabsContent value="contact-text" className={PANEL}>
          <FormField label={t('adminsettings.contact_text')} htmlFor="site-contact-text">
            <Textarea
              id="site-contact-text"
              rows={10}
              maxLength={20000}
              value={values.contact_text}
              onChange={(event) => update('contact_text', event.target.value)}
            />
          </FormField>
        </TabsContent>
      </Tabs>

      <ErrorNotice error={save.error} />
      {saved ? (
        <p role="status" className="text-sm">
          {t('adminsettings.saved')}
        </p>
      ) : null}
      <Button type="submit" className="justify-self-start" disabled={save.isPending}>
        {t('common.save')}
      </Button>
    </form>
  )
}

/** The PUT body: every field of the object, with the surrounding spaces removed. */
function trimmed(values: SiteSettings): SiteSettings {
  return {
    site_name: values.site_name.trim(),
    description: values.description.trim(),
    address: values.address.trim(),
    phone: values.phone.trim(),
    email: values.email.trim(),
    facebook: values.facebook.trim(),
    instagram: values.instagram.trim(),
    pinterest: values.pinterest.trim(),
    about_text: values.about_text.trim(),
    contact_text: values.contact_text.trim(),
  }
}
