import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { UseQueryResult } from '@tanstack/react-query'
import type { Column } from '@/components/DataTable'
import { PagedTable } from '@/components/PagedTable'
import { ApiError } from '@/lib/api'
import { errorMessage, t } from '@/lib/i18n'
import type { Page } from '@/lib/types'

type Row = { id: number; name: string }

const columns: Column<Row>[] = [
  { key: 'name', header: 'Ad', cell: (row) => row.name },
]

describe('PagedTable', () => {
  it('shows the loading text while the query is pending', () => {
    const query = { isPending: true, error: null, data: undefined } as unknown as UseQueryResult<Page<Row>>
    render(
      <PagedTable
        query={query}
        columns={columns}
        rowKey={(row) => row.id}
        emptyText="Empty"
        page={1}
        onPageChange={vi.fn()}
      />
    )
    expect(screen.getByText(t('common.loading'))).toBeInTheDocument()
  })

  it('shows the translated error', () => {
    const error = new ApiError(404, 'not_found')
    const query = { isPending: false, error, data: undefined } as unknown as UseQueryResult<Page<Row>>
    render(
      <PagedTable
        query={query}
        columns={columns}
        rowKey={(row) => row.id}
        emptyText="Empty"
        page={1}
        onPageChange={vi.fn()}
      />
    )
    expect(screen.getByRole('alert')).toHaveTextContent(errorMessage(new ApiError(404, 'not_found')))
  })

  it('shows the rows and the pager, and pages forward', async () => {
    const onPageChange = vi.fn()
    const query = {
      isPending: false,
      error: null,
      data: { items: [{ id: 1, name: 'Kart' }], total: 25, page: 1, page_size: 20 },
    } as unknown as UseQueryResult<Page<Row>>
    render(
      <PagedTable
        query={query}
        columns={columns}
        rowKey={(row) => row.id}
        emptyText="Empty"
        page={1}
        onPageChange={onPageChange}
      />
    )
    expect(screen.getByText('Kart')).toBeInTheDocument()
    expect(screen.getByText(t('common.page_of', { page: 1, pages: 2 }))).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: t('common.next') }))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })
})
