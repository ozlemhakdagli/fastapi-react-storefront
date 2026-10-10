import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { t } from '@/lib/i18n'
import { useDocumentTitle } from '@/features/pages/hooks/useDocumentTitle'

export default function NotFoundPage() {
  useDocumentTitle(t('pages.not_found_title'))
  return (
    <div className="mx-auto grid max-w-md justify-items-center gap-4 py-16 text-center">
      <p className="text-primary text-6xl font-bold">{t('pages.not_found_code')}</p>
      <h1 className="text-2xl font-semibold tracking-tight">{t('pages.not_found_title')}</h1>
      <p className="text-muted-foreground">{t('pages.not_found_text')}</p>
      <Button asChild size="lg">
        <Link to="/">{t('pages.not_found_home')}</Link>
      </Button>
    </div>
  )
}
