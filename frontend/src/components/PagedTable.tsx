import type { UseQueryResult } from '@tanstack/react-query'
import { type Column, DataTable } from '@/components/DataTable'
import { ErrorNotice } from '@/components/ErrorNotice'
import { LoadingNotice } from '@/components/LoadingNotice'
import { Pagination } from '@/components/Pagination'
import type { Page } from '@/lib/types'

interface PagedTableProps<T> {
  query: UseQueryResult<Page<T>>
  columns: Column<T>[]
  rowKey: (row: T) => string | number
  emptyText: string
  page: number
  onPageChange: (page: number) => void
}

/** Error, loading and paginated data table for list pages. */
export function PagedTable<T>({
  query,
  columns,
  rowKey,
  emptyText,
  page,
  onPageChange,
}: PagedTableProps<T>) {
  return (
    <>
      <ErrorNotice error={query.error} />
      {query.isPending ? <LoadingNotice /> : null}
      {query.data ? (
        <>
          <DataTable
            columns={columns}
            rows={query.data.items}
            rowKey={rowKey}
            emptyText={emptyText}
          />
          <Pagination
            page={page}
            pageSize={query.data.page_size}
            total={query.data.total}
            onChange={onPageChange}
          />
        </>
      ) : null}
    </>
  )
}
