import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { type Column, DataTable } from '@/components/DataTable'
import { ErrorNotice } from '@/components/ErrorNotice'
import { FormField } from '@/components/FormField'
import { PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/Pagination'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  useAdminMessage,
  useAdminMessages,
  useDeleteAdminMessage,
  useReplyToMessage,
  useUpdateAdminMessage,
} from '@/features/admin/hooks/useAdminMessages'
import { formatDate } from '@/lib/format'
import { t } from '@/lib/i18n'
import type { AdminMessage, Message } from '@/lib/types'

// Native selects: they behave the same in browsers and in jsdom tests, and match ui/input.
const selectClass =
  'border-input focus-visible:border-ring focus-visible:ring-ring/50 h-8 w-full min-w-0 rounded-lg border bg-transparent px-2.5 text-sm outline-none focus-visible:ring-3'

export default function MessagesPage() {
  const [status, setStatus] = useState<'' | Message['status']>('')
  const [direction, setDirection] = useState<'' | Message['direction']>('')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const messages = useAdminMessages({
    status: status || undefined,
    direction: direction || undefined,
    page,
  })

  const columns: Column<AdminMessage>[] = [
    {
      key: 'direction',
      header: t('adminmessages.column_direction'),
      cell: (message) => directionLabel(message.direction),
    },
    {
      key: 'subject',
      header: t('adminmessages.column_subject'),
      cell: (message) => (
        <Button
          variant="link"
          className="h-auto p-0 text-left whitespace-normal"
          onClick={() => setSelectedId(message.id)}
        >
          {message.subject}
        </Button>
      ),
    },
    {
      key: 'sender',
      header: t('adminmessages.column_sender'),
      cell: (message) => (
        <span className="grid">
          <span>{message.name}</span>
          <span className="text-muted-foreground text-xs">{message.email}</span>
        </span>
      ),
    },
    {
      key: 'created_at',
      header: t('adminmessages.column_date'),
      cell: (message) => (
        <time dateTime={message.created_at}>{formatDate(message.created_at)}</time>
      ),
    },
    {
      key: 'status',
      header: t('adminmessages.column_status'),
      cell: (message) => statusBadge(message.status),
    },
  ]

  return (
    <div className="grid gap-6">
      <PageHeader title={t('adminmessages.title')} />
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label={t('adminmessages.filter_status')} htmlFor="messages-filter-status">
          <select
            id="messages-filter-status"
            className={selectClass}
            value={status}
            onChange={(event) => {
              setStatus(filterStatus(event.target.value))
              setPage(1)
            }}
          >
            <option value="">{t('adminmessages.status_all')}</option>
            <option value="new">{t('adminmessages.status_new')}</option>
            <option value="read">{t('adminmessages.status_read')}</option>
          </select>
        </FormField>
        <FormField label={t('adminmessages.filter_direction')} htmlFor="messages-filter-direction">
          <select
            id="messages-filter-direction"
            className={selectClass}
            value={direction}
            onChange={(event) => {
              setDirection(filterDirection(event.target.value))
              setPage(1)
            }}
          >
            <option value="">{t('adminmessages.direction_all')}</option>
            <option value="inbound">{t('adminmessages.direction_inbound')}</option>
            <option value="outbound">{t('adminmessages.direction_outbound')}</option>
          </select>
        </FormField>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div className="grid gap-2">
          <ErrorNotice error={messages.error} />
          {messages.isPending ? (
            <p className="text-muted-foreground text-sm">{t('common.loading')}</p>
          ) : null}
          {messages.data ? (
            <>
              <DataTable
                columns={columns}
                rows={messages.data.items}
                rowKey={(message) => message.id}
                emptyText={t('adminmessages.empty')}
              />
              <Pagination
                page={page}
                pageSize={messages.data.page_size}
                total={messages.data.total}
                onChange={setPage}
              />
            </>
          ) : null}
        </div>

        <section aria-label={t('adminmessages.detail_title')} className="grid min-w-0 gap-5">
          {selectedId === null ? (
            <p className="text-muted-foreground text-sm">{t('adminmessages.select_hint')}</p>
          ) : (
            <MessageDetail
              key={selectedId}
              id={selectedId}
              onDeleted={() => setSelectedId(null)}
            />
          )}
        </section>
      </div>
    </div>
  )
}

/** Loads one message. Reading it never changes its status. */
function MessageDetail({ id, onDeleted }: { id: number; onDeleted: () => void }) {
  const message = useAdminMessage(id)
  if (message.isPending) {
    return <p className="text-muted-foreground text-sm">{t('common.loading')}</p>
  }
  if (message.isError) return <ErrorNotice error={message.error} />
  return <MessageView message={message.data} onDeleted={onDeleted} />
}

function MessageView({ message, onDeleted }: { message: AdminMessage; onDeleted: () => void }) {
  const update = useUpdateAdminMessage(message.id)
  const remove = useDeleteAdminMessage()
  // The note is edited locally; the parent keys this view by message, so each message starts clean.
  const [note, setNote] = useState(message.admin_note ?? '')
  const [confirmOpen, setConfirmOpen] = useState(false)

  function saveNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // An emptied note is sent as null, which clears the stored note.
    update.mutate({ admin_note: note.trim() || null })
  }

  return (
    <>
      <div className="grid gap-2">
        <h2 className="text-lg font-semibold break-words">{message.subject}</h2>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="outline">{directionLabel(message.direction)}</Badge>
          {statusBadge(message.status)}
          <time dateTime={message.created_at} className="text-muted-foreground">
            {formatDate(message.created_at)}
          </time>
        </div>
      </div>

      <dl className="grid gap-2 text-sm">
        <DetailRow label={t('adminmessages.column_sender')}>{message.name}</DetailRow>
        <DetailRow label={t('adminmessages.detail_email')}>{message.email}</DetailRow>
        {message.phone ? (
          <DetailRow label={t('adminmessages.detail_phone')}>{message.phone}</DetailRow>
        ) : null}
      </dl>
      {/* Plain text: the body is user input and must never be rendered as markup. */}
      <p className="text-sm break-words whitespace-pre-line">{message.body}</p>

      <ErrorNotice error={update.error} />
      <ErrorNotice error={remove.error} />
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          disabled={update.isPending}
          onClick={() => update.mutate({ status: message.status === 'new' ? 'read' : 'new' })}
        >
          {message.status === 'new'
            ? t('adminmessages.mark_read')
            : t('adminmessages.mark_unread')}
        </Button>
        <Button
          variant="destructive"
          disabled={remove.isPending}
          onClick={() => setConfirmOpen(true)}
        >
          {t('adminmessages.delete')}
        </Button>
      </div>

      <form className="grid gap-2" onSubmit={saveNote}>
        <FormField label={t('adminmessages.field_note')} htmlFor="message-admin-note">
          <Textarea
            id="message-admin-note"
            rows={3}
            maxLength={2000}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </FormField>
        <Button type="submit" className="justify-self-start" disabled={update.isPending}>
          {t('adminmessages.save_note')}
        </Button>
      </form>

      {message.user_id !== null ? (
        <ReplyForm userId={message.user_id} />
      ) : (
        <p className="text-muted-foreground text-sm">{t('adminmessages.no_account')}</p>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={t('adminmessages.delete_title')}
        description={t('adminmessages.delete_description')}
        onConfirm={() => {
          setConfirmOpen(false)
          remove.mutate(message.id, { onSuccess: onDeleted })
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  )
}

/** Sends a reply to the customer's account. It is stored as an outbound message. */
function ReplyForm({ userId }: { userId: number }) {
  const reply = useReplyToMessage()
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  // Field errors appear after the first submit attempt, then follow the inputs.
  const [attempted, setAttempted] = useState(false)

  const subjectError = subject.trim() === '' ? t('adminmessages.required') : undefined
  const bodyError = body.trim() === '' ? t('adminmessages.required') : undefined

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (reply.isPending) return // a second submit must not send a second reply
    setAttempted(true)
    if (subjectError || bodyError) return
    reply.mutate(
      { user_id: userId, subject: subject.trim(), body: body.trim() },
      {
        onSuccess: () => {
          setSubject('')
          setBody('')
          setAttempted(false)
        },
      },
    )
  }

  return (
    <section className="grid gap-3">
      <h3 className="font-semibold">{t('adminmessages.reply_title')}</h3>
      <form className="grid gap-4" noValidate onSubmit={handleSubmit}>
        <FormField
          label={t('adminmessages.reply_subject')}
          htmlFor="message-reply-subject"
          error={attempted ? subjectError : undefined}
        >
          <Input
            id="message-reply-subject"
            maxLength={200}
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
          />
        </FormField>
        <FormField
          label={t('adminmessages.reply_body')}
          htmlFor="message-reply-body"
          error={attempted ? bodyError : undefined}
        >
          <Textarea
            id="message-reply-body"
            rows={4}
            maxLength={5000}
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
        </FormField>
        <ErrorNotice error={reply.error} />
        {reply.isSuccess ? (
          <p role="status" className="text-sm">
            {t('adminmessages.reply_sent')}
          </p>
        ) : null}
        <Button type="submit" className="justify-self-start" disabled={reply.isPending}>
          {t('adminmessages.reply_send')}
        </Button>
      </form>
    </section>
  )
}

/** One label and value of the detail panel. The value is plain text, never markup. */
function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[8rem_1fr] sm:gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="break-words">{children}</dd>
    </div>
  )
}

/** From the store's side: `inbound` came from the customer, `outbound` was sent by the store. */
function directionLabel(direction: Message['direction']): string {
  return direction === 'inbound'
    ? t('adminmessages.direction_inbound')
    : t('adminmessages.direction_outbound')
}

function statusBadge(status: Message['status']) {
  return (
    <Badge variant={status === 'new' ? 'default' : 'outline'}>
      {status === 'new' ? t('adminmessages.status_new') : t('adminmessages.status_read')}
    </Badge>
  )
}

function filterStatus(value: string): '' | Message['status'] {
  return value === 'new' || value === 'read' ? value : ''
}

function filterDirection(value: string): '' | Message['direction'] {
  return value === 'inbound' || value === 'outbound' ? value : ''
}
