import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { LoadingNotice } from '@/components/LoadingNotice'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { type Column, DataTable } from '@/components/DataTable'
import { ErrorNotice } from '@/components/ErrorNotice'
import { PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/Pagination'
import { Button } from '@/components/ui/button'
import { useDeleteMyComment, useMyComments } from '@/features/account/hooks/useMyComments'
import { formatDate } from '@/lib/format'
import { t } from '@/lib/i18n'
import type { MyComment } from '@/lib/types'

export default function MyCommentsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  // The page number lives in the URL, so that Back from a product returns to the same page.
  const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '', 10) || 1)
  const comments = useMyComments(page)
  const deleteComment = useDeleteMyComment()
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)

  function changePage(next: number) {
    setSearchParams((previous) => {
      const params = new URLSearchParams(previous)
      if (next > 1) params.set('page', String(next))
      else params.delete('page')
      return params
    })
  }

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
      <ErrorNotice error={comments.error} />
      {comments.isPending ? (
        <LoadingNotice />
      ) : null}
      {comments.data ? (
        <>
          <DataTable
            columns={columns}
            rows={comments.data.items}
            rowKey={(comment) => comment.id}
            emptyText={t('account.comments_empty')}
          />
          <Pagination
            page={page}
            pageSize={comments.data.page_size}
            total={comments.data.total}
            onChange={changePage}
          />
        </>
      ) : null}

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
