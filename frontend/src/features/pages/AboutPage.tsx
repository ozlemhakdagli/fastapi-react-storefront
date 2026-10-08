import { ErrorNotice } from '@/components/ErrorNotice'
import { PageHeader } from '@/components/PageHeader'
import { useSite } from '@/features/pages/hooks/useSite'
import { t } from '@/lib/i18n'

export default function AboutPage() {
  const site = useSite()

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <PageHeader title={t('pages.about_title')} />
      <ErrorNotice error={site.error} />
      {site.isPending ? (
        <p className="text-muted-foreground text-sm">{t('common.loading')}</p>
      ) : null}
      {site.data ? (
        <p className="leading-7 whitespace-pre-line">{site.data.about_text}</p>
      ) : null}
    </div>
  )
}
