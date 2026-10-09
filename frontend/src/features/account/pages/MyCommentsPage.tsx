import { useState } from 'react'
import { Link } from 'react-router'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { type Column } from '@/components/DataTable'
import { ErrorNotice } from '@/components/ErrorNotice'
import { PageHeader } from '@/components/PageHeader'
import { PagedTable } from '@/components/PagedTable'
import { Button } from '@/components/ui/button'
import { useDeleteMyComment, useMyComments } from '@/features/account/hooks/useMyComments'
import { formatDate } from '@/lib/format'
import { t } from '@/lib/i18n'
import type { MyComment } from '@/lib/types'
import { usePageParam } from '@/lib/usePageParam'

export default function MyCommentsPage() {
  const [page, changePage] = usePageParam()
  // The page number lives in the URL, so that Back from a product returns to the same page.
  const comments = useMyComments(page)
  const deleteComment = useDeleteMyComment()
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)

  function confirmDelete() {
    if (pendingDeleteId !== null) deleteComment.mutate(pendingDeleteId)
    setPendingDeleteId(null)
  }

  const columns: Column<MyComment>[] = [
    {
      key: 'product',
      header: t('account.column_product'),
      cell: (comment) => (
        <Link
          to={`/products/${comment.product_id}`}
          className="font-medium underline underline-offset-4"
        >
          {comment.product_name}
        </Link>
      ),
    },
    {
      key: 'body',
      header: t('account.column_comment'),
      // Plain text: the body is user input and must never be rendered as markup.
      cell: (comment) => <span className="whitespace-pre-line">{comment.body}</span>,
    },
    {
      key: 'created_at',
      header: t('account.column_date'),
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
      <PageHeader title={t('account.comments_title')} />
      <ErrorNotice error={deleteComment.error} />
      <PagedTable
        query={comments}
        columns={columns}
        rowKey={(comment) => comment.id}
        emptyText={t('account.comments_empty')}
        page={page}
        onPageChange={changePage}
      />

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title={t('account.comment_delete_title')}
        description={t('account.comment_delete_description')}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </div>
  )
}
