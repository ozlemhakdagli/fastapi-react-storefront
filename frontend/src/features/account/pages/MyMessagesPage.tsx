import { useSearchParams } from 'react-router'
import { LoadingNotice } from '@/components/LoadingNotice'
import { type Column, DataTable } from '@/components/DataTable'
import { ErrorNotice } from '@/components/ErrorNotice'
import { PageHeader } from '@/components/PageHeader'
import { Pagination } from '@/components/Pagination'
import { useMyMessages } from '@/features/account/hooks/useMyMessages'
import { formatDate } from '@/lib/format'
import { t } from '@/lib/i18n'
import type { Message } from '@/lib/types'

export default function MyMessagesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  // The page number lives in the URL, so that Back from another page returns to the same page.
  const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '', 10) || 1)
  const messages = useMyMessages(page)

  function changePage(next: number) {
    setSearchParams((previous) => {
      const params = new URLSearchParams(previous)
      if (next > 1) params.set('page', String(next))
      else params.delete('page')
      return params
    })
  }

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
