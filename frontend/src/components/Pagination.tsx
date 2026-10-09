import { Button } from '@/components/ui/button'
import { t } from '@/lib/i18n'

interface PaginationProps {
  page: number
  pageSize: number
  total: number
  onChange: (page: number) => void
}

export function Pagination({ page, pageSize, total, onChange }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  // Hide the pager only when there is nothing to page through. On a page past the end (the last
  // row of the last page was just deleted) it stays, so the user can step back.
  if (pages <= 1 && page <= 1) return null
  return (
    <nav className="flex items-center justify-center gap-4 py-4">
      <Button variant="outline" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        {t('common.previous')}
      </Button>
      <span className="text-sm">{t('common.page_of', { page, pages })}</span>
      <Button variant="outline" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        {t('common.next')}
      </Button>
    </nav>
  )
}
