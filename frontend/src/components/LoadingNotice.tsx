import { t } from '@/lib/i18n'

/** The text shown while a page or a block waits for its data or its code. */
export function LoadingNotice() {
  return <p className="text-muted-foreground text-sm">{t('common.loading')}</p>
}
