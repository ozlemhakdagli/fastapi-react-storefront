import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { t } from '@/lib/i18n'

export default function NotFoundPage() {
  return (
    <div className="mx-auto grid max-w-md justify-items-center gap-4 py-12 text-center">
      <h1 className="text-2xl font-semibold">{t('pages.not_found_title')}</h1>
      <p className="text-muted-foreground">{t('pages.not_found_text')}</p>
      <Button asChild>
        <Link to="/">{t('pages.not_found_home')}</Link>
      </Button>
    </div>
  )
}
