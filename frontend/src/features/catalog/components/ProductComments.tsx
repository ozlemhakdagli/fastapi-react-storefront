import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation } from 'react-router'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { ErrorNotice } from '@/components/ErrorNotice'
import { FormField } from '@/components/FormField'
import { LoadingNotice } from '@/components/LoadingNotice'
import { Pagination } from '@/components/Pagination'
import { RatingInput } from '@/components/RatingInput'
import { RatingStars } from '@/components/RatingStars'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/features/auth/AuthContext'
import { useAddComment, useComments, useDeleteComment } from '@/features/catalog/hooks/useComments'
import { useMyRating, useRemoveRating, useSetRating } from '@/features/catalog/hooks/useRating'
import { formatDate } from '@/lib/format'
import { t } from '@/lib/i18n'

// The API accepts a comment body of 1 to 2000 characters.
const COMMENT_MAX_LENGTH = 2000

interface ProductCommentsProps {
  productId: number
}

export function ProductComments({ productId }: ProductCommentsProps) {
  const { user } = useAuth()
  const location = useLocation()
  const [page, setPage] = useState(1)
  const [draft, setDraft] = useState('')
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)
  const comments = useComments(productId, page)
  const addComment = useAddComment(productId)
  const deleteComment = useDeleteComment(productId)
  const myRating = useMyRating(productId, Boolean(user))
  const setRating = useSetRating(productId)
  const removeRating = useRemoveRating(productId)
  const ratingPending = setRating.isPending || removeRating.isPending

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const body = draft.trim()
    if (!body) return
    addComment.mutate(body, { onSuccess: () => setDraft('') })
  }

  function confirmDelete() {
    if (pendingDeleteId !== null) deleteComment.mutate(pendingDeleteId)
    setPendingDeleteId(null)
  }

  return (
    <section className="grid gap-4 rounded-xl border bg-card p-6">
      <h2 className="text-xl font-semibold">{t('catalog.comments_title')}</h2>

      {user && myRating.data?.can_rate ? (
        <div className="grid gap-2">
          <p className="text-sm font-medium">{t('catalog.rating_your')}</p>
          <div className="flex flex-wrap items-center gap-3">
            <RatingInput
              label={t('catalog.rating_your')}
              value={myRating.data.rating}
              onChange={(rating) => setRating.mutate(rating)}
              disabled={ratingPending}
            />
            {myRating.data.rating !== null ? (
              <Button
                variant="ghost"
                size="sm"
                disabled={ratingPending}
                onClick={() => removeRating.mutate()}
              >
                {t('catalog.rating_remove')}
              </Button>
            ) : null}
          </div>
          <ErrorNotice error={setRating.error ?? removeRating.error} />
        </div>
      ) : null}
      {user && myRating.data && !myRating.data.can_rate ? (
        <p className="text-muted-foreground text-sm">{t('catalog.rating_purchase_hint')}</p>
      ) : null}

      {user ? (
        <form onSubmit={handleSubmit} className="grid gap-2">
          <FormField label={t('catalog.comment_body')} htmlFor="comment-body">
            <Textarea
              id="comment-body"
              maxLength={COMMENT_MAX_LENGTH}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
          </FormField>
          <div>
            <Button type="submit" disabled={!draft.trim() || addComment.isPending}>
              {t('catalog.comment_submit')}
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-muted-foreground text-sm">
          {t('catalog.comment_login_hint')}{' '}
          <Link to="/login" state={{ from: location }} className="text-primary font-medium underline underline-offset-4">
            {t('catalog.login_link')}
          </Link>
        </p>
      )}

      <ErrorNotice error={addComment.error ?? deleteComment.error} />
      <ErrorNotice error={comments.error} />
      {comments.isPending ? <LoadingNotice /> : null}

      {comments.data && comments.data.items.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('catalog.comments_empty')}</p>
      ) : null}
      {comments.data && comments.data.items.length > 0 ? (
        <ul className="grid gap-4">
          {comments.data.items.map((comment) => (
            <li key={comment.id} className="grid gap-1.5 border-b pb-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{comment.author_name}</span>
                  {comment.rating !== null ? <RatingStars value={comment.rating} className="text-xs" /> : null}
                </div>
                <time dateTime={comment.created_at} className="text-muted-foreground">
                  {formatDate(comment.created_at)}
                </time>
              </div>
              {/* Plain text: the body is user input and must never be rendered as markup. */}
              <p className="text-sm whitespace-pre-line">{comment.body}</p>
              {user && user.id === comment.user_id ? (
                <div>
                  <Button variant="ghost" size="sm" onClick={() => setPendingDeleteId(comment.id)}>
                    {t('common.delete')}
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {comments.data ? (
        <Pagination
          page={page}
          pageSize={comments.data.page_size}
          total={comments.data.total}
          onChange={setPage}
        />
      ) : null}

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title={t('catalog.comment_delete_title')}
        description={t('catalog.comment_delete_description')}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
      />
    </section>
  )
}
