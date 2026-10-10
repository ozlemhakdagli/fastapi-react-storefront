import { useState } from 'react'
import { Link } from 'react-router'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { type Column } from '@/components/DataTable'
import { ErrorNotice } from '@/components/ErrorNotice'
import { PageHeader } from '@/components/PageHeader'
import { PagedTable } from '@/components/PagedTable'
import { Button } from '@/components/ui/button'
import { useAdminComments, useDeleteAdminComment } from '@/features/admin/hooks/useAdminComments'
import { formatDate } from '@/lib/format'
import { t } from '@/lib/i18n'
import { useDocumentTitle } from '@/features/pages/hooks/useDocumentTitle'
import type { AdminComment } from '@/lib/types'

export default function CommentsPage() {
  useDocumentTitle(t('admincomments.title'))
  const [page, setPage] = useState(1)
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)
  const comments = useAdminComments(page)
  const deleteComment = useDeleteAdminComment()

  function confirmDelete() {
    if (pendingDeleteId !== null) deleteComment.mutate(pendingDeleteId)
    setPendingDeleteId(null)
  }

  const columns: Column<AdminComment>[] = [
    {
      key: 'author',
      header: t('admincomments.column_author'),
      cell: (comment) => (
        <span className="grid">
          <span>{comment.author_name}</span>
          <span className="text-muted-foreground text-xs">{comment.author_email}</span>
        </span>
      ),
    },
    {
      key: 'product',
      header: t('admincomments.column_product'),
      cell: (comment) => (
        <Link to={`/products/${comment.product_id}`} className="underline underline-offset-4">
          {comment.product_name}
        </Link>
      ),
    },
    {
      key: 'body',
      header: t('admincomments.column_comment'),
      // Plain text: the body is user input and must never be rendered as markup.
      cell: (comment) => <span className="whitespace-pre-line">{comment.body}</span>,
    },
    {
      key: 'created_at',
      header: t('admincomments.column_date'),
      cell: (comment) => (
        <time dateTime={comment.created_at}>{formatDate(comment.created_at)}</time>
      ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      cell: (comment) => (
        <Button
          variant="ghost"
          size="sm"
          disabled={deleteComment.isPending}
          onClick={() => setPendingDeleteId(comment.id)}
        >
          {t('common.delete')}
        </Button>
      ),
    },
  ]

  return (
    <div className="grid gap-6">
      <PageHeader title={t('admincomments.title')} />
      <ErrorNotice error={deleteComment.error} />
      <PagedTable
        query={comments}
        columns={columns}
        rowKey={(comment) => comment.id}
        emptyText={t('admincomments.empty')}
        page={page}
        onPageChange={setPage}
      />

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title={t('admincomments.delete_title')}
        description={t('admincomments.delete_description')}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  )
}
