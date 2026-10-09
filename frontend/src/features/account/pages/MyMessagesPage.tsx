import { type Column, DataTable } from '@/components/DataTable'
import { ErrorNotice } from '@/components/ErrorNotice'
import { LoadingNotice } from '@/components/LoadingNotice'
import { PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/Pagination'
import { useMyMessages } from '@/features/account/hooks/useMyMessages'
import { formatDate } from '@/lib/format'
import { t } from '@/lib/i18n'
import type { Message } from '@/lib/types'
import { usePageParam } from '@/lib/usePageParam'

export default function MyMessagesPage() {
  const [page, changePage] = usePageParam()
  // The page number lives in the URL, so that Back from another page returns to the same page.
  const messages = useMyMessages(page)

  const columns: Column<Message>[] = [
    {
      key: 'direction',
      header: t('account.column_direction'),
      cell: (message) => directionLabel(message.direction),
    },
    {
      key: 'subject',
      header: t('account.column_subject'),
      cell: (message) => message.subject,
    },
    {
      key: 'body',
      header: t('account.column_message'),
      // Plain text: the body is user input and must never be rendered as markup.
      cell: (message) => <span className="whitespace-pre-line">{message.body}</span>,
    },
    {
      key: 'created_at',
      header: t('account.column_date'),
      cell: (message) => (
        <time dateTime={message.created_at}>{formatDate(message.created_at)}</time>
      ),
    },
  ]

  return (
    <div className="grid gap-6">
      <PageHeader title={t('account.messages_title')} />
      <ErrorNotice error={messages.error} />
      {messages.isPending ? (
        <LoadingNotice />
      ) : null}
      {messages.data ? (
        <>
          <DataTable
            columns={columns}
            rows={messages.data.items}
            rowKey={(message) => message.id}
            emptyText={t('account.messages_empty')}
          />
          <Pagination
            page={page}
            pageSize={messages.data.page_size}
            total={messages.data.total}
            onChange={changePage}
          />
        </>
      ) : null}
    </div>
  )
}

/** From the customer's side: `inbound` was sent by them, `outbound` came from the store. */
function directionLabel(direction: Message['direction']): string {
  return direction === 'inbound' ? t('account.direction_inbound') : t('account.direction_outbound')
}
