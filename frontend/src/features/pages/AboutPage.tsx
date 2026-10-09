import { ErrorNotice } from '@/components/ErrorNotice'
import { LoadingNotice } from '@/components/LoadingNotice'
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
        <LoadingNotice />
      ) : null}
      {site.data?.about_text ? (
        <div className="rounded-xl border bg-card p-6 sm:p-8">
          <p className="leading-7 whitespace-pre-line">{site.data.about_text}</p>
        </div>
      ) : null}
    </div>
  )
}
